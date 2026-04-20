import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed super admin users");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString: databaseUrl,
  }),
});

async function seedSuperAdmin() {
  try {
    const seedUsers = [
      {
        email: "superadmin@example.com",
        password: "password123",
        role: "SUPERADMIN",
        name: "Super Admin",
      },
      {
        email: "developer@example.com",
        password: "password123",
        role: "DEVELOPER",
        name: "Developer",
      },
      {
        email: "teacher@example.com",
        password: "password123",
        role: "TEACHER",
        name: "Teacher",
      },
    ];

    for (const seedUser of seedUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: seedUser.email },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (existingUser) {
        console.log(`${seedUser.role} with email ${seedUser.email} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(seedUser.password, 12);

      const createdUser = await prisma.user.create({
        data: {
          email: seedUser.email,
          password: hashedPassword,
          role: seedUser.role,
          name: seedUser.name,
          emailVerified: new Date(),
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      console.log(`✅ ${seedUser.role} created successfully:`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Role: ${createdUser.role}`);
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   Password: ${seedUser.password}`);
    }
  } catch (error) {
    console.error("❌ Error seeding privileged users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSuperAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
