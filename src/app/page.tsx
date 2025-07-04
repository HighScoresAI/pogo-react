'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Pogo</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
