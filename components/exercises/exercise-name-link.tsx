import Link from "next/link";
import { cn } from "@/lib/utils";

export function ExerciseNameLink({
  id,
  name,
  className,
}: {
  id: string | null | undefined;
  name: string;
  className?: string;
}) {
  if (!id) {
    return <span className={className}>{name}</span>;
  }

  return (
    <Link
      href={`/exercises/${id}`}
      className={cn(
        "hover:text-primary transition-colors duration-150",
        className,
      )}
    >
      {name}
    </Link>
  );
}
