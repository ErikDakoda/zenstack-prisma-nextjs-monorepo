import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  reactStrictMode: true,
  serverExternalPackages: ['@zenstackhq/runtime'],
  transpilePackages: [
    '@erikdakoda/auth',
    '@erikdakoda/auth-ui',
    '@erikdakoda/database',
    '@erikdakoda/todo',
    '@erikdakoda/todo-ui',
  ],
  //swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  env: {
    APP_VERSION: process.env.npm_package_version,
  },
};

export default nextConfig;
