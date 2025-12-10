import { LogOut, Sun, Moon, Trophy } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Teams", path: "/teams" },
 { name: "Live Scores", path: "/live-scores" },
  { name: "Players", path: "/players" },
  { name: "Fixtures", path: "/fixtures" },
  { name: "Points-table", path: "/points-table" },
  { name: "Gallery", path: "/gallery" },
 // { name: "News", path: "/news" },
  //{ name: "Statistics", path: "/stats" },
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [theme, setTheme] = useTheme();

  if (location.pathname === "/auth" || location.pathname.startsWith("/admin")) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className={`min-h-screen w-full bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        {/* First row: Logo and theme toggle */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Cricket Championship</h1>
              <p className="text-xs text-muted-foreground">Live Scores & Updates</p>
            </div>
          </div>
          {/* Theme toggle button - positioned at the right corner */}
          <div className="flex items-center">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button> */}
          </div>
        </div>
        {/* Second row: Navigation links - centered on desktop */}
        <div className="pb-3 md:pb-0 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 md:gap-4 whitespace-nowrap md:justify-center">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${location.pathname === link.path ? 'bg-primary text-white dark:bg-gray-700' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}