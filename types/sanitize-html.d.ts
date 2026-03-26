// types/sanitize-html.d.ts
declare module "sanitize-html" {
  type SanitizeHtml = (
    dirty: string,
    options?: {
      allowedTags?: string[];
      allowVulnerableTags?: boolean;
      allowedAttributes?: Record<string, string[]>;
    },
  ) => string;

  const sanitizeHtml: SanitizeHtml;
  export default sanitizeHtml;
}
