import { CrownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlanBadgeUpstream({
  plan,
  className,
}: {
  plan: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal uppercase tracking-normal text-gray-700 ring-1 ring-gray-400 hover:bg-gray-200 dark:text-foreground dark:ring-gray-500 hover:dark:bg-gray-700",
        className,
      )}
    >
      <CrownIcon className="h-3 w-3" /> {plan}
    </span>
  );
}

// Community edition: no billing, so no upgrade prompts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PlanBadge(
  _props: Parameters<typeof PlanBadgeUpstream>[0],
): null {
  return null;
}
