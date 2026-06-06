import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";

const { auth } = NextAuth(authConfig);

export default async function DoctorProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
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
      isTemporaryPassword: true,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  return (
    <section>
      {user.isTemporaryPassword ? (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-5 text-yellow-900 shadow-sm dark:border-yellow-700/60 dark:bg-yellow-950/30 dark:text-yellow-100">
          <p className="text-base font-semibold">Temporary password in use</p>
          <p className="mt-2 text-sm leading-6">
            You are using a temporary password. Please change it now for security.
          </p>
        </div>
      ) : null}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-2 text-sm text-foreground/70">View and update your profile information.</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border-2 border-yellow-300 bg-yellow-50/60 p-6 shadow-sm dark:border-yellow-700/70 dark:bg-yellow-950/20 md:col-span-2">
          <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Set a private password before continuing to use your doctor account.
          </p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-foreground/70">Name</p>
            <p className="font-medium text-foreground">{user.name ?? "Not set"}</p>

            <p className="text-sm text-foreground/70">Email</p>
            <p className="font-medium text-foreground">{user.email}</p>

            <p className="text-sm text-foreground/70">Phone</p>
            <p className="font-medium text-foreground">{user.phone ?? "Not set"}</p>

            <p className="text-sm text-foreground/70">Role</p>
            <p className="font-medium text-foreground">{user.role}</p>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Edit Name</h2>
          <div className="mt-4">
            <ProfileEditForm currentName={user.name ?? ""} />
          </div>
        </section>
      </div>
    </section>
  );
}
