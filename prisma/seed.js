const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName: 'System Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Created admin user: ${user.email}`);
  } else {
    console.log(`Admin user already exists: ${existingUser.email}`);
    // Optional: Update password if needed, but safer to leave as is for now unless requested
    // await prisma.user.update({
    //   where: { email },
    //   data: { passwordHash: hashedPassword }
    // });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
