import "dotenv/config";
import {
  PrismaClient,
  Gender,
  VehicleType,
  CaptainStatus,
} from "../src/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

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
  CaptainStatus.PENDING,
];

async function main() {
  const captains = Array.from({ length: 1000 }, (_, index) => {
    const number = index + 1;

    return {
      name: `Captain ${number}`,
      phone: `0100000${String(number).padStart(4, '0')}`,
      gender: number % 2 === 0 ? Gender.MALE : Gender.FEMALE,

      nationalIdImage: `https://example.com/national-id/${number}.jpg`,
      licenseImage: `https://example.com/license/${number}.jpg`,

      vehicleNumber: `COMP-${String(number).padStart(4, '0')}`,

      vehicleType: vehicleTypes[index % vehicleTypes.length],

      vehicleModel:
        number % 3 === 0
          ? 'Toyota Corolla 2022'
          : number % 3 === 1
            ? 'Honda 2023'
            : 'Mountain Bike',

      amountDue: Math.floor(Math.random() * 1000),
      status: statuses[index % statuses.length],
    };
  });

  await prisma.captain.createMany({
    data: captains,
  });

  console.log('1000 captains created successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });