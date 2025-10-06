import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch projects for the current user
  const { data: projects } = await supabase
    .from('projects')
    .select('*');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
          + New Project
        </button>
      </div>

      {/* This is the "Empty State". It only shows if there are no projects. */}
      {projects && projects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-lg border-dashed border-2 border-gray-300">
          <h2 className="text-xl font-semibold text-gray-700">No projects yet!</h2>
          <p className="text-gray-500 mt-2">Click + New Project  to get started.</p>
        </div>
      )}

      {/* We will add the code to display the list of projects here later */}
    </div>
  );
}

