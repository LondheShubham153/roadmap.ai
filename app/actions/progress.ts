"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { progress } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function toggleTopicProgress(topicId: string, completed: boolean, trackSlug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const userId = session.user.id;

  if (completed) {
    await db
      .insert(progress)
      .values({ userId, topicId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(progress)
      .where(and(eq(progress.userId, userId), eq(progress.topicId, topicId)));
  }

  revalidatePath(`/tracks/${trackSlug}`);
  revalidatePath("/dashboard");
}
