"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChartLine, Clock, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: Clock },
  { href: "/progress", label: "Progress", icon: ChartLine },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const pendingHref =
    clickedHref && clickedHref !== pathname ? clickedHref : null;

  useEffect(() => {
    for (const tab of tabs) {
      router.prefetch(tab.href);
    }
  }, [router]);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isPending = pendingHref === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (!isActive) setClickedHref(href);
              }}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150",
                isActive || isPending
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-150",
                  (isActive || isPending) && "scale-110",
                )}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
