"use client";

import { Button } from "@/components/ui/button";
import {
  Settings,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

type AppSidebarProps = {
  theme: ColorScheme;
  onThemeToggle: () => void;
};

export function AppSidebar({
  theme,
  onThemeToggle,
}: AppSidebarProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const handleSettingsClick = () => {
    console.log('Settings clicked - isAdmin:', isAdmin, 'profile:', profile);
    if (isAdmin) {
      router.push('/admin');
    }
  };

  const handleProfileClick = () => {
    console.log('Profile clicked - User:', user?.email);
    console.log('Profile clicked - Profile:', profile);
    console.log('Profile clicked - isAdmin:', isAdmin);

    if (isAdmin) {
      console.log('Redirecting to admin page...');
      router.push('/admin');
    } else {
      console.log('User is not admin, not redirecting');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if there's an error
      router.push('/login');
    }
  };

  // Get user initials for avatar
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
          AI
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Inspra AI
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          onClick={onThemeToggle}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3">
        {/* Empty for now - can add other navigation items here */}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={handleProfileClick}
            title={isAdmin ? "Go to Admin Page" : ""}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-200 text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-300">
                {user?.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                {profile?.role === 'admin' ? 'Admin' : 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'No email'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              onClick={handleSettingsClick}
              title="Admin Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
