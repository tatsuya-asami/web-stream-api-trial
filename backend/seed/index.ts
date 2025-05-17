import { PrismaClient, Prisma } from '../generated/prisma/client';
import { faker } from '@faker-js/faker/locale/ja';

const prisma = new PrismaClient();

const USER_COUNT = 100000;
const BATCH_SIZE = 1000;

async function main() {
  console.log(`Starting to seed ${USER_COUNT} users...`);
  faker.seed(1234);

  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});

  for (let i = 0; i < USER_COUNT; i += BATCH_SIZE) {
    const userBatch: Prisma.UserCreateManyInput[] = [];
    const batchSize = Math.min(BATCH_SIZE, USER_COUNT - i);

    console.log(
      `Creating batch ${i / BATCH_SIZE + 1} of ${Math.ceil(USER_COUNT / BATCH_SIZE)} users`,
    );

    for (let j = 0; j < batchSize; j++) {
      const user: Prisma.UserCreateManyInput = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 10 }),
      };

      userBatch.push(user);
    }

    await prisma.user.createMany({
      data: userBatch,
    });

    const createdUsers = await prisma.user.findMany({
      skip: i,
      take: batchSize,
      orderBy: { id: 'asc' },
    });

    console.log(
      `Creating batch ${i / BATCH_SIZE + 1} of ${Math.ceil(USER_COUNT / BATCH_SIZE)} profiles`,
    );

    // Create profiles for these users
    const profileBatch: Prisma.UserProfileCreateManyInput[] = [];

    createdUsers.forEach((user) => {
      const profile: Prisma.UserProfileCreateManyInput = {
        userId: user.id,
        age: faker.number.int({ min: 18, max: 80 }),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        zipCode: faker.location.zipCode(),
        occupation: faker.person.jobTitle(),
        department: faker.commerce.department(),
        isActive: faker.datatype.boolean(),
        lastLogin: faker.date.past(),
        bio: faker.lorem.paragraphs(2),
        loginCount: faker.number.int({ min: 0, max: 100 }),
      };

      profileBatch.push(profile);
    });

    // Create profiles in batch
    await prisma.userProfile.createMany({
      data: profileBatch,
    });
  }

  const userCount = await prisma.user.count();
  const profileCount = await prisma.userProfile.count();

  console.log(`Seeding complete!`);
  console.log(`Created ${userCount} users`);
  console.log(`Created ${profileCount} user profiles`);
}

main()
  .then(() => {
    console.log('Seeding completed successfully!');
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
