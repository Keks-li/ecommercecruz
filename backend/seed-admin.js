/**
 * seed-admin.js
 * Run inside the backend container to create an admin account.
 * Usage: node seed-admin.js
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'admin@cruzaro.com';
const ADMIN_PASSWORD = 'Admin@1234';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`✅ Admin already exists: ${ADMIN_EMAIL}`);
    } else {
      // Upgrade the existing user to ADMIN
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { role: 'ADMIN', status: 'ACTIVE' },
      });
      console.log(`✅ Upgraded existing user to ADMIN: ${ADMIN_EMAIL}`);
    }
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin created!`);
  console.log(`   Email   : ${admin.email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
