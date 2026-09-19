/** Status vocabulary shared by dashboard inquiry surfaces. */
export const STATUS_META = {
  NEW: { label: "NEW" },
  READ: { label: "READ" },
  REPLIED: { label: "REPLIED" },
  ARCHIVED: { label: "ARCHIVED" },
} as const;

export type InquiryStatusKey = keyof typeof STATUS_META;

/** Tailwind classes per status — AA contrast on both themes. */
export function statusStyle(status: string): string {
  switch (status) {
    case "NEW":
      return "border-cobalt/40 text-cobalt bg-accent";
    case "READ":
      return "border-border text-foreground";
    case "REPLIED":
      return "border-emerald-600/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10";
    case "ARCHIVED":
      return "border-border text-muted-foreground";
    default:
      return "border-border text-muted-foreground";
  }
}
