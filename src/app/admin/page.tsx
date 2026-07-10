import { getNurses } from "@/lib/data";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const nurses = await getNurses();
  return <AdminDashboard nurses={nurses} />;
}
