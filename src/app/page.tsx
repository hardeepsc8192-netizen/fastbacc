import { getLogEntries, getNurses } from "@/lib/data";
import MapAndLog from "@/components/MapAndLog";

export default async function Home() {
  const [nurses, logEntries] = await Promise.all([
    getNurses(),
    getLogEntries(),
  ]);

  return <MapAndLog nurses={nurses} logEntries={logEntries} />;
}
