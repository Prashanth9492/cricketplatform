import { NavLink, useLocation } from "react-router-dom";
import {
  Trophy,
  Users,
  User,
  Calendar,
  BarChart3,
  Newspaper,
  Camera,
  Table,
  Settings,
  Home,
  Zap,
} from "lucide-react"; // Ensure all icons are correctly imported

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Live Scores", url: "/live-scores", icon: Zap },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Players", url: "/players", icon: User },
  { title: "Fixtures", url: "/fixtures", icon: Calendar },
];

const cricketItems = [
  //{ title: "Statistics", url: "/stats", icon: BarChart3 },
  { title: "Points Table", url: "/points-table", icon: Table },
  { title: "News", url: "/news", icon: Newspaper },
  { title: "Gallery", url: "/gallery", icon: Camera },
];

const adminItems = [
  { title: "Admin", url: "/admindashboard", icon: Settings }
];


export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    setOpenMobile(false);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `w-full justify-start smooth-transition sidebar-item-hover ${
      isActive 
        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Cricket Hub Branding */}
        <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {!collapsed && (
              <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Cricket Hub</h2>
              <p className="text-xs text-sidebar-foreground/70">Live Scores & Updates</p>
              </div>
            )}
            </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cricket Features */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">
            Cricket Features
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cricketItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/80">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {/* Add 'end' prop to NavLink for exact matching */}
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}