import { HomeScreen } from "@/components/home/home-screen";
import { getHomeTemplates } from "@/lib/workout/queries";

export default async function HomePage() {
  const { templates, exerciseCatalog, error } = await getHomeTemplates();
  return (
    <HomeScreen
      templates={templates}
      exerciseCatalog={exerciseCatalog}
      error={error}
    />
  );
}
