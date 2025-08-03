'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to landing page first for new users
    // Auth check will happen on the landing page
    router.push('/landing');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">HelloPogo</h1>
        <p className="text-gray-600">Redirecting to landing page...</p>
      </div>
    </div>
  );
}
