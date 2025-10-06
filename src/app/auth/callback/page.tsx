'use client';

import { Suspense } from 'react';
import AuthCallbackInner from './callback-inner';

export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Authenticating...</h1>
          <div className="mt-6 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
