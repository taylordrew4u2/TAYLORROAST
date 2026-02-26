import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;

export function getTursoClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    if (!authToken) {
      throw new Error("TURSO_AUTH_TOKEN environment variable is not set");
    }

    // Custom fetch wrapper to handle the missing cancel() method
    const customFetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const response = await fetch(input, init);
      // Add a no-op cancel method if it doesn't exist
      if (response.body && !(response.body as any).cancel) {
        (response.body as any).cancel = () => {};
      }
      return response;
    };

    client = createClient({
      url,
      authToken,
      fetch: customFetch as typeof fetch,
    });
  }

  return client;
}
