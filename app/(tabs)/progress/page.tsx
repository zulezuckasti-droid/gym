import { ProgressScreen } from "@/components/progress/progress-screen";
import { getProgressData } from "@/lib/progress/queries";

export default async function ProgressPage() {
  const data = await getProgressData();
  return <ProgressScreen data={data} />;
}
