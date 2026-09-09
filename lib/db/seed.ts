import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "./client";
import { users, subjects, topics, resources } from "./schema";

type CareerLevel = "fresher" | "intermediate" | "expert";

function twsResourcesFor(topicTitle: string) {
  return [
    {
      title: `${topicTitle} on TrainWithShubham (YouTube)`,
      url: `https://www.youtube.com/@TrainWithShubham/search?query=${encodeURIComponent(topicTitle)}`,
      type: "video" as const,
    },
    {
      title: "TrainWithShubham.com",
      url: "https://www.trainwithshubham.com",
      type: "doc" as const,
    },
  ];
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@roadmap.ai";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: adminEmail,
      passwordHash: await hash(adminPassword, 10),
      role: "admin",
    })
    .returning();

  const [devops] = await db
    .insert(subjects)
    .values({
      slug: "devops",
      title: "DevOps",
      description: "From Linux fundamentals to Kubernetes and infrastructure automation.",
      color: "#f97316",
      order: 0,
      createdBy: admin.id,
    })
    .returning();

  const [cloud] = await db
    .insert(subjects)
    .values({
      slug: "cloud-engineering",
      title: "Cloud Engineering",
      description: "Core AWS services and cloud architecture patterns.",
      color: "#0ea5e9",
      order: 1,
      createdBy: admin.id,
    })
    .returning();

  const devopsMilestones: { title: string; description: string; careerLevel: CareerLevel }[] = [
    { title: "Linux", description: "Shell, filesystem, permissions, processes.", careerLevel: "fresher" },
    { title: "Networking", description: "TCP/IP, DNS, HTTP, load balancing basics.", careerLevel: "fresher" },
    { title: "Git", description: "Version control workflows and collaboration.", careerLevel: "fresher" },
    { title: "Docker", description: "Containers, images, Dockerfiles, Compose.", careerLevel: "intermediate" },
    { title: "Jenkins", description: "CI/CD pipelines and automation.", careerLevel: "intermediate" },
    { title: "Kubernetes", description: "Container orchestration at scale.", careerLevel: "expert" },
    { title: "Terraform", description: "Infrastructure as code.", careerLevel: "expert" },
  ];

  for (const [i, m] of devopsMilestones.entries()) {
    const [topic] = await db
      .insert(topics)
      .values({
        subjectId: devops.id,
        title: m.title,
        description: m.description,
        level: "milestone",
        careerLevel: m.careerLevel,
        order: i,
      })
      .returning();

    for (const [j, r] of twsResourcesFor(m.title).entries()) {
      await db.insert(resources).values({ topicId: topic.id, order: j, ...r });
    }
  }

  const cloudMilestones: { title: string; description: string; careerLevel: CareerLevel }[] = [
    { title: "AWS Fundamentals", description: "IAM, regions, and the shared responsibility model.", careerLevel: "fresher" },
    { title: "EC2", description: "Virtual machines, AMIs, auto scaling.", careerLevel: "fresher" },
    { title: "RDS", description: "Managed relational databases.", careerLevel: "intermediate" },
    { title: "S3", description: "Object storage and static hosting.", careerLevel: "intermediate" },
    { title: "VPC", description: "Networking, subnets, security groups.", careerLevel: "expert" },
  ];

  for (const [i, m] of cloudMilestones.entries()) {
    await db.insert(topics).values({
      subjectId: cloud.id,
      title: m.title,
      description: m.description,
      level: "milestone",
      careerLevel: m.careerLevel,
      order: i,
    });
  }

  console.log("Seeded database. Admin login:", adminEmail, "/", adminPassword);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
