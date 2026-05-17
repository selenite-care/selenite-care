import Link from "next/link";
import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard Overview" },
  { href: "/admin/bookings", label: "All Bookings" },
  { href: "/admin/users", label: "All Users" },
  { href: "/admin/services", label: "Services Management" },
  { href: "/admin/payments", label: "Payments" },
];

const { auth } = NextAuth(authConfig);

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black">
      <aside className="hidden w-72 border-r border-black/10 bg-background px-6 py-8 dark:border-white/10 lg:block">
        <div>
          <p className="text-sm font-medium uppercase text-foreground/60">
            Admin
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Selenite Care
          </h1>
        </div>

        <nav className="mt-8 space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-black/10 bg-background px-6 py-4 dark:border-white/10 lg:hidden">
          <p className="text-sm font-medium text-foreground">Admin</p>
          <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/70 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex-1 px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
