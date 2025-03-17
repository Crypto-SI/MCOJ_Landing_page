'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StandaloneImageOptimizer from '@/components/StandaloneImageOptimizer';

export default function ImageOptimizationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
        <div className="text-xl text-yellow-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Optimization Tool</h1>
      
      <div className="mb-6 bg-gray-800/50 p-4 rounded-md">
        <p className="text-gray-300 mb-3">
          This tool lets you optimize images using TinyPNG's compression technology without storing them in the database.
        </p>
        <p className="text-gray-300">
          Upload an image, optimize it, and download the optimized version to use elsewhere on your site.
        </p>
      </div>

      <StandaloneImageOptimizer />
      
      <div className="mt-8 text-center">
        <Link href="/admin/dashboard" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
} 