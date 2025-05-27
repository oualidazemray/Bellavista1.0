import {
  PrismaClient,
  Role,
  RoomType,
  AlertType,
  RoomView,
  ReservationStatus,
  NotificationType,
} from "@prisma/client";

import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // --- User Credentials ---
  const userEmail = "ay@gmail.com";
  const userPassword = "ay@gmail.comay@gmail.comay@gmail.com"; // The password you provided

  // --- Create or Update User 'ay@gmail.com' ---
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

  let targetUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      // Update these fields if user already exists
      name: "oualid ads", // Or the correct full name
      password: hashedPassword, // Update password if it changed
      phone: "0657983711", // Example phone
      profileImageUrl: "/profile-placeholder.png",
      bio: "sdaaaaaa ay@gmail.com",
      role: Role.CLIENT, // Ensure role is client
      isEmailVerified: true, // Assuming verified for seed
    },
    create: {
      email: userEmail,
      name: "Aymane Client", // Or the correct full name
      password: hashedPassword,
      role: Role.CLIENT,
      isEmailVerified: true,
      phone: "0600000000",
      profileImageUrl:
        "https://www.freepik.com/premium-vector/person-profile-avatar-silhouette-user-icon-placeholder-human-anonymous-identity_412255457.htm",
      bio: "Enjoys modern art and quiet retreats. Frequent traveler.",
      profile: {
        // ClientProfile specific data
        create: {
          taxId: "AYM789TAX", // Example taxId
        },
      },
    },
    include: { profile: true },
  });
  console.log(
    `Upserted user: ${targetUser.name} (ID: ${targetUser.id}) with email ${targetUser.email}`
  );

  // --- Create Rooms (Ensure these exist or create them) ---
  const room1 = await prisma.room.upsert({
    where: { roomNumber: "101" },
    update: {},
    create: {
      name: "Deluxe Ocean View King",
      roomNumber: "101",
      type: RoomType.SUITE,
      floor: 1,
      pricePerNight: 250.0,
      imageUrl:
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
      imageUrls: [
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
      ],
      maxGuests: 2,
      beds: 1,
      bedConfiguration: "1 King Bed",
      view: RoomView.OCEAN,
      characteristics: ["wifi", "ac", "balcony"],
      sqMeters: 45.5,
      featured: true,
      rating: 4.8,
    },
  });
  const room2 = await prisma.room.upsert({
    where: { roomNumber: "205" },
    update: {},
    create: {
      name: "Standard City View Twin",
      roomNumber: "205",
      type: RoomType.DOUBLE,
      floor: 2,
      pricePerNight: 120.0,
      imageUrl:
        "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=600",
      imageUrls: [
        "https://images.pexels.com/photos/1838554/pexels-photo-1838554.jpeg?auto=compress&cs=tinysrgb&w=600",
      ],
      maxGuests: 2,
      beds: 2,
      bedConfiguration: "2 Twin Beds",
      view: RoomView.CITY,
      characteristics: ["wifi", "ac", "tv"],
      sqMeters: 25.0,
    },
  });
  console.log(`Upserted rooms 101 and 205.`);

  // --- Create Reservations for targetUser (ay@gmail.com) ---
  const now = new Date();
  // Upcoming
  const upcomingCheckIn = new Date(now);
  upcomingCheckIn.setDate(now.getDate() + 5); // 5 days from now
  const upcomingCheckOut = new Date(upcomingCheckIn);
  upcomingCheckOut.setDate(upcomingCheckIn.getDate() + 3); // 3 nights

  // Completed
  const completedCheckOut = new Date(now);
  completedCheckOut.setDate(now.getDate() - 10); // Checked out 10 days ago
  const completedCheckIn = new Date(completedCheckOut);
  completedCheckIn.setDate(completedCheckOut.getDate() - 2); // 2 night stay

  // Cancelled
  const cancelledCheckIn = new Date(now);
  cancelledCheckIn.setDate(now.getDate() - 30); // Was supposed to be 30 days ago
  const cancelledCheckOut = new Date(cancelledCheckIn);
  cancelledCheckOut.setDate(cancelledCheckIn.getDate() + 4);

  const reservationsForTargetUser = [
    {
      id: "seed-res-ay-001-upcoming",
      rooms: { connect: [{ id: room1.id }] },
      checkIn: upcomingCheckIn,
      checkOut: upcomingCheckOut,
      status: ReservationStatus.CONFIRMED,
      totalPrice: room1.pricePerNight * 3,
      numAdults: 2,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // Booked 10 days ago
    },
    {
      id: "seed-res-ay-002-completed",
      rooms: { connect: [{ id: room2.id }] },
      checkIn: completedCheckIn,
      checkOut: completedCheckOut,
      status: ReservationStatus.CHECKED_OUT,
      totalPrice: room2.pricePerNight * 2,
      numAdults: 1,
      createdAt: new Date(completedCheckIn.getTime() - 1000 * 60 * 60 * 24 * 7), // Booked 7 days before check-in
    },
    {
      id: "seed-res-ay-003-cancelled",
      rooms: { connect: [{ id: room1.id }] },
      checkIn: cancelledCheckIn,
      checkOut: cancelledCheckOut,
      status: ReservationStatus.CANCELED, // <<< CANCELLED STATUS
      totalPrice: room1.pricePerNight * 4,
      numAdults: 1,
      numChildren: 0,
      createdAt: new Date(cancelledCheckIn.getTime() - 1000 * 60 * 60 * 24 * 5), // Booked 5 days before original check-in
    },
  ];

  for (const resData of reservationsForTargetUser) {
    await prisma.reservation.upsert({
      where: { id: resData.id },
      update: {
        // Ensure key fields are updated if record exists
        status: resData.status,
        checkIn: resData.checkIn,
        checkOut: resData.checkOut,
        totalPrice: resData.totalPrice,
      },
      create: {
        ...resData,
        clientId: targetUser.id, // Link to ay@gmail.com user
      },
    });
    console.log(
      `Upserted reservation ${resData.id} for ${targetUser.name} with status ${resData.status}`
    );
  }

  // --- Create Feedback for a Completed Reservation (seed-res-ay-002-completed) ---
  const completedReservationForFeedback = await prisma.reservation.findUnique({
    where: { id: "seed-res-ay-002-completed" },
  });
  if (completedReservationForFeedback) {
    await prisma.feedback.upsert({
      where: {
        user_reservation_feedback: {
          userId: targetUser.id,
          reservationId: completedReservationForFeedback.id,
        },
      },
      update: {
        rating: 5, // Update rating if feedback already exists
        message:
          "Absolutely wonderful experience! The city view was spectacular and the service was top-notch. Highly recommend this room.",
      },
      create: {
        userId: targetUser.id,
        reservationId: completedReservationForFeedback.id,
        rating: 5,
        message:
          "Absolutely wonderful experience! The city view was spectacular and the service was top-notch. Highly recommend this room.",
        createdAt: new Date(
          completedReservationForFeedback.checkOut.getTime() +
            1000 * 60 * 60 * 24
        ), // Day after checkout
      },
    });
    console.log(
      `Upserted feedback for reservation ${completedReservationForFeedback.id} by ${targetUser.name}`
    );
  }

  // --- Create Notifications for targetUser (ay@gmail.com) ---
  const notificationsForTargetUser = [
    {
      type: NotificationType.BOOKING,
      title: `Your booking for ${room1.name} is Confirmed!`,
      message: `Get ready for your stay starting ${upcomingCheckIn.toLocaleDateString()}. We're excited to welcome you!`,
      sender: "Bellavista Reservations",
      link: `/client/history?reservationId=seed-res-ay-001-upcoming`,
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
    }, // 10 mins ago
    {
      type: NotificationType.PROMO,
      title: "Loyalty Member Discount",
      message:
        "As a valued guest, enjoy an exclusive 15% off your next booking with code LOYAL15.",
      sender: "Bellavista Rewards",
      link: "/promos/loyal",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    }, // 5 days ago
  ];

  for (const nt of notificationsForTargetUser) {
    // Simple create for notifications; for upsert, you'd need a reliable unique key other than ID
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: targetUser.id,
        title: nt.title,
        message: nt.message.substring(0, 50),
      },
    });
    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          type: nt.type,
          title: nt.title,
          message: nt.message,
          sender: nt.sender,
          link: nt.link,
          read: nt.read || false,
          createdAt: nt.createdAt,
        },
      });
      console.log(`Created notification for ${targetUser.name}: ${nt.title}`);
    } else {
      console.log(
        `Skipped existing notification for ${targetUser.name}: ${nt.title}`
      );
    }
  }
  // ... (at the end of your main function, before seeding finished log)
  // --- Seeding Alerts ---
  console.log("Seeding Alerts for Admin...");
  // No need to find an admin user for these alerts as they are system-wide for admins via the 'forAdmin' flag.
  // The 'forAdmin: true' flag is what makes them appear on the admin alerts page.

  const alertsToSeed = [
    {
      type: AlertType.PENDING_RESERVATION, // Now AlertType is defined
      message: "New reservation #RES_SEED_001 requires approval.",
      forAdmin: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    },
    {
      type: AlertType.LOW_OCCUPANCY, // Now AlertType is defined
      message: "Hotel occupancy for next week is low. Consider new promotions.",
      forAdmin: true,
      read: true, // Example of a read alert
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      type: AlertType.HIGH_DEMAND, // Now AlertType is defined
      message:
        "High demand detected for the upcoming holiday weekend. Review pricing.",
      forAdmin: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    },
    {
      type: AlertType.PENDING_RESERVATION, // Now AlertType is defined
      message:
        "Reservation #RES_SEED_002 from Test Client needs immediate attention.",
      forAdmin: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
    },
  ];

  for (const alertData of alertsToSeed) {
    // Optional: Check if a very similar alert (e.g., same type and first 50 chars of message) already exists to avoid spamming on re-seed
    const existingAlert = await prisma.alert.findFirst({
      where: {
        type: alertData.type,
        message: { startsWith: alertData.message.substring(0, 50) },
        forAdmin: true,
      },
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: alertData,
      });
      console.log(
        `Created alert: ${alertData.type} - ${alertData.message.substring(
          0,
          30
        )}...`
      );
    } else {
      console.log(
        `Skipped existing alert: ${
          alertData.type
        } - ${alertData.message.substring(0, 30)}...`
      );
    }
  }
  console.log("Admin alerts seeded or skipped if existing.");

  console.log("Seeding finished.");
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
