"use client";

import { useEffect, useState } from "react";

type DashboardWelcomeProps = {
  name?: string | null;
};

function getFirstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour <= 11) {
    return "Good morning";
  }

  if (hour >= 12 && hour <= 16) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour <= 21) {
    return "Good evening";
  }

  return "Hello";
}

export default function DashboardWelcome({ name }: DashboardWelcomeProps) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  return (
    <div className="mb-8 border-b border-[#B87B68]/45 pb-6">
      <h1
        className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        {greeting}, {getFirstName(name)}! ✨
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
        Welcome to your skincare dashboard. Here's your update.
      </p>
    </div>
  );
}
