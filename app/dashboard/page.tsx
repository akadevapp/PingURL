import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";
import { ContactUrlCard } from "@/components/ContactUrlCard";
import { ClaimUrlSection } from "@/components/ClaimUrlSection";
import { InboxList } from "@/components/InboxList";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const h = await headers();
  const host = h.get("host");
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const origin = host ? `${proto}://${host}` : "";
  const profileUrl = user.username ? `${origin}/${user.username}` : "";

  return (
    <div className="min-h-screen bg-white">
      <DashboardNav name={user.name} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="space-y-6">
          {user.username ? <ContactUrlCard url={profileUrl} /> : <ClaimUrlSection />}
          {user.username && <InboxList profileUrl={profileUrl} />}
        </div>
      </main>
    </div>
  );
}
