const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const jobs = await prisma.job.findMany();
    console.log('--- JOBS IN DATABASE ---');
    console.log(JSON.stringify(jobs, null, 2));
    console.log(`Total jobs: ${jobs.length}`);
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
