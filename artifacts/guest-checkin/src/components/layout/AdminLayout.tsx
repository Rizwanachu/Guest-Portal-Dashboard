import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, Users, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/guests/search", label: "Guests", icon: Users },
];

function SidebarNav({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <span className="font-bold text-white text-lg leading-none">CI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xl" style={{ color: "hsl(var(--sidebar-foreground))" }}>
              CheckInn
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--sidebar-accent))", color: "hsl(var(--sidebar-muted-foreground))" }}>
              Beta
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium border-l-2 ${
                isActive
                  ? "bg-indigo-600/20 border-indigo-500 text-white"
                  : "border-transparent hover:bg-white/5 hover:text-white"
              }`}
              style={{
                color: isActive ? "white" : "hsl(var(--sidebar-muted-foreground))",
              }}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? "text-indigo-400" : ""}`}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t" style={{ borderColor: "hsl(var(--sidebar-border))" }} />

        <Link
          href="/bookings/new"
          onClick={onNavigate}
          className="text-xs px-3 py-2 transition-colors block"
          style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
        >
          + New Booking
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4">
        <p className="text-[10px]" style={{ color: "hsl(var(--sidebar-muted-foreground))" }}>
          CheckInn &middot; v1.0
        </p>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden h-14 bg-white border-b flex items-center px-4 shrink-0 shadow-sm justify-between z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-serif font-bold text-xl text-foreground">CheckInn</span>
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0" style={{ backgroundColor: "hsl(var(--sidebar))", borderColor: "hsl(var(--sidebar-border))" }}>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarNav location={location} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 fixed inset-y-0 left-0 z-20 border-r" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <SidebarNav location={location} />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-[260px] min-h-screen bg-background overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
