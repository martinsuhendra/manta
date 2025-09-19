import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  try {
    const email = "superadmin@example.com";
    const password = "password123";
    const role = "SUPERADMIN";

    // Check if superadmin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`SUPERADMIN with email ${email} already exists`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the superadmin user
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name: "Super Admin",
        emailVerified: new Date(),
      },
    });

    console.log(`✅ SUPERADMIN created successfully:`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error("❌ Error creating SUPERADMIN:", error);
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
