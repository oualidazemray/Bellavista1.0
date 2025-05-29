// src/app/api/agent/reservations/[reservationId]/invoice/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
  Role,
  ReservationStatus,
  ExportFormat,
  NotificationType,
  RoomType as PrismaRoomType,
  Prisma,
} from "@prisma/client";
import fs from "fs"; // Node.js File System module
import path from "path"; // Node.js Path module
import PdfPrinter from "pdfmake";
import QRCode from "qrcode";

// --- PDFMake Font Setup ---
// 1. Require the vfs_fonts.js. This file contains the font data (like Roboto)
// and typically assigns it to pdfMake.vfs when it's executed.
const pdfMakeVfs = require("pdfmake/build/vfs_fonts.js");

// 2. Define the fonts pdfmake should use.
// These names ('Roboto') must match the font names available in vfs_fonts.js
const fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
  // If you had custom fonts, you'd add their .ttf files to a custom vfs
  // and then define them here. For now, we rely on the default Roboto in vfs_fonts.js.
};

// 3. Create the PdfPrinter instance.
// It should automatically pick up the vfs from the globally-like modified pdfMake object
// if pdfmake/build/vfs_fonts.js correctly populates pdfMake.vfs upon require.
let printer: PdfPrinter;
try {
  // Some versions of pdfmake might expose pdfMake.vfs directly after require
  // If pdfMake is not globally available or vfs is not set, PdfPrinter might default correctly
  // This is a common point of failure in bundling if vfs isn't found.
  if (typeof pdfMake !== "undefined" && pdfMake.vfs) {
    // Check if global pdfMake was populated
    // pdfMake.vfs = pdfMakeVfs.pdfMake.vfs; // This line is usually not needed if require worked.
    // The require itself should execute and set pdfMake.vfs
    console.log(
      "API_INVOICE_ROUTE: pdfMake.vfs seems to be set by require('vfs_fonts.js')."
    );
  } else if (pdfMakeVfs.pdfMake && pdfMakeVfs.pdfMake.vfs) {
    // Forcing it if the require result needs explicit assignment
    // This is less common but a fallback.
    global.pdfMake = global.pdfMake || {}; // Ensure global.pdfMake exists
    global.pdfMake.vfs = pdfMakeVfs.pdfMake.vfs;
    console.log(
      "API_INVOICE_ROUTE: Manually assigned vfsFonts.pdfMake.vfs to global.pdfMake.vfs."
    );
  } else {
    console.warn(
      "API_INVOICE_ROUTE: pdfMake.vfs was not found directly after requiring vfs_fonts.js. Relying on PdfPrinter default font loading."
    );
  }
  printer = new PdfPrinter(fonts);
} catch (fontError) {
  console.error(
    "API_INVOICE_ROUTE: Error initializing PdfPrinter with fonts. PDFMake might not find its fonts.",
    fontError
  );
  // Fallback to a printer without custom font definitions if initialization fails
  // This will likely only support very basic PDF generation without proper font metrics.
  printer = new PdfPrinter();
}
// --- End PDFMake Font Setup ---

interface RouteContext {
  params: {
    reservationId: string;
  };
}

interface GenerateInvoiceBody {
  sendEmail?: boolean;
  clientEmail?: string; // For overriding or confirming email address
}

export async function POST(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { reservationId } = context.params;

  if (
    !token ||
    !token.id ||
    (token.role !== Role.AGENT && token.role !== Role.ADMIN)
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const actionUserId = token.id as string;
  const actionUserName = token.name || "System"; // Name of the agent/admin generating

  console.log(
    `API_GENERATE_INVOICE: User ${actionUserId} processing Res ID: ${reservationId}`
  );

  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as GenerateInvoiceBody;
    const { sendEmail = false, clientEmail: emailOverride } = body;

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
        // Include consumptions if they should be on the invoice
        // consumptions: { include: { service: { select: { name: true, price: true } } } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { message: "Reservation not found." },
        { status: 404 }
      );
    }
    // Allow invoice generation for CHECKED_OUT or COMPLETED.
    // Or even CONFIRMED if you want pro-forma invoices. Adjust as needed.
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

    // --- Generate QR Code ---
    const qrDataBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const qrData = `${qrDataBaseUrl}/client/history?reservationId=${reservationId}`; // Example link
    let qrCodeImage = "";
    try {
      qrCodeImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "M",
        width: 70,
        margin: 1,
      });
    } catch (qrErr) {
      console.error("API_GENERATE_INVOICE: Failed to generate QR Code", qrErr);
    }

    // --- Define PDF Document ---
    const nights = Math.max(
      1,
      Math.ceil(
        (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
          (1000 * 3600 * 24)
      )
    );

    // Detailed room breakdown for table
    const roomItems = reservation.rooms.map((room) => {
      const itemSubtotal = room.pricePerNight * nights;
      return [
        {
          text: `${room.name || "N/A"} (${
            room.roomNumber || PrismaRoomType[room.type]
          })`,
          style: "tableCell",
        },
        { text: nights.toString(), style: "tableCell", alignment: "center" },
        {
          text: room.pricePerNight.toFixed(2),
          style: "tableCell",
          alignment: "right",
        },
        {
          text: itemSubtotal.toFixed(2),
          style: "tableCell",
          alignment: "right",
        },
      ];
    });
    const roomSubtotalAmount = roomItems.reduce(
      (sum, item) => sum + parseFloat(item[3].text),
      0
    );

    // TODO: Add service consumptions to the invoice if applicable
    // const serviceItems = reservation.consumptions.map(con => ...);
    // const serviceSubtotalAmount = serviceItems.reduce(...);
    const serviceSubtotalAmount = 0; // Placeholder

    const subtotalBeforeTax = roomSubtotalAmount + serviceSubtotalAmount;
    const exampleTaxRate = 0.1; // 10%
    const taxes = subtotalBeforeTax * exampleTaxRate;
    const grandTotal = reservation.totalPrice; // Use the already calculated and stored totalPrice

    const docDefinition: any = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60], // [left, top, right, bottom]
      header: {
        columns: [
          {
            text: "BELLAVISTA HOTEL",
            style: "pageHeader",
            alignment: "left",
            margin: [40, 20, 0, 0],
          },
          {
            text: `Invoice / Guest Folio`,
            style: "pageSubheader",
            alignment: "right",
            margin: [0, 20, 40, 0],
          },
        ],
      },
      footer: function (currentPage: number, pageCount: number) {
        return {
          text: `Page ${currentPage.toString()} of ${pageCount} | Generated: ${new Date().toLocaleString()}`,
          alignment: "center",
          style: "pageFooter",
          margin: [0, 20, 0, 30],
        };
      },
      content: [
        {
          text: `Invoice #: INV-${reservationId.substring(0, 8).toUpperCase()}`,
          style: "invoiceInfo",
          alignment: "right",
        },
        {
          text: `Reservation ID: ${reservationId}`,
          style: "invoiceInfo",
          alignment: "right",
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "60%",
              text: [
                { text: "Billed To:\n", style: "sectionHeaderSmall" },
                { text: `${reservation.client.name}\n`, bold: true },
                `${reservation.client.email}\n`,
                `${reservation.client.phone || ""}\n`,
                `Tax ID: ${reservation.client.profile?.taxId || "N/A"}`,
              ],
            },
            {
              width: "40%",
              alignment: "right",
              text: [
                { text: "Hotel Details:\n", style: "sectionHeaderSmall" },
                "Bellavista Luxury Stay\n",
                "123 Ocean Drive, Paradise City\n",
                "Contact: +1234567890\n",
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          text: "Stay & Service Details",
          style: "sectionHeader",
          margin: [0, 0, 0, 5],
        },
        {
          table: {
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Description (Room/Service)", style: "tableHeader" },
                {
                  text: "Nights/Qty",
                  style: "tableHeader",
                  alignment: "center",
                },
                {
                  text: "Unit Price (MAD)",
                  style: "tableHeader",
                  alignment: "right",
                },
                {
                  text: "Total (MAD)",
                  style: "tableHeader",
                  alignment: "right",
                },
              ],
              ...roomItems,
              // ...serviceItems, // Add if you have them
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 15],
        },
        {
          columns: [
            qrCodeImage
              ? {
                  image: qrCodeImage,
                  width: 60,
                  margin: [0, 10, 20, 0],
                  alignment: "left",
                }
              : { text: "", width: 60 },
            {
              width: "*",
              alignment: "right",
              stack: [
                {
                  text: `Subtotal: ${subtotalBeforeTax.toFixed(2)} MAD`,
                  margin: [0, 0, 0, 2],
                },
                {
                  text: `Taxes (${(exampleTaxRate * 100).toFixed(
                    0
                  )}%): ${taxes.toFixed(2)} MAD`,
                  margin: [0, 0, 0, 2],
                },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 5,
                      x2: 150,
                      y2: 5,
                      lineWidth: 0.5,
                      lineColor: "#古典BDC3C7",
                    },
                  ],
                  alignment: "right",
                  width: 150,
                  margin: [0, 2, 0, 2],
                }, // Horizontal line
                {
                  text: `Grand Total: ${grandTotal.toFixed(2)} MAD`,
                  style: "grandTotal",
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          columnGap: 10,
        },
        {
          text: "Payment Status: PAID (Simulated)",
          style: "paymentStatus",
          margin: [0, 20, 0, 0],
        },
        {
          text: "Thank you for choosing Bellavista Hotel! We hope to see you again soon.",
          style: "footerText",
          alignment: "center",
          margin: [0, 30, 0, 0],
        },
      ],
      styles: {
        pageHeader: { fontSize: 10, bold: true, color: "#34495e" },
        pageSubheader: { fontSize: 10, color: "#7f8c8d" },
        header: { fontSize: 22, bold: true, color: "#2c3e50" },
        subheader: { fontSize: 16, bold: true, color: "#34495e" },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 5],
          color: "#2980b9",
        },
        sectionHeaderSmall: {
          fontSize: 10,
          bold: true,
          color: "#7f8c8d",
          margin: [0, 0, 0, 2],
        },
        invoiceInfo: { fontSize: 9, color: "#7f8c8d" },
        tableHeader: { bold: true, fontSize: 9, color: "#34495e" },
        tableCell: { fontSize: 9, color: "#333" },
        grandTotal: { fontSize: 14, bold: true, color: "#2c3e50" },
        paymentStatus: {
          fontSize: 10,
          bold: true,
          color: "green",
          alignment: "right",
        },
        footerText: { fontSize: 9, italics: true, color: "#7f8c8d" },
        pageFooter: { fontSize: 8, color: "#aaaaaa" },
      },
      defaultStyle: { font: "Roboto", fontSize: 10, color: "#444" },
    };

    // --- Generate PDF Buffer ---
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Uint8Array[] = [];
      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err) => reject(err));
      pdfDoc.end();
    });

    // --- Save PDF to File System ---
    const invoiceDirectory = path.join(process.cwd(), "public", "invoices");
    if (!fs.existsSync(invoiceDirectory)) {
      fs.mkdirSync(invoiceDirectory, { recursive: true });
    }
    const fileName = `Bellavista-Invoice-${reservationId.substring(0, 8)}.pdf`;
    const filePath = path.join(invoiceDirectory, fileName);
    const relativeFilePath = `/invoices/${fileName}`;

    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`API_GENERATE_INVOICE: PDF Invoice saved to: ${filePath}`);

    // --- Update or Create Invoice Record in DB ---
    let invoice = await prisma.invoice.findUnique({
      where: { reservationId: reservationId },
    });
    if (invoice) {
      invoice = await prisma.invoice.update({
        where: { reservationId: reservationId },
        data: {
          fileUrl: relativeFilePath,
          sentByEmail: sendEmail ? true : invoice.sentByEmail,
          updatedAt: new Date(),
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: {
          reservationId: reservationId,
          fileUrl: relativeFilePath,
          sentByEmail: sendEmail,
        },
      });
    }
    console.log(
      `API_GENERATE_INVOICE: Invoice DB record ${invoice.id} ${
        invoice ? "updated" : "created"
      }.`
    );

    await prisma.invoiceExport.create({
      data: {
        invoiceId: invoice.id,
        userId: actionUserId,
        format: ExportFormat.PDF,
      },
    });

    // --- Simulate Sending Email (if requested) ---
    let emailSentMessage = "";
    if (sendEmail) {
      const emailToSendTo = emailOverride || reservation.client.email;
      console.log(
        `API_GENERATE_INVOICE: Simulating sending invoice PDF (${relativeFilePath}) to ${emailToSendTo}`
      );
      // TODO: Implement actual email sending logic (e.g., Nodemailer, Resend, SendGrid)
      // For now, we've already updated sentByEmail status.
      emailSentMessage = ` Email "sent" to ${emailToSendTo}.`;
    }

    return NextResponse.json({
      message: `Invoice generated successfully.${emailSentMessage}`,
      invoiceId: invoice.id,
      fileUrl: relativeFilePath,
      sentByEmail: invoice.sentByEmail,
    });
  } catch (error: any) {
    console.error(
      `API_GENERATE_INVOICE_ERROR (Res ID: ${reservationId}):`,
      error
    );
    return NextResponse.json(
      { message: "Error processing invoice", detail: error.message },
      { status: 500 }
    );
  }
}
