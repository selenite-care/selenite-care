import NextAuth from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { DashboardMobileNav, DashboardSidebarNav } from "./DashboardNav";

const { auth } = NextAuth(authConfig);

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1" style={{ backgroundColor: "#F8F5F0" }}>
      <aside
        className="hidden w-72 px-6 py-8 md:block"
        style={{ backgroundColor: "#2B2B2B" }}
      >
        <div>
          <p
            className="text-sm font-medium uppercase"
            style={{ color: "#B8A89A" }}
          >
            Dashboard
          </p>
          <h1
            className="mt-2 text-xl font-semibold tracking-tight"
            style={{ color: "#F8F5F0" }}
          >
            Selenite Care
          </h1>
        </div>

        <DashboardSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className="flex-1 px-6 py-8 pb-24 md:pb-8"
          style={{ backgroundColor: "#F8F5F0" }}
        >
          {children}
        </main>
        <DashboardMobileNav />
      </div>
    </div>
  );
}
