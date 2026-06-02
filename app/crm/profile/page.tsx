import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

const { auth } = NextAuth(authConfig);

export default async function CrmProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CRM") {
    redirect("/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          View and update your CRM account details.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <p className="font-medium text-foreground/60">Name</p>
              <p className="mt-1 text-foreground">{user.name ?? "Not set"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/60">Email</p>
              <p className="mt-1 text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/60">Phone</p>
              <p className="mt-1 text-foreground">{user.phone ?? "Not set"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/60">Role</p>
              <p className="mt-1 text-foreground">{user.role}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
          <div className="mt-4">
            <ProfileEditForm currentName={user.name ?? ""} />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </section>
  );
}
