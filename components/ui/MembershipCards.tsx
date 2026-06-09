"use client";

const tierConfig = {
  signature: {
    bg: "linear-gradient(145deg, #fdf8f0 0%, #f5ede0 100%)",
    border: "1.5px solid rgba(198,165,107,0.55)",
    badgeBg: "linear-gradient(135deg, #C6A56B 0%, #a8864d 100%)",
    badgeText: "#FFF8EE",
    titleColor: "#2B1F0E",
    validityColor: "#C6A56B",
    costColor: "#2B1F0E",
    descColor: "#7A6040",
    shadow: "0 4px 32px rgba(198,165,107,0.18)",
    hoverShadow: "0 12px 48px rgba(198,165,107,0.32)",
    label: "Starter",
    decoration: (
      <svg
        width="110" height="110" viewBox="0 0 110 110" fill="none"
        style={{ position: "absolute", top: -10, right: -10, opacity: 0.07, pointerEvents: "none" }}
      >
        <circle cx="55" cy="55" r="54" stroke="#9B6F3A" strokeWidth="1" />
        <circle cx="55" cy="55" r="42" stroke="#9B6F3A" strokeWidth="0.5" />
        <path d="M55 10 L58 45 L55 50 L52 45 Z" fill="#9B6F3A" />
        <path d="M55 100 L58 65 L55 60 L52 65 Z" fill="#9B6F3A" />
        <path d="M10 55 L45 52 L50 55 L45 58 Z" fill="#9B6F3A" />
        <path d="M100 55 L65 52 L60 55 L65 58 Z" fill="#9B6F3A" />
      </svg>
    ),
    shimmer: false,
    dark: false,
  },
  crystal: {
    // Deep glacial glass — layered ice with inner light refraction
    bg: "linear-gradient(160deg, rgba(195,232,255,0.82) 0%, rgba(157,213,250,0.65) 30%, rgba(180,228,255,0.55) 60%, rgba(210,240,255,0.78) 100%)",
    border: "1.5px solid rgba(180,225,255,0.75)",
    badgeBg: "linear-gradient(135deg, #5bb8f5 0%, #2a8fd4 100%)",
    badgeText: "#e8f6ff",
    titleColor: "#083d5e",
    validityColor: "#1a7ab5",
    costColor: "#083d5e",
    descColor: "#1e5a7a",
    shadow: "0 4px 24px rgba(80,170,230,0.28), 0 1px 0 rgba(255,255,255,0.75) inset, 0 -1px 0 rgba(100,190,240,0.3) inset",
    hoverShadow: "0 16px 52px rgba(80,170,230,0.42), 0 1px 0 rgba(255,255,255,0.85) inset, 0 0 24px rgba(150,215,255,0.25) inset",
    label: "Popular",
    shimmer: true,
    dark: false,
    glass: true,
    decoration: (
      <svg
        width="160" height="200" viewBox="0 0 160 200" fill="none"
        style={{ position: "absolute", top: 0, right: 0, opacity: 1, pointerEvents: "none", borderRadius: "0 18px 0 0", overflow: "hidden" }}
      >
        {/* Ice crack veins — top-right corner */}
        <path d="M160 0 L110 40 L130 80 L90 110" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M130 0 L100 30 L115 60" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M160 30 L125 55 L140 85 L115 100" stroke="rgba(200,238,255,0.45)" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M110 40 L85 65 L100 90 L80 110" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeLinecap="round" fill="none" />
        <path d="M130 80 L105 95 L118 120" stroke="rgba(200,238,255,0.35)" strokeWidth="0.5" strokeLinecap="round" fill="none" />
        {/* Small branch veins */}
        <path d="M115 60 L95 72" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M140 85 L120 92" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M100 90 L118 98" stroke="rgba(200,238,255,0.3)" strokeWidth="0.4" strokeLinecap="round" />
        {/* Light catch nodes — bright spots where cracks intersect */}
        <circle cx="110" cy="40" r="2.5" fill="rgba(255,255,255,0.75)" />
        <circle cx="130" cy="80" r="2"   fill="rgba(255,255,255,0.6)"  />
        <circle cx="115" cy="60" r="1.5" fill="rgba(255,255,255,0.55)" />
        <circle cx="100" cy="90" r="1.5" fill="rgba(200,238,255,0.7)"  />
        <circle cx="140" cy="85" r="1.2" fill="rgba(255,255,255,0.5)"  />
        {/* Top-right corner glare burst */}
        <circle cx="155" cy="5" r="18" fill="rgba(255,255,255,0.12)" />
        <circle cx="155" cy="5" r="9"  fill="rgba(255,255,255,0.18)" />
        <circle cx="155" cy="5" r="4"  fill="rgba(255,255,255,0.35)" />
      </svg>
    ),
  },
  platinum: {
    // Deep obsidian black with molten gold accents — maximum premium
    bg: "linear-gradient(145deg, #0d0d0d 0%, #181410 45%, #0f0e0b 100%)",
    border: "1.5px solid rgba(198,165,107,0.45)",
    badgeBg: "linear-gradient(135deg, #C6A56B 0%, #e8c97a 45%, #a07840 100%)",
    badgeText: "#0d0d0d",
    titleColor: "#f5e6c8",
    validityColor: "#C6A56B",
    costColor: "#f5e6c8",
    descColor: "#7a6a50",
    shadow: "0 4px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(198,165,107,0.08)",
    hoverShadow: "0 16px 60px rgba(0,0,0,0.8), 0 0 32px rgba(198,165,107,0.18), 0 0 0 1px rgba(198,165,107,0.2)",
    label: "Premium",
    shimmer: true,
    dark: true,
    decoration: (
      <svg
        width="130" height="130" viewBox="0 0 130 130" fill="none"
        style={{ position: "absolute", top: -16, right: -16, opacity: 0.22, pointerEvents: "none" }}
      >
        {/* Outer ring */}
        <circle cx="65" cy="65" r="62" stroke="#C6A56B" strokeWidth="0.6" />
        {/* Dashed middle ring */}
        <circle cx="65" cy="65" r="48" stroke="#e8c97a" strokeWidth="0.5" strokeDasharray="4 5" />
        {/* Inner solid ring */}
        <circle cx="65" cy="65" r="34" stroke="#C6A56B" strokeWidth="0.7" />
        {/* Center gem */}
        <circle cx="65" cy="65" r="7" fill="#C6A56B" opacity="0.35" />
        <circle cx="65" cy="65" r="3" fill="#e8c97a" opacity="0.7" />
        {/* Cardinal spokes */}
        <line x1="3"  y1="65" x2="127" y2="65"  stroke="#C6A56B" strokeWidth="0.4" />
        <line x1="65" y1="3"  x2="65"  y2="127" stroke="#C6A56B" strokeWidth="0.4" />
        {/* Diagonal spokes */}
        <line x1="20" y1="20" x2="110" y2="110" stroke="#C6A56B" strokeWidth="0.3" opacity="0.5" />
        <line x1="110" y1="20" x2="20" y2="110" stroke="#C6A56B" strokeWidth="0.3" opacity="0.5" />
        {/* Corner diamond ticks */}
        <polygon points="65,4 68,12 65,8 62,12" fill="#e8c97a" opacity="0.6" />
        <polygon points="65,126 68,118 65,122 62,118" fill="#e8c97a" opacity="0.6" />
        <polygon points="4,65 12,62 8,65 12,68" fill="#e8c97a" opacity="0.6" />
        <polygon points="126,65 118,62 122,65 118,68" fill="#e8c97a" opacity="0.6" />
      </svg>
    ),
  },
} as const;

type Step = {
  title: string;
  validity: string;
  cost: string;
  description: string;
  tier: string;
};

export function MembershipCard({
  step,
  index,
  footerText,
}: {
  step: Step;
  index: number;
  footerText?: string;
}) {
  const cfg = tierConfig[step.tier as keyof typeof tierConfig];

  return (
    <article
      style={{
        background: cfg.bg,
        border: cfg.border,
        boxShadow: cfg.shadow,
        borderRadius: 20,
        padding: "28px 24px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        animationDelay: `${index * 400}ms`,
      }}
      className="step-card-slide-in"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = cfg.hoverShadow;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = cfg.shadow;
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {cfg.decoration}

      {cfg.shimmer && (
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 20,
            background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {"glass" in cfg && cfg.glass && (
        <>
          {/* Frosted glass base — fine noise grain for ice texture */}
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: 20,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='ice'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23ice)' opacity='0.055'/%3E%3C/svg%3E")`,
              pointerEvents: "none",
            }}
          />
          {/* Bottom-left deep-ice glow — gives the sense of depth under the surface */}
          <div
            style={{
              position: "absolute", bottom: -20, left: -10,
              width: 180, height: 140, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(100,190,240,0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Top-left inner highlight — like light entering the ice slab */}
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 56,
              borderRadius: "20px 20px 60% 60% / 20px 20px 30px 30px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Bottom-right cool shadow — depth illusion */}
          <div
            style={{
              position: "absolute", bottom: 0, right: 0, width: "70%", height: "40%",
              borderRadius: "0 0 20px 0",
              background: "linear-gradient(135deg, transparent 60%, rgba(80,160,220,0.1) 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {cfg.dark && (
        <>
          {/* Noise grain */}
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: 20,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
              pointerEvents: "none", opacity: 0.6,
            }}
          />
          {/* Gold ambient glow — bottom-left corner */}
          <div
            style={{
              position: "absolute", bottom: -30, left: -20,
              width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(198,165,107,0.13) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Subtle gold top-edge shimmer line */}
          <div
            style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(198,165,107,0.55), transparent)",
              borderRadius: 99, pointerEvents: "none",
            }}
          />
        </>
      )}

      <div
        style={{
          position: "absolute", top: 18, right: 18,
          background: cfg.badgeBg, color: cfg.badgeText,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "3px 10px", borderRadius: 99,
        }}
      >
        {cfg.label}
      </div>

      <div
        style={{
          width: 44, height: 44, background: cfg.badgeBg, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cfg.badgeText, fontSize: 18, fontWeight: 800,
        }}
      >
        {index + 1}
      </div>

      <h3
        style={{
          color: cfg.titleColor, marginTop: 16, fontSize: 18, fontWeight: 700,
          fontFamily: "Playfair Display, Georgia, serif", lineHeight: 1.3,
        }}
      >
        {step.title}
      </h3>

      <div style={{ height: 1.5, width: 40, background: cfg.badgeBg, borderRadius: 99, margin: "12px 0" }} />

      <p style={{ color: cfg.costColor, fontSize: 22, fontWeight: 800, fontFamily: "Playfair Display, serif", letterSpacing: "-0.01em" }}>
        {step.cost}
      </p>
      <p style={{ color: cfg.validityColor, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>
        {step.validity}
      </p>
      <p style={{ color: cfg.descColor, fontSize: 13, lineHeight: 1.65, marginTop: 14 }}>
        {step.description}
      </p>

      {footerText ? (
        <p
          style={{
            color: cfg.dark ? "#C6A56B" : "#8F7A62",
            fontSize: 12,
            fontWeight: 600,
            marginTop: 18,
          }}
        >
          {footerText}
        </p>
      ) : null}
    </article>
  );
}

type Feature = { title: string; description: string; icon: string };

export function FeatureCard({ feature, index, total }: { feature: Feature; index: number; total: number }) {
  return (
    <article
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#D8C7B5",
        borderWidth: "1px",
        animationDelay: `${(total - 1 - index) * 400}ms`,
        borderRadius: 16,
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
      }}
      className="feature-card-slide-in group"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(198,165,107,0.18)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute", bottom: -20, right: -20, width: 100, height: 100,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(198,165,107,0.08) 0%, transparent 70%)",
          transition: "transform 0.4s ease", pointerEvents: "none",
        }}
        className="group-hover:scale-150"
      />
      <div
        style={{
          position: "absolute", left: 0, top: "20%", width: 3, height: "60%",
          background: "linear-gradient(180deg, transparent, #C6A56B, transparent)",
          borderRadius: 99, opacity: 0, transition: "opacity 0.3s ease", pointerEvents: "none",
        }}
        className="group-hover:opacity-100"
      />

      <div
        style={{
          width: 46, height: 46,
          background: "linear-gradient(135deg, #C6A56B 0%, #a8864d 100%)",
          borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, color: "#FFF8EE", boxShadow: "0 4px 16px rgba(198,165,107,0.3)",
        }}
      >
        {feature.icon}
      </div>

      <h3 style={{ color: "#2B2B2B", marginTop: 18, fontSize: 16, fontWeight: 700, fontFamily: "Playfair Display, Georgia, serif" }}>
        {feature.title}
      </h3>
      <p style={{ color: "#B8A89A", marginTop: 10, fontSize: 13, lineHeight: 1.65 }}>
        {feature.description}
      </p>
    </article>
  );
}
