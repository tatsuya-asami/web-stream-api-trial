import {
  TransformStream,
  TransformStreamDefaultController,
} from 'node:stream/web';
import { stringify } from 'csv';
import { UserWithProfile } from 'src/findUserStream.service';

export class UsersToCsvStringifyTransformer extends TransformStream<
  UserWithProfile[],
  string
> {
  constructor() {
    const csvHeaders = [
      'id',
      'name',
      'email',
      'password',
      'createdAt',
      'updatedAt',
      'id',
      'userId',
      'age',
      'phoneNumber',
      'address',
      'city',
      'country',
      'zipCode',
      'occupation',
      'department',
      'isActive',
      'lastLogin',
      'bio',
      'loginCount',
      'createdAt',
      'updatedAt',
    ] as const;
    type CsvHeaders = (typeof csvHeaders)[number];

    const stringifier = stringify({
      header: true,
      columns: csvHeaders,
      quoted_string: true,
    });

    super({
      start: (controller: TransformStreamDefaultController<string>) => {
        stringifier.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk.toString());
        });
        stringifier.on('error', (err) => {
          console.error(
            'UsersToCsvStringifyTransformer: Error from csv-stringify:',
            err,
          );
          controller.error(err);
        });
        stringifier.on('finish', () => {
          console.log(
            'UsersToCsvStringifyTransformer: csv-stringify finished.',
          );
        });
      },

      transform: (userBatch: UserWithProfile[]) => {
        for (const userWithProfiles of userBatch) {
          const profile = userWithProfiles.UserProfile?.[0];

          const record: Record<CsvHeaders, any> = {
            id: userWithProfiles.id,
            name: userWithProfiles.name,
            email: userWithProfiles.email,
            password: userWithProfiles.password,
            createdAt: userWithProfiles.createdAt.toISOString(),
            updatedAt: userWithProfiles.updatedAt.toISOString(),
            userId: profile?.userId,
            age: profile?.age,
            phoneNumber: profile?.phoneNumber,
            address: profile?.address,
            city: profile?.city,
            country: profile?.country,
            zipCode: profile?.zipCode,
            occupation: profile?.occupation,
            department: profile?.department,
            isActive: profile?.isActive,
            lastLogin: profile?.lastLogin
              ? profile.lastLogin.toISOString()
              : null,
            bio: profile?.bio,
            loginCount: profile?.loginCount,
          };

          const writeSuccess = stringifier.write(record);
          if (!writeSuccess) {
            console.warn(
              'UsersToCsvStringifyTransformer: csv-stringify backpressure.',
            );
          }
        }
      },

      flush: (controller: TransformStreamDefaultController<string>) => {
        stringifier.end(() => {
          controller.terminate();
        });
      },
    });
  }
}
