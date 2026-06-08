import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { ProjectSettingsList } from "@/components/dashboard/project-settings-list";
import { getProjects } from "@/lib/data";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await getProjects(session.user.id);

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col overflow-y-auto px-4 py-8 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">Project settings</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage projects, pause tracking, or remove a project entirely.</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-3.5 w-3.5" />
            Add project
          </Button>
        </Link>
      </div>

      <ProjectSettingsList projects={projects} />
    </div>
  );
}
