import { PrismaClient, Plan, Role, DocStyle } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { github_org: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      github_org: 'demo-org',
      plan: Plan.pro,
      seats: 25,
    },
  });

  console.log('✅ Created organization:', org.name);

  // Create demo admin user
  const user = await prisma.user.upsert({
    where: { github_id: 'demo-user-123' },
    update: {},
    create: {
      org_id: org.id,
      github_id: 'demo-user-123',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: Role.admin,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create sample reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        org_id: org.id,
        pr_url: 'https://github.com/demo-org/demo-repo/pull/1',
        pr_number: 1,
        score: 85,
        issues_json: [
          {
            type: 'performance',
            severity: 'medium',
            file: 'src/utils.ts',
            line: 42,
            message: 'Consider caching this computation',
            suggestion: 'Use useMemo or memoize the result',
          },
        ],
        summary: 'Good implementation with minor performance improvements suggested.',
        approved: true,
      },
    }),
    prisma.review.create({
      data: {
        org_id: org.id,
        pr_url: 'https://github.com/demo-org/demo-repo/pull/2',
        pr_number: 2,
        score: 62,
        issues_json: [
          {
            type: 'security',
            severity: 'high',
            file: 'src/auth.ts',
            line: 15,
            message: 'Potential SQL injection vulnerability',
            suggestion: 'Use parameterized queries',
          },
          {
            type: 'bug',
            severity: 'critical',
            file: 'src/api.ts',
            line: 88,
            message: 'Unhandled promise rejection',
            suggestion: 'Add try-catch block',
          },
        ],
        summary: 'Critical security and bug issues found. Changes required before merging.',
        approved: false,
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} sample reviews`);

  // Create sample docs generated
  await prisma.docsGenerated.create({
    data: {
      user_id: user.id,
      language: 'typescript',
      style: DocStyle.jsdoc,
      tokens_used: 1250,
    },
  });

  console.log('✅ Created sample docs entry');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
