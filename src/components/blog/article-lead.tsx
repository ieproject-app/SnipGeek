import { cn } from "@/lib/utils";

interface ArticleLeadProps {
  description: string;
  className?: string;
}

export function ArticleLead({ description, className }: ArticleLeadProps) {
  if (!description) return null;

  return (
    <p
      className={cn(
        "my-6 mx-auto max-w-2xl text-center text-sm sm:text-base text-muted-foreground leading-relaxed text-balance",
        className,
      )}
    >
      {description}
    </p>
  );
}
