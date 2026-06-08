import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NewProjectForm } from "@/components/dashboard/new-project-form";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="h-dvh w-full bg-neutral-50 dark:bg-neutral-950">
      <NewProjectForm />
    </div>
  );
}
