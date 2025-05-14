import { useCurrentUser } from '@erikdakoda/auth-ui/context';
import type { Space } from '@erikdakoda/database';
import Spaces from '@erikdakoda/auth-ui/components/Spaces';
import WithNavBar from '@/components/WithNavBar';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { getEnhancedPrisma } from '@erikdakoda/database/server/getEnhancedPrisma';

type Props = {
  spaces: Space[];
};

const Home: NextPage<Props> = ({ spaces }) => {
  const { user } = useCurrentUser();

  return (
    <WithNavBar>
      {user && (
        <div className="mt-8 text-center flex flex-col items-center w-full">
          <h1 className="text-2xl text-gray-800">Welcome {user.name || user.email}!</h1>
          <h3>
            {user.id} - {user.email} - {user.password}
          </h3>

          <div className="w-full p-8">
            <h2 className="text-lg md:text-xl text-left mb-8 text-gray-700">
              Choose a space to start, or{' '}
              <Link href="/create-space" className="link link-primary">
                create a new one.
              </Link>
            </h2>
            <Spaces spaces={spaces} />
          </div>
        </div>
      )}
    </WithNavBar>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const db = await getEnhancedPrisma(ctx);
  const spaces = await db.space.findMany();
  return {
    props: { spaces },
  };
};

export default Home;
