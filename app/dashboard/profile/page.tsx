import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";

const { auth } = NextAuth(authConfig);

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <section>
        <p className="text-sm text-red-600">You must be logged in to view this page.</p>
      </section>
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <section>
        <p className="text-sm text-red-600">User not found.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Your Profile</h1>
          <p className="mt-2 text-sm text-foreground/70">View and update your account information.</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-foreground transition-colors hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <div className="mt-4 grid gap-2 text-sm text-foreground/70">
            <div>
              <p className="font-medium text-foreground/60">Name</p>
              <p className="mt-1 text-foreground">{user.name ?? "Not set"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/60">Email</p>
              <p className="mt-1 text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="font-medium text-foreground/60">Registered</p>
              <p className="mt-1 text-foreground">{user.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>
          <div className="mt-4">
            <ProfileEditForm currentName={user.name ?? ""} />
          </div>
        </section>

        <section className="md:col-span-2 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </section>
  );
}
