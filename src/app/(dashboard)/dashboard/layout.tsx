import LogoutButton from '@/components/LogoutButton';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// This layout will wrap all pages inside the (dashboard) folder
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login. This protects all dashboard routes.
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-6">
        <div className="flex flex-col justify-between h-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AssetDrop</h1>
            <nav className="mt-8">
              <ul>
                <li>
                  <a href="/dashboard" className="text-lg font-semibold text-gray-700 hover:text-blue-600">
                    My Projects
                  </a>
                </li>
                {/* We will add more links here later, like "Settings" */}
              </ul>
            </nav>
          </div>
          <div>
            <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
            <div className="mt-2">
               <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}