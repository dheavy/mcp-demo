'use client';

export default function Error({
  error: _,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          An error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
