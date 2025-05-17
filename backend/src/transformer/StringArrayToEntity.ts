import { Prisma } from 'generated/prisma/client';
import { TransformStream } from 'node:stream/web';
import { v7 } from 'uuid';

export class StringArrayToEntity extends TransformStream<
  string[],
  {
    user: Prisma.UserCreateInput;
    userProfile: Prisma.UserProfileCreateManyInput;
  }
> {
  constructor() {
    super({
      transform(lines, controller) {
        const [
          _id,
          name,
          email,
          password,
          _createdAt,
          _updatedAt,
          __id,
          _userId,
          age,
          phoneNumber,
          address,
          city,
          country,
          zipCode,
          occupation,
          department,
          isActive,
          lastLogin,
          bio,
          loginCount,
          __createdAt,
          __updatedAt,
        ] = lines;

        const userId = v7();

        const user: Prisma.UserCreateInput = {
          id: userId,
          name,
          email,
          password,
        };
        const userProfile: Prisma.UserProfileCreateManyInput = {
          userId,
          age: parseInt(age, 10),
          phoneNumber,
          address,
          city,
          country,
          zipCode,
          occupation,
          department,
          isActive: isActive === 'true',
          lastLogin: new Date(lastLogin),
          bio,
          loginCount: parseInt(loginCount, 10),
        };

        controller.enqueue({
          user,
          userProfile,
        });
      },

      flush(controller) {
        controller.terminate();
      },
    });
  }
}
