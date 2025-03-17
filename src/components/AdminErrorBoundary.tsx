'use client';

import React, { Component, ReactNode } from 'react';
import Link from 'next/link';

interface AdminErrorBoundaryProps {
  children: ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console
    console.error('Admin dashboard error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render a branded admin error UI
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-yellow-800 text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Dashboard Error</h2>
          
          <div className="mb-6 p-4 bg-black/50 rounded-lg border border-yellow-700 max-w-2xl">
            <p className="text-yellow-300 mb-2">An error occurred while loading the dashboard:</p>
            <p className="font-mono text-sm bg-black p-2 rounded text-yellow-200 overflow-auto">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
          
          <div className="space-y-4 w-full max-w-md">
            <div className="p-4 bg-black/30 rounded-lg border border-yellow-800">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Possible Solutions:</h3>
              <ul className="text-left list-disc pl-5 text-yellow-200 space-y-2">
                <li>Check your Supabase configuration and connection</li>
                <li>Ensure storage buckets are properly created</li>
                <li>Refresh the page and try again</li>
                <li>Clear browser cache and cookies</li>
              </ul>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
              <Link href="/admin" className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md font-semibold text-black">
                Return to Admin Home
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-gray-700 hover:bg-gray-800 rounded-md font-semibold text-yellow-300"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 