"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Blueprint" },
    { href: "/admin", label: "Admin" },
    { href: "/import", label: "Import Data" },
  ];

  return (
    <nav className="border-b" style={{ borderColor: 'var(--color-border-custom)', backgroundColor: 'var(--color-bg-sidebar)' }}>
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === link.href
                    ? "text-white"
                    : "text-gray-400"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Carbon Robotics AEP
          </div>
        </div>
      </div>
    </nav>
  );
}