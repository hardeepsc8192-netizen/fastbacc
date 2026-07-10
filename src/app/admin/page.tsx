import { getLogEntries, getNurses } from "@/lib/data";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [nurses, logEntries] = await Promise.all([getNurses(), getLogEntries()]);
  return <AdminDashboard nurses={nurses} logEntries={logEntries} />;
}
