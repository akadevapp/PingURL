import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav name={user.name} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <SettingsForm
          initialName={user.name}
          initialBio={user.bio ?? ""}
          initialAcceptingMessages={!!user.accepting_messages}
          username={user.username}
        />
      </main>
    </div>
  );
}
