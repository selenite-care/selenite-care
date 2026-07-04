"use client";

import { useEffect, useRef } from "react";
const DOCTOR_IMAGE_URL =
  "https://static.vecteezy.com/system/resources/thumbnails/051/966/270/small/asian-female-doctor-pointing-at-something-free-png.png";

export default function DoctorMascot() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Tiny delay so the browser has painted the page first
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateX(0)";
      }, 600);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    // Outer anchor — position this wherever you need it on the page
    <div
      className="relative flex w-full max-w-[340px] items-end overflow-hidden"
      style={{ minHeight: "min(520px, 145vw)" }}
    >

      {/* ── Slide-in wrapper ── */}
      <div
        ref={wrapperRef}
        style={{
          opacity: 0,
          transform: "translateX(60px)",
          transition: "opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)",
          position: "relative",
          width: "100%",
        }}
      >
        {/* ── Speech / offer bubble ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 20,
            width: 210,
            borderRadius: 20,
            border: "1.5px solid #B87B68",
            background: "rgba(255,255,255,0.97)",
            boxShadow: "0 8px 40px rgba(198,165,107,0.18), 0 2px 8px rgba(0,0,0,0.06)",
            padding: "14px 16px 12px",
          }}
        >
          {/* Gold top accent bar */}
          <div
            style={{
              height: 3,
              borderRadius: 99,
              background: "linear-gradient(90deg,#B87B68,#e8d5a3)",
              marginBottom: 10,
            }}
          />

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#2B2B2B",
              lineHeight: 1.45,
              fontFamily: "Playfair Display, Georgia, serif",
            }}
          >
            🌿 Begin your skincare journey today.
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#8C7355",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            Limited-time consultation pricing available.
          </p>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg,transparent,#B87B6855,transparent)",
              margin: "10px 0 8px",
            }}
          />

          <p
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#884F38",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Limited-time offer · Book now
          </p>

          {/* Bubble tail — points down-right toward the doctor */}
          <div
            style={{
              position: "absolute",
              bottom: -9,
              right: 28,
              width: 16,
              height: 16,
              transform: "rotate(45deg)",
              borderRight: "1.5px solid #B87B68",
              borderBottom: "1.5px solid #B87B68",
              background: "white",
            }}
          />
        </div>

        {/* ── Doctor image ── */}
        <div
          style={{
            position: "relative",
            marginTop: 80,           // clears the bubble
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Subtle ground shadow */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 180,
              height: 24,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(198,165,107,0.22) 0%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />

          <img
            src={DOCTOR_IMAGE_URL}
            alt="Selenite Care medical consultant"
            draggable={false}
            style={{
              width: 280,
              height: 400,
              objectFit: "cover",
              objectPosition: "top center",
              borderRadius: "160px 160px 0 0",   // pill top
              display: "block",
              userSelect: "none",
              // Blend white backgrounds seamlessly into the page
              mixBlendMode: "multiply",
              filter: "contrast(1.04) saturate(0.95)",
            }}
          />

          {/* Thin gold frame ring — premium detail */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "160px 160px 0 0",
              border: "1.5px solid rgba(198,165,107,0.35)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ── Name tag / credential badge ── */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            background: "white",
            border: "1px solid #B87B68",
            borderRadius: 12,
            padding: "8px 14px",
            boxShadow: "0 4px 20px rgba(198,165,107,0.15)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#2B2B2B",
              fontFamily: "Playfair Display, Georgia, serif",
              lineHeight: 1.25,
            }}
          >
            Dr. Sara Ahmed
          </p>
          <p style={{ fontSize: 10, color: "#8C7355", lineHeight: 1.35, marginTop: 2 }}>
            Dermatology Consultant · Selenite Care
          </p>
        </div>
      </div>
    </div>
  );
}
