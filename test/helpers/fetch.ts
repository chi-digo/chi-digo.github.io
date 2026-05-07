type JsonFixture = unknown;

const originalFetch = globalThis.fetch;

function getPath(input: string | URL | Request): string {
  if (typeof input === "string") {
    return new URL(input, "https://chidigo.org").pathname;
  }
  if (input instanceof URL) {
    return input.pathname;
  }
  return new URL(input.url, "https://chidigo.org").pathname;
}

export function setFetchFixtures(fixtures: Record<string, JsonFixture>): void {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const path = getPath(input);
    if (!(path in fixtures)) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: `Missing fixture for ${path}` }),
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      json: async () => fixtures[path],
    } as Response;
  }) as typeof fetch;
}

export function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}
