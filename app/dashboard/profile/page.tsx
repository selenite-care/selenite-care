import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import ProfilePhotoSection from "@/components/dashboard/ProfilePhotoSection";
import { formatDateOnly } from "@/lib/dateUtils";

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
      image: true,
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

  const googleAccount = await db.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "google",
    },
    select: {
      id: true,
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-page text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Your Profile
          </h1>
          <p className="text-muted mt-2 text-sm">
            View and update your account information.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="border-themed text-page inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <ProfilePhotoSection
            initialImage={user.image}
            name={user.name}
            hasGoogleAccount={Boolean(googleAccount)}
          />
        </div>

        <section className="bg-card border-themed rounded-lg border p-6">
          <h2
            className="text-page text-lg font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Account
          </h2>
          <div className="text-muted mt-4 grid gap-2 text-sm">
            <div>
              <p className="text-muted font-medium">Name</p>
              <p className="text-page mt-1">{user.name ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Email</p>
              <p className="text-page mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Registered</p>
              <p className="text-page mt-1">
                {formatDateOnly(user.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card border-themed rounded-lg border p-6">
          <h2
            className="text-page text-lg font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Edit Profile
          </h2>
          <div className="mt-4">
            <ProfileEditForm currentName={user.name ?? ""} />
          </div>
        </section>

        <section className="bg-card border-themed md:col-span-2 rounded-lg border p-6">
          <h2
            className="text-page text-lg font-semibold"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Change Password
          </h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </section>
  );
}
