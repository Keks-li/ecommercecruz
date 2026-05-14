import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cruzaro.com';
  const password = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', status: 'ACTIVE' },
    create: {
      email,
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });

  console.log('\n--- ADMIN CREATED ---');
  console.log('Email: ' + email);
  console.log('Password: admin123');
  console.log('\n--- BROWSER AUTHENTICATION COMMAND ---');
  console.log(`localStorage.setItem('token', '${token}'); location.reload();`);
  console.log('--------------------------------------\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
