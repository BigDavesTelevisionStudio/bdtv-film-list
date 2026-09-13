"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { LayoutDashboard, List, Eye, Tv2 } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/list", label: "Sort List", icon: List, exact: false },
  { href: "/admin/watch", label: "Watched", icon: Eye, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-5">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2">
              <Tv2 className="h-4.5 w-4.5 text-amber-400" />
              <span className="text-sm font-semibold tracking-tight text-white">
                BigDave<span className="text-amber-400">TV</span>
              </span>
            </Link>

            <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />

            <div className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all",
                      isActive
                        ? "bg-amber-500/12 text-amber-400"
                        : "text-[#86868b] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#48484a] font-medium tracking-wider uppercase">Admin</span>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-6 h-6" },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
