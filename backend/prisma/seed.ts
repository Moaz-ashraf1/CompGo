import "dotenv/config";
import {
  PrismaClient,
  Gender,
  VehicleType,
  CaptainStatus,
} from "../src/generated/prisma/client.js";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const vehicleTypes = [
  VehicleType.CAR,
  VehicleType.MOTORCYCLE,
  VehicleType.BICYCLE,
];

const statuses = [
  CaptainStatus.ACTIVE,
  CaptainStatus.ACTIVE,
  CaptainStatus.ACTIVE,
];


const SEED_PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const captainSeeds = Array.from({ length: 1000 }, (_, index) => {
    const number = index + 1;

    return {
      user: {
        name: `Captain ${number}`,
        phone: `0100000${String(number).padStart(4, "0")}`,
        gender: number % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      },
      captain: {
        passwordHash,
        nationalIdImage: `https://example.com/national-id/${number}.jpg`,
        licenseImage: `https://example.com/license/${number}.jpg`,
        vehicleNumber: `COMP-${String(number).padStart(4, "0")}`,
        vehicleType: vehicleTypes[index % vehicleTypes.length],
        vehicleModel:
          number % 3 === 0
            ? "Toyota Corolla 2022"
            : number % 3 === 1
              ? "Honda 2023"
              : "Mountain Bike",
        amountDue: Math.floor(Math.random() * 1000),
        status: statuses[index % statuses.length],
      },
    };
  });

  // createMany can't create nested relations in one call, so we create each
  // User with its Captain nested in a single write, batched through
  // transactions to avoid opening 1000 individual round trips at once.
  const BATCH_SIZE = 100;
  for (let i = 0; i < captainSeeds.length; i += BATCH_SIZE) {
    const batch = captainSeeds.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map(({ user, captain }) =>
        prisma.user.create({
          data: {
            ...user,
            captain: {
              create: captain,
            },
          },
        })
      )
    );

    console.log(`Seeded captains ${i + 1}-${i + batch.length}`);
  }

  console.log("1000 users + captains created successfully.");

  await prisma.compoundBoundary.deleteMany({});
  await prisma.compoundBoundary.create({
    data: {
      points: [
        { lat: 30.0131, lng: 31.2089 },
        { lat: 30.0131, lng: 31.2189 },
        { lat: 30.0031, lng: 31.2189 },
        { lat: 30.0031, lng: 31.2089 },
        { lat: 30.0131, lng: 31.2089 },
      ],
    },
  });

  console.log("Compound boundary seeded.");

  await prisma.pricingConfig.deleteMany({});
  await prisma.pricingConfig.create({
    data: {
      rideInsideCompoundPrice: 35,
      rideOutsidePricePerKm: 5,
      orderInsideCompoundPrice: 30,
      airportPrice: 280,
    },
  });

  console.log("Pricing config seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });