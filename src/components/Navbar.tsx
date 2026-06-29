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
          <div className="w-7 h-7 rounded-lg bg-[#2F6BFF] flex items-center justify-center text-white font-bold text-sm select-none">
            A
          </div>
          <span className="font-bold text-[15px] text-[#111]">AdGuard</span>
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
