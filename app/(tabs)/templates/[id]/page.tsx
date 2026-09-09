import { TemplateEditorScreen } from "@/components/templates/template-editor-screen";
import { getExercises, getTemplateById } from "@/lib/content/queries";

export default async function TemplateEditorPage({
  params,
}: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const [templateResult, exercisesResult] = await Promise.all([
    getTemplateById(id),
    getExercises(),
  ]);

  return (
    <TemplateEditorScreen
      template={templateResult.template}
      exercises={exercisesResult.exercises}
      error={templateResult.error ?? exercisesResult.error}
    />
  );
}
