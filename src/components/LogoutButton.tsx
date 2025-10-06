'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // This hook runs in the browser as soon as the component loads
  useEffect(() => {
    const saveTokenToLocalStorage = async () => {
      // Get the current session from Supabase
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // If a session exists, save the JWT to Local Storage
        localStorage.setItem('supabase_jwt_token', data.session.access_token);
      }
    };

    saveTokenToLocalStorage();
  }, [supabase]); // Re-run this effect if the supabase instance changes

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Clean up the token from local storage on logout
    localStorage.removeItem('supabase_jwt_token');
    router.push('/');
    router.refresh(); // Ensures the client-side cache is cleared
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-300"
    >
      Log Out
    </button>
  );
}
