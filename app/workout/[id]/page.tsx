import { ActiveWorkout } from "@/components/workout/active-workout";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActiveWorkout workoutId={id} />;
}
