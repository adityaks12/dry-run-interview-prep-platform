// scripts/test-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.session.create({
    data: { interviewType: 'product_manager' }
  });
  console.log('created session:', s);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
