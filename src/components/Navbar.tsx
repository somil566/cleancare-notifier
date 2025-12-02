import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Shirt, LayoutDashboard, PlusCircle, Search } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Track Order', icon: Search },
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/new-order', label: 'New Order', icon: PlusCircle },
];

export const Navbar = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-105">
            <Shirt className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg text-foreground leading-tight">
              LaundryTrack
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">
              Smart Notifications
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
