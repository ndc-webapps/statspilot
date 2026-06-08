import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getProjects } from "@/lib/data";
import { DEMO_PROJECTS } from "@/lib/demo/projects";

export default async function DashboardHomePage() {
  const session = await auth();

  // Logged in → the user's own dashboard.
  if (session?.user?.id) {
    const projects = await getProjects(session.user.id);
    return (
      <DashboardShell
        projects={projects}
        initialProjectIds={projects[0]?.id ? [projects[0].id] : []}
        user={{ name: session.user.name ?? null, email: session.user.email ?? "" }}
      />
    );
  }

  // Logged out → public demo landing. Open with two projects already side-by-side
  // so visitors immediately see the multi-project compare feature.
  return (
    <DashboardShell
      projects={DEMO_PROJECTS}
      initialProjectIds={DEMO_PROJECTS.slice(0, 1).map((p) => p.id)}
      demoMode
    />
  );
}
