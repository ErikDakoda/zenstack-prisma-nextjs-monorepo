import { enhance } from '@zenstackhq/runtime';
import { getServerAuthSession } from '@erikdakoda/auth/server/getServerAuthSession';
import type { GetServerSidePropsContext } from 'next';
import { getBasePrisma } from './getBasePrisma';
import { getExtendedPrisma } from './prismaExtensions';

const basePrisma = getBasePrisma();

/**
 * Get the Prisma client with extensions and ZenStack enhancements (like permissions).
 * See https://www.prisma.io/docs/orm/prisma-client/client-extensions
 * @param ctx The Next.js context.
 * @param ctx.req The Next.js request.
 * @param ctx.res The Next.js response.
 * @returns The Prisma client.
 */
export async function getEnhancedPrisma(ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) {
  const session = await getServerAuthSession(ctx);
  const extendedPrisma = getExtendedPrisma(basePrisma);

  return enhance(
    extendedPrisma,
    { user: session?.user },
    { logPrismaQuery: process.env.LOG_ZEN_QUERY === 'true' },
  );
}
