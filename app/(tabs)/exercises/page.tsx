import { ExercisesScreen } from "@/components/exercises/exercises-screen";
import { getExercises } from "@/lib/content/queries";

export default async function ExercisesPage() {
  const { exercises, error } = await getExercises();
  return <ExercisesScreen exercises={exercises} error={error} />;
}
