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

    client = createClient({ url, authToken });
  }

  return client;
}
