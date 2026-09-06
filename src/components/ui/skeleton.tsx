import { cn } from "@/lib/utils";

/**
 * A pulsing placeholder block, sized and shaped by the caller via
 * `className` (e.g. `h-4 w-32 rounded-md`, `size-10 rounded-full`) to match
 * the real content it stands in for while that content loads.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
