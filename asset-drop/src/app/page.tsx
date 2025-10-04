import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">
          Welcome to AssetDrop
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          The easiest way to collect assets from your clients.
        </p>
        <div className="mt-8 flex justify-center gap-x-4">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-white px-6 py-3 text-lg font-semibold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
