"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Circle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ResourceItem = { id: string; title: string; url: string; type: string };
export type TopicNode = {
  id: string;
  title: string;
  description: string | null;
  level: "milestone" | "topic" | "subtopic";
  parentTopicId: string | null;
  order: number;
  resources: ResourceItem[];
  children?: TopicNode[];
};

export function RoadmapTree({
  topics,
  completedIds = [],
  interactive = false,
  onToggle,
}: {
  topics: TopicNode[];
  completedIds?: string[];
  interactive?: boolean;
  onToggle?: (topicId: string, completed: boolean) => Promise<void>;
}) {
  const milestones = useMemo(() => {
    const byParent = new Map<string, TopicNode[]>();
    for (const t of topics) {
      const key = t.parentTopicId ?? "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(t);
    }
    const attach = (node: TopicNode): TopicNode => ({
      ...node,
      children: (byParent.get(node.id) ?? []).sort((a, b) => a.order - b.order).map(attach),
    });
    return (byParent.get("root") ?? []).sort((a, b) => a.order - b.order).map(attach);
  }, [topics]);

  const [completed, setCompleted] = useState(new Set(completedIds));
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    const isDone = completed.has(id);
    const next = new Set(completed);
    if (isDone) next.delete(id);
    else next.add(id);
    setCompleted(next);
    if (onToggle) startTransition(() => onToggle(id, !isDone));
  };

  return (
    <div className="relative mx-auto max-w-2xl py-12">
      <svg
        className="pointer-events-none absolute left-1/2 top-0 h-full w-2 -translate-x-1/2"
        aria-hidden
      >
        <line x1="1" y1="0" x2="1" y2="100%" className="trail-path" strokeWidth="2" />
      </svg>

      <ol className="relative flex flex-col gap-10">
        {milestones.map((m, i) => (
          <li key={m.id} className={cn("relative flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
            <MilestoneCard
              node={m}
              side={i % 2 === 0 ? "left" : "right"}
              completed={completed}
              interactive={interactive}
              onToggle={toggle}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function MilestoneCard({
  node,
  side,
  completed,
  interactive,
  onToggle,
}: {
  node: TopicNode;
  side: "left" | "right";
  completed: Set<string>;
  interactive: boolean;
  onToggle: (id: string) => void;
}) {
  const isDone = completed.has(node.id);
  const childCount = node.children?.length ?? 0;
  const childDone = node.children?.filter((c) => completed.has(c.id)).length ?? 0;

  return (
    <div className={cn("w-[calc(50%-2rem)]", side === "left" ? "text-right pr-2" : "text-left pl-2")}>
      <div
        className={cn(
          "absolute top-3 z-10 h-4 w-4 rounded-full border-2 border-background shadow",
          side === "left" ? "-right-[2px] translate-x-1/2" : "-left-[2px] -translate-x-1/2",
          isDone ? "bg-moss" : "bg-accent",
        )}
      />
      <button
        type="button"
        onClick={() => interactive && onToggle(node.id)}
        disabled={!interactive}
        className={cn(
          "group w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
          isDone && "border-moss/40 bg-moss/5",
          interactive && "cursor-pointer",
        )}
      >
        <div className="flex items-center gap-2" style={{ flexDirection: side === "left" ? "row-reverse" : "row" }}>
          {interactive ? (
            isDone ? (
              <Check className="size-4 shrink-0 text-moss" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" />
            )
          ) : null}
          <h3 className="font-heading text-lg font-semibold">{node.title}</h3>
        </div>
        {node.description && (
          <p className="mt-1 text-sm text-muted-foreground">{node.description}</p>
        )}

        {node.resources.length > 0 && (
          <div className={cn("mt-2 flex flex-wrap gap-1.5", side === "left" && "justify-end")}>
            {node.resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {r.title} <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        )}

        {childCount > 0 && (
          <div className={cn("mt-3 flex flex-wrap gap-1.5", side === "left" && "justify-end")}>
            {node.children!.map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className={cn(
                  "font-normal",
                  completed.has(c.id) && "border-moss/40 bg-moss/10 text-moss",
                  interactive && "cursor-pointer",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactive) onToggle(c.id);
                }}
              >
                {c.title}
              </Badge>
            ))}
            {interactive && (
              <span className="text-xs text-muted-foreground">
                {childDone}/{childCount}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
