import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getProject, getProjects } from "@/lib/data";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [project, projects] = await Promise.all([
    getProject(id, session.user.id),
    getProjects(session.user.id),
  ]);
  if (!project) notFound();

  return (
    <DashboardShell
      projects={projects}
      initialProjectIds={[project.id]}
      user={{ name: session.user.name ?? null, email: session.user.email ?? "" }}
    />
  );
}
