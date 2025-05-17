import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  ReadableStream,
  ReadableStreamDefaultController,
} from 'node:stream/web';
import { Prisma } from 'generated/prisma/client';

export type UserWithProfile = Prisma.UserGetPayload<{
  include: { UserProfile: true };
}>;

@Injectable()
export class FindUserStreamService {
  constructor(private prisma: PrismaService) {}

  findAllUsersObjectStream(): ReadableStream<UserWithProfile[]> {
    const batchSize = 200;
    let cursorId: string | undefined = undefined;
    let isFetching: boolean = false;
    let streamCancelled: boolean = false;

    const prismaService = this.prisma;

    return new ReadableStream<UserWithProfile[]>({
      async pull(
        controller: ReadableStreamDefaultController<UserWithProfile[]>,
      ) {
        if (isFetching || streamCancelled) {
          return;
        }
        isFetching = true;

        try {
          const usersWithProfilesBatch = await prismaService.user.findMany({
            take: batchSize,
            skip: cursorId ? 1 : undefined,
            cursor: cursorId ? { id: cursorId } : undefined,
            orderBy: { id: 'asc' },
            include: { UserProfile: true },
          });

          if (streamCancelled) {
            isFetching = false;

            return;
          }

          if (usersWithProfilesBatch.length === 0) {
            controller.close(); // データがなければストリームを正常終了
            isFetching = false;
            return;
          }

          controller.enqueue(usersWithProfilesBatch);

          cursorId =
            usersWithProfilesBatch[usersWithProfilesBatch.length - 1].id;

          if (usersWithProfilesBatch.length < batchSize) {
            // これが最後のバッチなので、ストリームを正常終了
            controller.close();
          }
        } catch (error) {
          console.error(
            'UserService: Error fetching users in ReadableStream pull:',
            error,
          );
          controller.error(error);
          streamCancelled = true;
        } finally {
          isFetching = false;
        }
      },
    });
  }
}
