"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { label: "대시보드", href: "/dashboard" },
  { label: "검토", href: "/review" },
  { label: "생성", href: "/generate" },
  { label: "히스토리", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-[56px] flex items-center px-6">
      <div className="flex items-center gap-6 w-full h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 130 130" className="w-7 h-7 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="20" y="35" width="80" height="55" rx="15" fill="#2F68E6" />
            <path d="M 35 88 L 35 110 L 55 90 Z" fill="#2F68E6" />
            <rect x="35" y="52" width="45" height="7" rx="3.5" fill="#FFFFFF" />
            <rect x="35" y="67" width="28" height="7" rx="3.5" fill="#FFFFFF" />
            <circle cx="95" cy="35" r="14" fill="#182235" />
            <rect x="93" y="26" width="4" height="10" rx="2" fill="#FFFFFF" />
            <circle cx="95" cy="41" r="2" fill="#FFFFFF" />
          </svg>
          <span className="font-bold text-[15px] text-[#111]">요즘애드</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-stretch h-full">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-4 flex flex-col items-center justify-center border-b-2 transition-colors",
                  active
                    ? "border-[#2F6BFF] text-[#111]"
                    : "border-transparent text-[#6B7280] hover:text-[#111]"
                )}
              >
                <span className={clsx("text-[13px]", active ? "font-semibold" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
