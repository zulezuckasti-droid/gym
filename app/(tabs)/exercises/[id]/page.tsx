import { ExerciseDetailScreen } from "@/components/exercises/exercise-detail-screen";
import { getExerciseById } from "@/lib/content/queries";
import { getExerciseProgress } from "@/lib/progress/queries";

export default async function ExerciseDetailPage({
  params,
}: PageProps<"/exercises/[id]">) {
  const { id } = await params;
  const [{ exercise, error }, progress] = await Promise.all([
    getExerciseById(id),
    getExerciseProgress(id),
  ]);
  return (
    <ExerciseDetailScreen
      exercise={exercise}
      progress={progress}
      error={error}
    />
  );
}
