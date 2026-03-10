import { cn } from "@/lib/utils";

function Skeleton({
  className,
  "data-variant": dataVariant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  "data-variant"?: "static" | "pulse" | "shimmer";
}) {
  return (
    <div
      className={cn(
        "skeleton rounded-md",
        className,
      )}
      data-variant={dataVariant ?? "pulse"}
      {...props}
    />
  );
}

export { Skeleton };
