import { db } from "@/lib/db/client";
import { subjects, topics, resources, progress } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export async function listSubjects() {
  return db.query.subjects.findMany({ orderBy: asc(subjects.order) });
}

export async function getSubjectBySlug(slug: string) {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, slug),
  });
  if (!subject) return null;

  const subjectTopics = await db.query.topics.findMany({
    where: eq(topics.subjectId, subject.id),
    orderBy: asc(topics.order),
    with: { resources: { orderBy: asc(resources.order) } },
  });

  return { ...subject, topics: subjectTopics };
}

export async function getUserProgressForSubject(userId: string, topicIds: string[]) {
  if (topicIds.length === 0) return new Set<string>();
  const rows = await db.query.progress.findMany({
    where: (p, { and, eq, inArray }) => and(eq(p.userId, userId), inArray(p.topicId, topicIds)),
  });
  return new Set(rows.map((r) => r.topicId));
}

export async function getAllProgressForUser(userId: string) {
  return db.query.progress.findMany({ where: eq(progress.userId, userId) });
}
