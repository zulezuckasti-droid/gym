import { ExerciseDetailScreen } from "@/components/exercises/exercise-detail-screen";
import { getExerciseById } from "@/lib/content/queries";

export default async function ExerciseDetailPage({
  params,
}: PageProps<"/exercises/[id]">) {
  const { id } = await params;
  const { exercise, error } = await getExerciseById(id);
  return <ExerciseDetailScreen exercise={exercise} error={error} />;
}
