// ** Prisma
import { extendedPrisma } from '@erikdakoda/database/server/extendedPrisma';
import { type PrismaClient, type Space, SpaceUserRole } from '@erikdakoda/database';

// ** NextAuth
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import authConfig from '../config';

// ** Utilities
import { compare } from 'bcryptjs';
import omit from 'lodash/omit';

const userSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  email: true,
  emailVerified: true,
  password: true,
  name: true,
  image: true,
  role: true,
  activeSpaceId: true,
  spaces: {
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      spaceId: true,
      space: true,
      role: true,
    },
  },
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(extendedPrisma),

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: authConfig.config.pages.login,
  },

  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          type: 'email',
        },
        password: {
          type: 'password',
        },
      },
      // @ts-ignore
      authorize: authorize(extendedPrisma),
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      // @ts-ignore
      scope: 'read:user,user:email',
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      const user = await extendedPrisma.user.findUnique({
        where: {
          id: token.sub,
        },
        select: userSelect,
      });

      return {
        ...session,
        user: {
          ...omit(user, ['password']),
          id: token.sub!,
        },
      };
    },
  },

  events: {
    async signIn({ user }) {
      console.log('Signing in', user.email);
      let space: Space | null = null;

      const spaceCount = await extendedPrisma.spaceUser.count({
        where: {
          userId: user.id,
        },
      });

      if (spaceCount === 0) {
        space = await extendedPrisma.space.create({
          data: {
            name: `${user?.name || user?.email?.split('@')[0]}’s space`,
            members: {
              create: [
                {
                  userId: user.id,
                  role: SpaceUserRole.ADMIN,
                },
              ],
            },
          },
        });
      } else {
        // @ts-ignore
        if (!user.activeSpaceId) {
          const spaceUser = await extendedPrisma.spaceUser.findFirst({
            where: {
              userId: user.id,
            },
            include: {
              space: true,
            },
          });
          space = spaceUser?.space || null;
        }
      }

      if (space) {
        await extendedPrisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            activeSpaceId: space.id,
          },
        });
      }
    },
  },
};

function authorize(extendedPrisma: PrismaClient) {
  return async (credentials: Record<'email' | 'password', string> | undefined) => {
    if (!credentials) {
      throw new Error('Missing credentials');
    }

    if (!credentials.email) {
      throw new Error('"email" is required in credentials');
    }

    if (!credentials.password) {
      throw new Error('"password" is required in credentials');
    }

    const maybeUser = await extendedPrisma.user.findFirst({
      where: {
        email: credentials.email,
      },
      select: userSelect,
    });

    if (!maybeUser || !maybeUser.password) {
      return null;
    }

    const isValid = await compare(credentials.password, maybeUser.password);

    if (!isValid) {
      return null;
    }

    return omit(maybeUser, ['password']);
  };
}
