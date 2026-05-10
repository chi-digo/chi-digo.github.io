"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-neutral-600 mb-6">
        An error occurred while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
