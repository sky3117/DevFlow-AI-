import { PrismaClient, Plan, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo organization
  const org = await prisma.organization.upsert({
    where: { githubOrg: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      githubOrg: 'demo-org',
      plan: Plan.STARTER,
      seats: 5,
    },
  });

  console.log(`✅ Organization created: ${org.name}`);

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { githubId: '1234567' },
    update: {},
    create: {
      githubId: '1234567',
      email: 'demo@devflow.ai',
      name: 'Demo User',
      role: Role.OWNER,
      orgId: org.id,
    },
  });

  console.log(`✅ User created: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
