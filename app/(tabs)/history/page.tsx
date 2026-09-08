import { HistoryScreen } from "@/components/history/history-screen";
import { getHistoryWorkouts } from "@/lib/workout/queries";

export default async function HistoryPage() {
  const { workouts, error } = await getHistoryWorkouts();
  return <HistoryScreen workouts={workouts} error={error} />;
}
