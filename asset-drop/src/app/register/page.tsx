'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for the button
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [signedIn, setSignedIn] = useState(false); // New state for success message
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_in') {
        // Instead of redirecting, we now set the state
        setSignedIn(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
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
            <h1 className="login-title">Account Confirmed! ✅</h1>
            <p className="login-submitted-text">Thank you for signing up. You have been successfully authenticated.</p>
             <Link href="/dashboard" className="login-button mt-6 inline-block">
              Go to Dashboard
            </Link>
          </div>
        ) :
        /* State 2: User has submitted their email */
        submitted ? (
          <div>
            <h1 className="login-title">Confirm your email! 📧</h1>
            <p className="login-submitted-text">We've sent a confirmation link to <span className="font-semibold">{email}</span>.</p>
          </div>
        ) : (
        /* State 1: Initial form */
          <>
            <h1 className="login-title">Create Your Account</h1>
            <p className="login-subtitle">Enter your email to get started with AssetDrop.</p>
            <form onSubmit={handleSignUp}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="you@example.com"
                required
              />
              <button type="submit" className="login-button">Sign Up</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}