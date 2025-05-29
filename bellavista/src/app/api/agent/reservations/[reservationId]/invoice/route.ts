import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import {
  Role,
  ReservationStatus,
  RoomType as PrismaRoomType,
} from "@prisma/client";

interface RouteContext {
  params: { reservationId: string };
}

interface GenerateInvoiceBody {
  sendEmail?: boolean;
  clientEmail?: string;
  format?: "png" | "pdf"; // Add format option
}

export async function POST(request: NextRequest, context: RouteContext) {
  // Extract reservationId from URL to bypass params error
  const urlPath = request.nextUrl.pathname;
  const reservationIdMatch = urlPath.match(/\/reservations\/([^/]+)\/invoice$/);
  const reservationId = reservationIdMatch ? reservationIdMatch[1] : null;

  if (!reservationId) {
    return new NextResponse(
      JSON.stringify({ message: "Missing reservationId parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as GenerateInvoiceBody;
  const {
    sendEmail = false,
    clientEmail: emailOverride,
    format = "png",
  } = body;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          profile: { select: { taxId: true } },
        },
      },
      rooms: {
        select: {
          name: true,
          type: true,
          pricePerNight: true,
          roomNumber: true,
        },
      },
    },
  });

  if (!reservation) {
    return NextResponse.json(
      { message: "Reservation not found." },
      { status: 404 }
    );
  }

  if (
    reservation.status !== ReservationStatus.CHECKED_OUT &&
    reservation.status !== ReservationStatus.COMPLETED
  ) {
    return NextResponse.json(
      {
        message:
          "Invoice can typically be generated for checked-out or completed reservations.",
      },
      { status: 400 }
    );
  }

  // Generate QR Code
  const qrData = `${
    process.env.NEXTAUTH_URL || "http://localhost:3000"
  }/client/history?reservationId=${reservationId}`;
  let qrCodeImage = "";
  try {
    qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      width: 200,
      margin: 1,
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
  }

  // Calculate nights
  const nights = Math.max(
    1,
    Math.ceil(
      (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
        (1000 * 3600 * 24)
    )
  );

  // Calculate billing items
  const roomItems = reservation.rooms.map((room) => {
    const itemSubtotal = room.pricePerNight * nights;
    return {
      description: `${room.name || "N/A"} (${
        room.roomNumber || PrismaRoomType[room.type]
      })`,
      nights,
      unitPrice: room.pricePerNight.toFixed(2),
      total: itemSubtotal.toFixed(2),
    };
  });

  const roomSubtotalAmount = roomItems.reduce(
    (sum, item) => sum + parseFloat(item.total),
    0
  );
  const serviceSubtotalAmount = 0;
  const subtotalBeforeTax = roomSubtotalAmount + serviceSubtotalAmount;
  const exampleTaxRate = 0.1;
  const taxes = subtotalBeforeTax * exampleTaxRate;
  const grandTotal = reservation.totalPrice;

  // Generate HTML template optimized for PNG
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.4;
                color: #1a202c;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                min-height: 100vh;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                overflow: hidden;
            }
            
            .invoice-header {
                background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
                color: white;
                padding: 40px;
                position: relative;
                overflow: hidden;
            }
            
            .invoice-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
                z-index: 1;
            }
            
            .header-content {
                position: relative;
                z-index: 2;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            
            .hotel-info h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .hotel-info p {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 300;
            }
            
            .invoice-details {
                text-align: right;
            }
            
            .invoice-details h2 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 12px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .invoice-details p {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 6px;
            }
            
            .invoice-body {
                padding: 40px;
            }
            
            .billing-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px;
                padding: 30px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
            }
            
            .billing-info h3 {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid #4299e1;
            }
            
            .billing-info p {
                color: #4a5568;
                font-size: 14px;
                margin-bottom: 8px;
                line-height: 1.5;
            }
            
            .services-section h3 {
                font-size: 22px;
                font-weight: 600;
                color: #2b6cb0;
                margin-bottom: 24px;
                padding-bottom: 12px;
                border-bottom: 3px solid #4299e1;
                display: flex;
                align-items: center;
            }
            
            .services-section h3::before {
                content: '🏨';
                margin-right: 10px;
                font-size: 20px;
            }
            
            .services-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .services-table th {
                background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
                color: white;
                padding: 18px 15px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .services-table td {
                padding: 18px 15px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 14px;
                color: #4a5568;
                background: white;
            }
            
            .services-table tbody tr:hover {
                background: #f7fafc;
            }
            
            .services-table th:last-child,
            .services-table td:last-child {
                text-align: right;
                font-weight: 600;
            }
            
            .totals-section {
                margin-left: auto;
                width: 350px;
                padding: 25px;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 12px;
                margin-bottom: 30px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                font-size: 15px;
                color: #4a5568;
            }
            
            .total-row.grand-total {
                border-top: 3px solid #2b6cb0;
                padding-top: 18px;
                margin-top: 15px;
                font-size: 20px;
                font-weight: 700;
                color: #1a365d;
                background: white;
                margin: 15px -25px -25px -25px;
                padding: 20px 25px;
                border-radius: 0 0 12px 12px;
            }
            
            .footer-section {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 40px;
                padding: 30px;
                background: #f8fafc;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
            }
            
            .qr-section {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .qr-code img {
                width: 100px;
                height: 100px;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .qr-label {
                margin-top: 8px;
                font-size: 12px;
                color: #718096;
                text-align: center;
            }
            
            .payment-status {
                text-align: right;
            }
            
            .payment-status p {
                color: #38a169;
                font-weight: 600;
                font-size: 18px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }
            
            .payment-status p::before {
                content: '✓';
                background: #38a169;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 8px;
                font-size: 14px;
            }
            
            .stay-dates {
                color: #718096;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .thank-you {
                text-align: center;
                margin-top: 30px;
                padding: 25px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                position: relative;
                overflow: hidden;
            }
            
            .thank-you::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="stars" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23stars)"/></svg>');
                opacity: 0.3;
            }
            
            .thank-you-content {
                position: relative;
                z-index: 2;
            }
            
            .thank-you h4 {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 12px;
            }
            
            .thank-you p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .generation-info {
                text-align: center;
                margin-top: 25px;
                color: #a0aec0;
                font-size: 12px;
                padding: 15px;
                background: #f7fafc;
                border-radius: 8px;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">
                <div class="header-content">
                    <div class="hotel-info">
                        <h1>BELLAVISTA HOTEL</h1>
                        <p>Luxury Hospitality Excellence</p>
                    </div>
                    <div class="invoice-details">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> INV-${reservationId
                          .substring(0, 8)
                          .toUpperCase()}</p>
                        <p><strong>Reservation ID:</strong> ${reservationId}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            
            <div class="invoice-body">
                <div class="billing-section">
                    <div class="billing-info">
                        <h3>Billed To:</h3>
                        <p><strong>${reservation.client.name}</strong></p>
                        <p>${reservation.client.email}</p>
                        ${
                          reservation.client.phone
                            ? `<p>${reservation.client.phone}</p>`
                            : ""
                        }
                        <p>Tax ID: ${
                          reservation.client.profile?.taxId || "N/A"
                        }</p>
                    </div>
                    
                    <div class="billing-info">
                        <h3>Hotel Details:</h3>
                        <p><strong>Bellavista Luxury Stay</strong></p>
                        <p>123 Ocean Drive, Paradise City</p>
                        <p>Contact: +1234567890</p>
                        <p>Email: info@bellavista.com</p>
                    </div>
                </div>
                
                <div class="services-section">
                    <h3>Stay & Service Details</h3>
                    <table class="services-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: center;">Nights/Qty</th>
                                <th style="text-align: right;">Unit Price (MAD)</th>
                                <th style="text-align: right;">Total (MAD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${roomItems
                              .map(
                                (item) => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td style="text-align: center;">${item.nights}</td>
                                    <td style="text-align: right;">${item.unitPrice}</td>
                                    <td style="text-align: right;">${item.total}</td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                
                <div class="totals-section">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>${subtotalBeforeTax.toFixed(2)} MAD</span>
                    </div>
                    <div class="total-row">
                        <span>Taxes (10%):</span>
                        <span>${taxes.toFixed(2)} MAD</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Grand Total:</span>
                        <span>${grandTotal.toFixed(2)} MAD</span>
                    </div>
                </div>
                
                <div class="footer-section">
                    ${
                      qrCodeImage
                        ? `
                        <div class="qr-section">
                            <div class="qr-code">
                                <img src="${qrCodeImage}" alt="QR Code" />
                            </div>
                            <div class="qr-label">Scan for reservation details</div>
                        </div>
                    `
                        : "<div></div>"
                    }
                    
                    <div class="payment-status">
                        <p>Payment Status: PAID</p>
                        <div class="stay-dates">
                            <strong>Check-in:</strong> ${reservation.checkIn.toLocaleDateString()}<br>
                            <strong>Check-out:</strong> ${reservation.checkOut.toLocaleDateString()}
                        </div>
                    </div>
                </div>
                
                <div class="thank-you">
                    <div class="thank-you-content">
                        <h4>Thank you for choosing Bellavista Hotel!</h4>
                        <p>We hope to see you again soon for another exceptional stay.</p>
                    </div>
                </div>
                
                <div class="generation-info">
                    <p>Generated: ${new Date().toLocaleString()} | Format: PNG Invoice</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  // Generate PNG with Puppeteer
  let imageBuffer;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 900,
      height: 1200,
      deviceScaleFactor: 2, // For high-DPI rendering
    });

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Take screenshot
    imageBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    await browser.close();
  } catch (error) {
    console.error("PNG generation failed:", error);
    return NextResponse.json(
      { message: "Failed to generate PNG. Please try again later." },
      { status: 500 }
    );
  }

  // Check if client expects JSON and provide a fallback
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader && acceptHeader.includes("application/json")) {
    return NextResponse.json(
      {
        message: "PNG generated",
        downloadUrl: `/api/agent/reservations/${reservationId}/invoice/download?format=png`,
      },
      { status: 200 }
    );
  }

  return new NextResponse(imageBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename=invoice-${reservationId}.png`,
    },
  });
}
