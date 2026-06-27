import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#C6A56B] bg-[#2B2B2B] px-6 pb-6 pt-12 text-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#F0EDE8]">
      {/* Subtle decorative top glow */}
      <div
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(198,165,107,0.12), transparent)" }}
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
      />

      <div className="relative mx-auto w-full max-w-6xl">
        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <div>
              <p
                style={{ fontFamily: "Playfair Display, serif" }}
                className="text-xl font-semibold tracking-tight text-[#F8F5F0] dark:text-[#F0EDE8]"
              >
                Selenite Care
              </p>
              <div
                style={{ background: "linear-gradient(90deg, #C6A56B, transparent)" }}
                className="mt-2 h-px w-20"
              />
            </div>
            <p className="text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
              Compassionate, expert healthcare delivered with warmth and precision — right here in Dhaka.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/care.selenite"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{ border: "1px solid rgba(198,165,107,0.3)", color: "#D8C7B5" }}
                className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:border-[#C6A56B] hover:bg-[#C6A56B] hover:text-[#2B2B2B]"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.9v-2.89h2.538V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/8801647660300"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                style={{ border: "1px solid rgba(198,165,107,0.3)", color: "#D8C7B5" }}
                className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:border-[#C6A56B] hover:bg-[#C6A56B] hover:text-[#2B2B2B]"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/selenitecare/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{ border: "1px solid rgba(198,165,107,0.3)", color: "#D8C7B5" }}
                className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:border-[#C6A56B] hover:bg-[#C6A56B] hover:text-[#2B2B2B]"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4.983 3.5C4.983 4.881 3.87 6 2.5 6S0 4.881 0 3.5 1.113 1 2.5 1s2.483 1.119 2.483 2.5zM.5 8h4V24h-4V8zm7 0h3.833v2.188h.055C11.922 9.066 13.61 7.75 16.27 7.75 21 7.75 24 10.845 24 16.57V24h-4v-6.766c0-3.227-1.15-5.43-4.029-5.43-2.197 0-3.504 1.48-4.078 2.91-.21.51-.263 1.223-.263 1.938V24h-4V8z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/_selenite_care_/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ border: "1px solid rgba(198,165,107,0.3)", color: "#D8C7B5" }}
                className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:border-[#C6A56B] hover:bg-[#C6A56B] hover:text-[#2B2B2B]"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.75A4 4 0 003.75 7.75v8.5a4 4 0 004 4h8.5a4 4 0 004-4v-8.5a4 4 0 00-4-4h-8.5zm8.875 1.312a1.063 1.063 0 110 2.126 1.063 1.063 0 010-2.126zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.75A3.25 3.25 0 1015.25 12 3.254 3.254 0 0012 8.75z" />
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@selenite.care"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                style={{ border: "1px solid rgba(198,165,107,0.3)", color: "#D8C7B5" }}
                className="group flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:border-[#C6A56B] hover:bg-[#C6A56B] hover:text-[#2B2B2B]"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16.5 2c.436 1.81 1.508 3.225 3.5 4.164V9.42a8.016 8.016 0 01-3.5-1.055v6.47c0 4.015-3.236 7.165-7.27 7.165C5.79 22 3 19.232 3 15.86c0-3.646 3.048-6.62 6.77-6.62.4 0 .79.04 1.17.116v3.57a3.324 3.324 0 00-1.17-.21c-1.83 0-3.31 1.43-3.31 3.194 0 1.956 1.68 3.2 3.303 3.2 2.198 0 3.227-1.714 3.227-3.183V2h3.51z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact column */}
          <div className="flex flex-col gap-4">
            <p
              style={{ fontFamily: "Playfair Display, serif" }}
              className="text-sm font-semibold uppercase tracking-widest"
            >
              Contact
            </p>
            <div className="flex flex-col gap-3">
              {/* Email */}
              <a
                href="mailto:careselenite@gmail.com"
                className="group inline-flex w-fit items-start gap-3 text-sm leading-6 text-[#D8C7B5] transition-colors duration-200 hover:text-[#C6A56B] dark:text-[#F0EDE8]"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                </svg>
                careselenite@gmail.com
              </a>

              {/* Phone */}
              <a
                href="tel:+8801647660300"
                className="group inline-flex w-fit items-start gap-3 text-sm leading-6 text-[#D8C7B5] transition-colors duration-200 hover:text-[#C6A56B] dark:text-[#F0EDE8]"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                +88 01647-660300
              </a>

              {/* Location */}
              <a
                href="https://maps.app.goo.gl/pbXp975nt5G1qoSy9"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex w-fit items-start gap-3 text-sm leading-6 text-[#D8C7B5] transition-colors duration-200 hover:text-[#C6A56B] dark:text-[#F0EDE8]"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>
                  Level-6, Building-1, Golden Shower,<br />
                  Mazar Road, Dhaka-1216, Bangladesh.
                </span>
              </a>
            </div>
          </div>

          {/* Quick links column */}
          <div className="flex flex-col gap-4">
            <p
              style={{ fontFamily: "Playfair Display, serif" }}
              className="text-sm font-semibold uppercase tracking-widest"
            >
              Quick Links
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Memberships", href: "/services" },
                { label: "About Us", href: "/about" },
                { label: "FAQ", href: "/faq" },
                { label: "Contact", href: "/contact" },
                { label: "Terms & Conditions", href: "/terms-and-conditions" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-2 text-sm text-[#D8C7B5] transition-colors duration-200 hover:text-[#C6A56B] dark:text-[#F0EDE8]"
                >
                  <span
                    style={{ background: "#C6A56B" }}
                    className="h-px w-4 shrink-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          style={{ background: "linear-gradient(90deg, transparent, #C6A56B44, transparent)" }}
          className="my-8 h-px w-full dark:bg-[#3D3530]"
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-[#B8A89A] dark:text-[#8A7D75]">
            &copy; {new Date().getFullYear()} Selenite Care. All rights reserved.
          </p>
          <p className="text-xs text-[#6B5E54] dark:text-[#8A7D75]">
            Crafted with care &middot; Dhaka, Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}
