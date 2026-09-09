import { TemplatesScreen } from "@/components/templates/templates-screen";
import { getTemplatesList } from "@/lib/content/queries";

export default async function TemplatesPage() {
  const { templates, error } = await getTemplatesList();
  return <TemplatesScreen templates={templates} error={error} />;
}
