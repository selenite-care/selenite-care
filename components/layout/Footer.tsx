export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-background px-6 py-8 dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">Selenite Care</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-foreground/70">
            Compassionate support for calm, everyday wellness.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <p className="text-sm text-foreground/60">
            &copy; {new Date().getFullYear()} Selenite Care. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
