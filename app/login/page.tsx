"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";

type UserSession = {
  user?: {
    role?: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsSubmitting(false);
      return;
    }

    const session = (await getSession()) as UserSession | null;

    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <section className="flex flex-1 items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Sign in to manage your appointments and care plan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-black/10 bg-background p-6 dark:border-white/10"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none transition-colors focus:border-foreground dark:border-white/10"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}
