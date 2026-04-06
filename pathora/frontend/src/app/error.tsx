"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
      <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-4">
        Something went wrong!
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="btn btn-primary dark:bg-slate-800">
        Try Again
      </button>
    </div>
  );
}
