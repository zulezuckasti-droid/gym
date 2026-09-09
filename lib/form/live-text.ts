export const nameFieldProps = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "none",
  spellCheck: false,
} as const;

export function commitIme() {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}

export function formText(
  form: HTMLFormElement,
  fieldName: string,
  fallback = "",
): string {
  const value = new FormData(form).get(fieldName);
  if (typeof value === "string") return value;
  const field = form.elements.namedItem(fieldName);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value;
  }
  return fallback;
}
