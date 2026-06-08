"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrackingSnippet({ trackingId, origin }: { trackingId: string; origin: string }) {
  const snippet = `<script src="${origin}/script.js" data-project-id="${trackingId}" defer></script>`;
  return <CopyBlock label="Install snippet" code={snippet} />;
}

export function CopyBlock({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — user can still select & copy manually.
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{label}</span>}
      <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-neutral-100">
          <code>{code}</code>
        </pre>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className={cn(
            "absolute right-2 top-2 border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white",
            copied && "border-emerald-600/40 bg-emerald-600/20 text-emerald-300"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
