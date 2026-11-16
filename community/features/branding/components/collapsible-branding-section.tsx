import { ReactNode, useState } from "react";

import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function CollapsibleBrandingSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium"
        aria-expanded={open}
      >
        {title}
        <ChevronDownIcon
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? children : null}
    </section>
  );
}
