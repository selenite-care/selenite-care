export function Footer() {
  return (
    <footer
      style={{ borderTop: "1px solid #C6A56B", backgroundColor: "#2B2B2B" }}
      className="px-6 py-8"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            style={{ fontFamily: "Playfair Display, serif", color: "#F8F5F0" }}
            className="text-lg font-semibold tracking-tight"
          >
            Selenite Care
          </p>
          <p style={{ color: "#D8C7B5" }} className="mt-2 max-w-md text-sm leading-6">
            Compassionate support for calm, everyday wellness.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:items-end">
          {/* Links Section */}
          <div className="flex gap-6 text-sm">
            <a
              href="/services"
              style={{ color: "#D8C7B5" }}
              className="transition-colors duration-200 hover:text-[#C6A56B]"
            >
              Services
            </a>
            <a
              href="/about"
              style={{ color: "#D8C7B5" }}
              className="transition-colors duration-200 hover:text-[#C6A56B]"
            >
              About
            </a>
            <a
              href="/contact"
              style={{ color: "#D8C7B5" }}
              className="transition-colors duration-200 hover:text-[#C6A56B]"
            >
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p style={{ color: "#B8A89A" }} className="text-xs">
            &copy; {new Date().getFullYear()} Selenite Care. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
