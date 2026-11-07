"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(true);
    useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isOpen ? "256px" : "76px"
    );
  }, [isOpen]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },

    {
      label: "Karyawan",
      href: "/employees",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },

    {
      label: "Tugas",
      href: "/tasks",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M3 10h18" />
          <path d="m8 15 2 2 4-4" />
        </svg>
      ),
    },

    {
      label: "Laporan",
      href: "/reports",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 3-3 3 2 5-6" />
        </svg>
      ),
    },
  ];

  function handleNavigation(href: string) {
    router.push(href);
    setMobileOpen(false);
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ================= MOBILE HEADER ================= */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
            aria-label="Buka menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          <div>
            <p className="text-sm font-bold text-slate-900">
              Daily Work
            </p>

            <p className="text-[11px] text-slate-400">
              Monitoring System
            </p>
          </div>
        </div>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
        />
      )}

      {/* ================= MOBILE SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* BRAND */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <div>
            <p className="text-base font-bold">
              Daily Work
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Monitoring System
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Tutup menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavigation(item.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 md:flex ${
          isOpen ? "w-64" : "w-[76px]"
        }`}
      >
        {/* BRAND */}
        <div
          className={`flex h-20 items-center border-b border-slate-800 ${
            isOpen
              ? "justify-between px-5"
              : "justify-center px-3"
          }`}
        >
          {isOpen && (
            <div>
              <p className="text-base font-bold">
                Daily Work
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Monitoring System
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => handleNavigation(item.href)}
                title={!isOpen ? item.label : undefined}
                className={`flex w-full items-center rounded-xl py-3 text-left text-sm font-medium transition ${
                  isOpen
                    ? "gap-3 px-4"
                    : "justify-center px-3"
                } ${
                  active
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}

                {isOpen && (
                  <span>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-slate-800 p-3">
          <div
            className={`flex items-center rounded-xl bg-slate-800 ${
              isOpen
                ? "gap-3 px-3 py-3"
                : "justify-center px-2 py-3"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
              A
            </div>

            {isOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  Admin
                </p>

                <p className="text-xs text-slate-400">
                  Administrator
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}