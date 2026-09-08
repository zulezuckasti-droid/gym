import { notFound } from "next/navigation";
import { PendingWorkoutDetail } from "@/components/history/pending-workout-detail";
import { WorkoutDetailView } from "@/components/history/workout-detail-view";
import { getWorkoutById } from "@/lib/workout/queries";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workout, error } = await getWorkoutById(id);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-6">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (workout) {
    return <WorkoutDetailView workout={workout} />;
  }

  if (!id) {
    notFound();
  }

  return <PendingWorkoutDetail id={id} />;
}
