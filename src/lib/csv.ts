/**
 * CSV export utility – generates a check-in report that the stage
 * manager can download directly from the browser.
 */

import { GroupWithMembers } from "@/lib/useGroups";

export function exportCSV(groups: GroupWithMembers[]) {
  const header = "Group,Member,Checked In\n";
  const rows = groups.flatMap((g) =>
    g.members.map(
      (m) =>
        `"${g.name.replace(/"/g, '""')}","${m.name.replace(/"/g, '""')}",${m.checked_in ? "Yes" : "No"}`,
    ),
  );
  const csv = header + rows.join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `checkin-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
