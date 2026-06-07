export function Footer() {
  return (
    <footer
      style={{ borderTop: "1px solid #C6A56B", backgroundColor: "#2B2B2B" }}
      className="relative overflow-hidden px-6 pt-12 pb-6"
    >
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
                style={{ fontFamily: "Playfair Display, serif", color: "#F8F5F0" }}
                className="text-xl font-semibold tracking-tight"
              >
                Selenite Care
              </p>
              <div
                style={{ background: "linear-gradient(90deg, #C6A56B, transparent)" }}
                className="mt-2 h-px w-20"
              />
            </div>
            <p style={{ color: "#B8A89A" }} className="text-sm leading-6">
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
                href="https://wa.me/8801516056372"
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
            </div>
          </div>

          {/* Contact column */}
          <div className="flex flex-col gap-4">
            <p
              style={{ color: "#C6A56B", fontFamily: "Playfair Display, serif" }}
              className="text-sm font-semibold uppercase tracking-widest"
            >
              Contact
            </p>
            <div className="flex flex-col gap-3">
              {/* Email */}
              <a
                href="mailto:careselenite@gmail.com"
                style={{ color: "#D8C7B5" }}
                className="group flex items-start gap-3 text-sm leading-6 transition-colors duration-200 hover:text-[#C6A56B]"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
                </svg>
                careselenite@gmail.com
              </a>

              {/* Phone */}
              <a
                href="tel:+8801681517169"
                style={{ color: "#D8C7B5" }}
                className="group flex items-start gap-3 text-sm leading-6 transition-colors duration-200 hover:text-[#C6A56B]"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                +880 1681 517 169
              </a>

              {/* Location */}
              <div
                style={{ color: "#D8C7B5" }}
                className="flex items-start gap-3 text-sm leading-6"
              >
                <svg className="mt-0.5 shrink-0" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>
                  Level-6, Building-1, Golden Shower,<br />
                  Mazar Road, Dhaka, Bangladesh
                </span>
              </div>
            </div>
          </div>

          {/* Quick links column */}
          <div className="flex flex-col gap-4">
            <p
              style={{ color: "#C6A56B", fontFamily: "Playfair Display, serif" }}
              className="text-sm font-semibold uppercase tracking-widest"
            >
              Quick Links
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Services", href: "/services" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  style={{ color: "#D8C7B5" }}
                  className="group flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[#C6A56B]"
                >
                  <span
                    style={{ background: "#C6A56B" }}
                    className="h-px w-4 shrink-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  />
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          style={{ background: "linear-gradient(90deg, transparent, #C6A56B44, transparent)" }}
          className="my-8 h-px w-full"
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p style={{ color: "#B8A89A" }} className="text-xs">
            &copy; {new Date().getFullYear()} Selenite Care. All rights reserved.
          </p>
          <p style={{ color: "#6B5E54" }} className="text-xs">
            Crafted with care &middot; Dhaka, Bangladesh
          </p>
        </div>
      </div>
    </footer>
  );
}