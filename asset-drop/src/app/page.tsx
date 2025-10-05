'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for the button
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [signedIn, setSignedIn] = useState(false); // New state for success message
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Instead of redirecting, we now set the state
        setSignedIn(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* State 3: User has successfully signed in */}
        {signedIn ? (
          <div>
            <h1 className="login-title">Successfully Logged In! ✅</h1>
            <p className="login-submitted-text">You have been authenticated. You can now close this tab.</p>
          
          </div>
        ) :
        /* State 2: User has submitted their email */
        submitted ? (
          <div>
            <h1 className="login-title">one-time login link sent! ✨</h1>
            <p className="login-submitted-text">Please check <span className="font-semibold">{email}</span> to securely sign in.</p>
          </div>
        ) : (
        /* State 1: Initial form */
          <>
            <h1 className="login-title">Access Your Dashboard</h1>
            <p className="login-subtitle">Enter your email to receive a secure, one-time login link.</p>
            <form onSubmit={handleMagicLink}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="you@example.com"
                required
              />
              <button type="submit" className="login-button">
         Send Secure Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}