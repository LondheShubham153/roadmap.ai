import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { auth } from "@/lib/auth";
import { listSubjects, getAllProgressForUser } from "@/lib/data";
import { db } from "@/lib/db/client";
import { topics as topicsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [subjects, userProgress] = await Promise.all([
    listSubjects(),
    getAllProgressForUser(userId),
  ]);
  const completedTopicIds = new Set(userProgress.map((p) => p.topicId));

  const subjectsWithStats = await Promise.all(
    subjects.map(async (s) => {
      const subjectTopics = await db.query.topics.findMany({ where: eq(topicsTable.subjectId, s.id) });
      const total = subjectTopics.length;
      const done = subjectTopics.filter((t) => completedTopicIds.has(t.id)).length;
      return { ...s, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    }),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <h1 className="font-heading text-3xl font-semibold">
            Welcome back, {session!.user.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s where your trails stand.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {subjectsWithStats.map((s) => (
              <Link
                key={s.id}
                href={`/tracks/${s.slug}`}
                className="group rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
                  <span className="text-sm text-muted-foreground">
                    {s.done}/{s.total}
                  </span>
                </div>
                <Progress value={s.pct} className="mt-3" />
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Continue trail <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
            {subjectsWithStats.length === 0 && (
              <p className="text-muted-foreground">No tracks available yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
