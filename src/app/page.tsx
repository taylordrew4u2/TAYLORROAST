/**
 * Root page – simply renders the client-side Dashboard.
 *
 * The Dashboard uses SWR to fetch data from /api/groups on mount,
 * so the UI is always driven by the latest database state.
 */

import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Dashboard />;
}
