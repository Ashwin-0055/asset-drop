'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redirect to homepage after logout
    router.refresh(); // Refresh the page to clear any cached user data
  };

  return (
    <button
      onClick={handleSignOut}
      className="mt-6 rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-300"
    >
      Log Out
    </button>
  );
}
