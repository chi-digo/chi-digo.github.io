import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: process.env.NODE_ENV,

  tracesSampleRate: 0.1,
  sendDefaultPii: false,

  allowUrls: [/chidigo\.org/, /localhost/],

  integrations: [
    Sentry.breadcrumbsIntegration({
      dom: { serializeAttribute: [] },
    }),
  ],

  beforeSend(event) {
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url);
        url.search = "";
        event.request.url = url.toString();
      } catch {
        // malformed URL — leave as-is
      }
    }
    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "ui.input") {
      return null;
    }
    return breadcrumb;
  },
});
