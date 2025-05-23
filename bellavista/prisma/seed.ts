// prisma/seed.ts
import {
  PrismaClient,
  Role,
  RoomType,
  RoomView,
  ReservationStatus,
  ReservationSource,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Create Users (Client, Agent, Admin) ---
  const clientUser = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      password: "password123", // In a real app, hash this!
      name: "Test Client",
      role: Role.CLIENT,
      isEmailVerified: true,
      profile: {
        create: {
          taxId: "CLIENT_TAX_ID_123",
        },
      },
    },
    include: { profile: true },
  });
  console.log(
    `Created/Found client user: ${clientUser.email} with profile ID: ${clientUser.profile?.id}`
  );

  const agentUser = await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      password: "password123",
      name: "Test Agent",
      role: Role.AGENT,
      isEmailVerified: true,
      agent: {
        create: {},
      },
    },
    include: { agent: true },
  });
  console.log(
    `Created/Found agent user: ${agentUser.email} with agent ID: ${agentUser.agent?.id}`
  );

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: "password123",
      name: "Test Admin",
      role: Role.ADMIN,
      isEmailVerified: true,
      admin: {
        create: {
          twoFASecret: "SUPERSECRET2FAKEY", // Example
        },
      },
    },
    include: { admin: true },
  });
  console.log(
    `Created/Found admin user: ${adminUser.email} with admin ID: ${adminUser.admin?.id}`
  );

  // --- Create Rooms ---
  const roomsToCreate = [
    {
      name: "Deluxe King with City View",
      description:
        "A spacious deluxe room offering stunning city views and a plush king-size bed.",
      roomNumber: "101",
      type: RoomType.SUITE, // Or DOUBLE_CONFORT if more appropriate
      floor: 1,
      pricePerNight: 250.0,
      maxGuests: 2,
      beds: 1,
      bedConfiguration: "1 King Bed",
      view: RoomView.CITY,
      characteristics: ["internet", "ac", "balcony", "tv", "minibar"],
      sqMeters: 45.5,
      imageUrl:
        "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      imageUrls: [
        "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      ],
      featured: true,
      rating: 4.8,
    },
    {
      name: "Standard Twin with Park View",
      description:
        "Comfortable room with two twin beds and a peaceful park view.",
      roomNumber: "102",
      type: RoomType.DOUBLE,
      floor: 1,
      pricePerNight: 150.0,
      maxGuests: 2,
      beds: 2,
      bedConfiguration: "2 Twin Beds",
      view: RoomView.PARK,
      characteristics: ["internet", "tv", "ac"],
      sqMeters: 30.0,
      imageUrl:
        "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      imageUrls: [],
      featured: false,
      rating: 4.2,
    },
    {
      name: "Cozy Single Room",
      description:
        "Perfect for solo travelers, a cozy room with all essentials.",
      roomNumber: "201",
      type: RoomType.SIMPLE,
      floor: 2,
      pricePerNight: 90.0,
      maxGuests: 1,
      beds: 1,
      bedConfiguration: "1 Single Bed",
      view: RoomView.COURTYARD,
      characteristics: ["internet", "tv"],
      sqMeters: 20.0,
      imageUrl:
        "https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      imageUrls: [],
      featured: false,
      rating: 4.0,
    },
    {
      name: "Family Suite with Pool View",
      description: "Large suite ideal for families, overlooking the pool.",
      roomNumber: "305",
      type: RoomType.SUITE,
      floor: 3,
      pricePerNight: 350.0,
      maxGuests: 4, // e.g., 2 adults, 2 children
      beds: 2,
      bedConfiguration: "1 King Bed, 1 Sofa Bed",
      view: RoomView.POOL,
      characteristics: [
        "internet",
        "ac",
        "balcony",
        "tv",
        "minibar",
        "bathtub",
      ],
      sqMeters: 60.0,
      imageUrl:
        "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      imageUrls: [],
      featured: true,
      rating: 4.6,
    },
    {
      name: "Accessible Queen Room",
      description: "A comfortable and accessible room with a queen bed.",
      roomNumber: "105",
      type: RoomType.DOUBLE_CONFORT,
      floor: 1,
      pricePerNight: 180.0,
      maxGuests: 2,
      beds: 1,
      bedConfiguration: "1 Queen Bed",
      view: RoomView.GARDEN,
      characteristics: ["internet", "ac", "accessible_bathroom"], // Add specific characteristics
      sqMeters: 35.0,
      imageUrl:
        "https://images.pexels.com/photos/3659681/pexels-photo-3659681.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      imageUrls: [],
      featured: false,
      rating: 4.4,
    },
  ];

  for (const roomData of roomsToCreate) {
    const room = await prisma.room.upsert({
      where: { roomNumber: roomData.roomNumber },
      update: roomData, // Update if it exists, in case you re-run the seed
      create: roomData,
    });
    console.log(
      `Created/Updated room: ${room.name} (Number: ${room.roomNumber})`
    );
  }

  // --- Create a Sample Reservation ---
  // Get a client and a couple of rooms to create a reservation
  const sampleClient = await prisma.user.findUnique({
    where: { email: "client@example.com" },
  });
  const room101 = await prisma.room.findUnique({
    where: { roomNumber: "101" },
  });
  const room102 = await prisma.room.findUnique({
    where: { roomNumber: "102" },
  });

  if (sampleClient && room101 && room102) {
    // Check if a reservation for this client and room already exists for these dates to avoid duplicates if re-seeding
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        clientId: sampleClient.id,
        checkIn: new Date("2024-09-10T14:00:00.000Z"), // Example check-in
        rooms: { some: { id: room101.id } }, // Check if room101 is part of it
      },
    });

    if (!existingReservation) {
      const reservation1 = await prisma.reservation.create({
        data: {
          clientId: sampleClient.id,
          rooms: {
            connect: [{ id: room101.id }, { id: room102.id }], // Connecting two rooms to this reservation
          },
          checkIn: new Date("2024-09-10T14:00:00.000Z"), // Example check-in
          checkOut: new Date("2024-09-12T11:00:00.000Z"), // Example check-out
          status: ReservationStatus.CONFIRMED,
          totalPrice: (room101.pricePerNight + room102.pricePerNight) * 2, // Price for 2 nights for both rooms
          numAdults: 2,
          numChildren: 1,
          sourceLog: {
            create: {
              source: ReservationSource.WEB,
            },
          },
        },
      });
      console.log(
        `Created reservation ID: ${reservation1.id} for client ${sampleClient.email}`
      );
    } else {
      console.log(
        `Reservation for client ${sampleClient.email} and room ${room101.name} on 2024-09-10 already exists.`
      );
    }
  } else {
    console.log(
      "Could not create sample reservation: client or room not found."
    );
  }

  // --- Create HotelInfo (if you have only one hotel record) ---
  const hotelInfo = await prisma.hotelInfo.upsert({
    where: { name: "The Grand Example Hotel" }, // Use a unique field like name
    update: {
      address: "123 Luxury Lane",
      city: "Metropolis",
      stars: 5,
      latitude: 34.0522,
      longitude: -118.2437,
    },
    create: {
      name: "The Grand Example Hotel",
      address: "123 Luxury Lane",
      city: "Metropolis",
      stars: 5,
      latitude: 34.0522,
      longitude: -118.2437,
    },
  });
  console.log(`Created/Updated hotel info: ${hotelInfo.name}`);

  console.log(`Seeding finished.`);
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
