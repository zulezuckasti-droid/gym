export type ExerciseBlock<
  T extends { id: string; supersetGroup: number | null },
> =
  | { kind: "single"; id: string; exercise: T }
  | { kind: "superset"; id: string; group: number; a: T; b: T };

export function groupExercises<
  T extends { id: string; position: number; supersetGroup: number | null },
>(exercises: T[]): ExerciseBlock<T>[] {
  const sorted = [...exercises].sort((a, b) => a.position - b.position);
  const used = new Set<string>();
  const blocks: ExerciseBlock<T>[] = [];

  for (const exercise of sorted) {
    if (used.has(exercise.id)) continue;

    if (exercise.supersetGroup != null) {
      const partner = sorted.find(
        (other) =>
          other.id !== exercise.id &&
          !used.has(other.id) &&
          other.supersetGroup === exercise.supersetGroup,
      );
      if (partner) {
        used.add(exercise.id);
        used.add(partner.id);
        blocks.push({
          kind: "superset",
          id: `superset-${exercise.supersetGroup}-${exercise.id}`,
          group: exercise.supersetGroup,
          a: exercise,
          b: partner,
        });
        continue;
      }
    }

    used.add(exercise.id);
    blocks.push({ kind: "single", id: exercise.id, exercise });
  }

  return blocks;
}

export function flattenBlocks<
  T extends { id: string; supersetGroup: number | null },
>(blocks: ExerciseBlock<T>[]): T[] {
  return blocks.flatMap((block) =>
    block.kind === "single" ? [block.exercise] : [block.a, block.b],
  );
}
