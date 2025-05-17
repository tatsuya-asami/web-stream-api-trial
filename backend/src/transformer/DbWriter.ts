import { Prisma } from 'generated/prisma/client';
import { WritableStream } from 'node:stream/web';
import { PrismaService } from 'src/prisma.service';

export class DbWriter extends WritableStream {
  private chunks: {
    user: Prisma.UserCreateInput;
    userProfile: Prisma.UserProfileCreateManyInput;
  }[] = [];
  private readonly chunkSize = 200;

  constructor(private readonly prismaService: PrismaService) {
    super({
      write: async (args: {
        user: Prisma.UserCreateInput;
        userProfile: Prisma.UserProfileCreateManyInput;
      }) => {
        this.chunks.push(args);

        if (this.chunks.length >= this.chunkSize) {
          await this.writeChunkToDb();
        }
      },
      close: async () => {
        if (this.chunks.length > 0) {
          await this.writeChunkToDb();
        }
      },
    });
  }

  private async writeChunkToDb(): Promise<void> {
    try {
      await this.prismaService.$transaction(async (tx) => {
        await tx.user.createMany({
          data: this.chunks.map((chunk) => chunk.user),
        });
        await tx.userProfile.createMany({
          data: this.chunks.map((chunk) => chunk.userProfile),
        });
      });
      console.log(`Inserted ${this.chunks.length} users into the database.`);
      this.chunks = []; // Reset chunks
    } catch (error) {
      console.error('Error inserting users into the database:', error);
    }
  }
}
