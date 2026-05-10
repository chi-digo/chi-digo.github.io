"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";

export function SentryContext() {
  const { locale } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    Sentry.setContext("app", {
      locale,
      pathname,
      online: navigator.onLine,
    });
  }, [locale, pathname]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SW_ERROR") {
        const err = event.data.error;
        Sentry.captureException(
          typeof err === "string" ? new Error(err) : new Error(err.message),
          { tags: { source: "service_worker" } },
        );
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  return null;
}
