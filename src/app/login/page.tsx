import { AuthForm } from "@/components/auth/auth-form";
import { googleEnabled } from "@/auth";

export default function LoginPage() {
  return (
    <div className="min-h-dvh w-full bg-neutral-50 dark:bg-neutral-950">
      <AuthForm mode="login" googleEnabled={googleEnabled} />
    </div>
  );
}
