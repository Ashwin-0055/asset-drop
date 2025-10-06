'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link'; // Import the Link component

export default function AuthCallback() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('An unknown error occurred.');

  useEffect(() => {
    const errorDescription = searchParams.get('error_description');

    if (errorDescription) {
      const friendlyError = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      setErrorMessage(friendlyError);
      setStatus('error');
    } else {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [supabase, router, searchParams]);

  // If the page is just loading, we can show a minimal loader or nothing at all
  if (status === 'loading') {
    return (
       <div className="login-container">
        <div className="login-card">
           <h1 className="login-title">Authenticating...</h1>
           <div className="mt-6 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // This is the new, beautifully styled error page
  if (status === 'error') {
    return (
      <div className="login-container">
        <div className="login-card text-center">
            {/* New, clean error icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-red-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
          <h1 className="login-title" style={{ color: '#c53030' }}>Authentication Failed</h1>
          <p className="login-subtitle" style={{ marginBottom: '24px' }}>
            It seems there was a problem with your login link.
          </p>
          
          {/* Display the specific error message from Supabase */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="text-red-800 text-sm font-mono">{errorMessage}</p>
          </div>

          {/* New "Try Again" button that links to the landing page */}
          <Link href="/" className="login-button mt-6 inline-block">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return null; // Return nothing by default
}