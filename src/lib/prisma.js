const { PrismaClient } = require('@prisma/client');

let prisma = null;

if (process.env.DATABASE_URL) {
  const globalForPrisma = global;
  prisma = globalForPrisma.__prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = prisma;
  }
}

module.exports = prisma;
