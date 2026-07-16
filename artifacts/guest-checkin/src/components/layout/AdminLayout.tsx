import { Calendar, LayoutDashboard, Search, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bookings", label: "Bookings", icon: Calendar },
    { href: "/guests/search", label: "Search Guests", icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-primary text-primary-foreground md:min-h-screen flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 pb-2">
          <h1 className="font-serif text-2xl tracking-tight text-secondary">The Haven</h1>
          <p className="text-xs text-primary-foreground/70 uppercase tracking-widest mt-1">Check-in Portal</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors whitespace-nowrap md:whitespace-normal ${
                  isActive
                    ? "bg-primary-foreground/10 text-white font-medium"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 md:h-screen md:overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
