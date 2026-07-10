import { getLogEntries, getNurses } from "@/lib/data";
import MapAndLog from "@/components/MapAndLog";

// Data lives in GitHub, not the build output — always fetch fresh, never prerender.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [nurses, logEntries] = await Promise.all([
    getNurses(),
    getLogEntries(),
  ]);

  return <MapAndLog nurses={nurses} logEntries={logEntries} />;
}
