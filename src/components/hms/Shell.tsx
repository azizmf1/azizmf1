import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell, ChevronLeft, FileCog, Home, LayoutGrid, LogOut, Megaphone, Menu,
  MessageCircle, Monitor, Settings, ShieldCheck, Sparkles, Users as UsersIcon, X,
} from "lucide-react";
import { getSession, clearSession } from "@/lib/session";
import { ROLE_LABEL, type User } from "@/data/users";
import { toast } from "@/components/hms/Toast";
import sehaLogoWhite from "@/assets/seha-logo-white.png";

const NAV = [
  { to: "/dashboard",       label: "الصفحة الرئيسية",  icon: Home },
  { to: "/system",          label: "ادارة النظام",      icon: Monitor },
  { to: "/announcements",   label: "التعاميم",          icon: Megaphone },
  { to: "/services-admin",  label: "إدارة الخدمات",     icon: FileCog },
  { to: "/services",        label: "الخدمات",           icon: LayoutGrid, expandable: true },
];

function SehaLogo() {
  return (
    <img src={sehaLogoWhite} alt="صحة طبي — Seha Medical" className="h-12 w-auto object-contain" />
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setUser(s.user);
  }, [navigate]);

  if (!user) return null;

  const logout = () => {
    clearSession();
    toast.info("تم تسجيل الخروج");
    navigate({ to: "/login" });
  };

  const initial = user.name.trim().charAt(0);

  return (
    <div className="flex min-h-screen bg-[var(--ink-10)]">
      {/* Sidebar — start side: right in RTL, left in LTR */}
      <aside
        className={`no-print fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-[var(--brand-100)] bg-[var(--brand-90)] shadow-sm transition-transform lg:static lg:translate-x-0 rtl:max-lg:translate-x-full ltr:max-lg:-translate-x-full ${
          mobile ? "!translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-7 pb-6 lg:justify-center lg:pb-8">
          <SehaLogo />
          <button className="lg:hidden text-white/80" onClick={() => setMobile(false)} aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            const exists = n.to === "/dashboard" || n.to === "/services" || n.to === "/hunting-medical";
            const cls = `group relative flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] transition-all ${
              active
                ? "bg-[var(--brand-70)] text-white font-semibold shadow-sm"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            }`;
            const inner = (
              <>
                <Icon className="size-5 shrink-0" strokeWidth={1.7} />
                <span className="flex-1">{n.label}</span>
                {n.expandable && <ChevronLeft className="size-4 opacity-70 rtl-flip" />}
              </>
            );
            return exists ? (
              <Link key={n.to} to={n.to} onClick={() => setMobile(false)} className={cls}>{inner}</Link>
            ) : (
              <button key={n.to} type="button" onClick={() => toast.info("قريبًا")} className={cls + " w-full text-start"}>{inner}</button>
            );
          })}
        </nav>


        <div className="p-4" />

      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="no-print sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[var(--ink-20)] bg-white px-6 lg:px-10">
          {/* Menu + Profile (leading side: right in RTL) */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2.5 text-[var(--ink-50)] transition-all hover:bg-[var(--ink-10)] hover:text-[var(--brand-90)] lg:hidden"
              onClick={() => setMobile(true)}
              aria-label="القائمة"
            >
              <Menu className="size-6" strokeWidth={1.8} />
            </button>
            <button className="hidden rounded-xl p-2.5 text-[var(--ink-50)] transition-all hover:bg-[var(--ink-10)] hover:text-[var(--brand-90)] lg:block" aria-label="القائمة">
              <Menu className="size-6" strokeWidth={1.8} />
            </button>

            <div className="hidden flex-col items-start md:flex">
              <span className="text-[14px] font-bold leading-tight text-[var(--brand-90)]">{user.name}</span>
              <span className="mt-0.5 text-[11px] font-medium text-[var(--ink-50)]">{ROLE_LABEL[user.role]} · {user.org}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((s) => !s)}
                className="flex size-11 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--brand-90)] to-[var(--brand-50)] text-[15px] font-bold text-white shadow-md ring-2 ring-white"
              >
                {initial}
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute start-0 top-full z-20 mt-2 w-64 rounded-xl border border-[var(--ink-20)] bg-white p-1.5 shadow-[var(--shadow-md)]">
                    <div className="border-b border-[var(--ink-10)] px-3 py-2.5">
                      <div className="text-[13px] font-semibold text-[var(--brand-90)]">{user.name}</div>
                      <div className="text-[11px] text-[var(--ink-50)]">{user.org}</div>
                      <div className="num mt-1 text-[11px] text-[var(--ink-50)]">{user.id}</div>
                    </div>
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--ink-70)] hover:bg-[var(--ink-10)]">
                      <Settings className="size-4" /> الإعدادات
                    </button>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--err-700)] hover:bg-[var(--err-50)]">
                      <LogOut className="size-4" /> تسجيل الخروج
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions (trailing side: left in RTL) */}
          <div className="flex items-center gap-1">
            <button className="relative rounded-xl p-2.5 text-[var(--ink-50)] transition-all hover:bg-[var(--ink-10)] hover:text-[var(--brand-90)]" aria-label="الإشعارات">
              <Bell className="size-6" strokeWidth={1.8} />
              <span className="absolute top-2 left-2 flex size-4 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--err-600)] opacity-60" />
                <span className="num relative inline-flex size-4 items-center justify-center rounded-full bg-[var(--err-600)] text-[9px] font-bold text-white">4</span>
              </span>
            </button>
            <button className="rounded-xl p-2.5 text-[var(--ink-50)] transition-all hover:bg-[var(--ink-10)] hover:text-[var(--brand-90)]" aria-label="الإعدادات">
              <Settings className="size-6" strokeWidth={1.8} />
            </button>
            <button
              onClick={logout}
              className="rounded-xl p-2.5 text-[var(--err-600)] transition-all hover:bg-[var(--err-50)]"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="size-6 rtl-flip" strokeWidth={1.8} />
            </button>
          </div>

        </header>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="no-print border-t border-[var(--ink-20)] bg-white px-6 py-4 lg:px-10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-medium text-[var(--ink-50)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[var(--brand-50)]" />
              منصة صحة معتمدة من قبل وزارة الصحة @ 2026
            </span>
            <span className="h-3 w-px bg-[var(--ink-20)]" />
            <span className="num cursor-pointer transition-colors hover:text-[var(--brand-90)]">920002005</span>
            <span className="h-3 w-px bg-[var(--ink-20)]" />
            <a href="mailto:support@seha.sa" className="cursor-pointer transition-colors hover:text-[var(--brand-90)]">support@seha.sa</a>
          </div>
        </footer>
      </div>

      {mobile && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobile(false)} />}

      {/* Floating assistant pill */}
      <div className="no-print fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--ink-20)] bg-white px-2 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]">
        <button className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--ink-90)] to-[var(--ink-60)] text-white" aria-label="مساعد ذكي">
          <Sparkles className="size-4" />
        </button>
        <button className="flex size-9 items-center justify-center rounded-full bg-[var(--brand-70)] text-white" aria-label="محادثة">
          <MessageCircle className="size-4" />
        </button>
      </div>
    </div>

  );
}

export function PageHeader({
  title, subtitle, breadcrumb, action,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; to?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--ink-20)] bg-white px-4 py-5 lg:px-10 no-print">
      {breadcrumb && (
        <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--ink-50)]">
          {breadcrumb.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {b.to ? <Link to={b.to} className="hover:text-[var(--brand-90)]">{b.label}</Link> : <span className="text-[var(--ink-80)]">{b.label}</span>}
              {i < breadcrumb.length - 1 && <span className="text-[var(--ink-30)]">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--brand-90)]">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-[var(--ink-60)]">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

// Suppress unused warning while keeping import path valid for future use
void UsersIcon;
