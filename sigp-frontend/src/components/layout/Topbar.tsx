import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/forms/Button';

export function Topbar() {
  const location = useLocation();
  const { setSidebarOpen } = useUIStore();

  const path = location.pathname;
  let currentTitle = "Tableau de bord";
  if (path.includes('projects')) currentTitle = "Projets";
  if (path.includes('users')) currentTitle = "Utilisateurs";
  if (path.includes('documents')) currentTitle = "Documents";
  if (path.includes('settings')) currentTitle = "Paramètres";

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8 z-10 sticky top-0 shadow-sm">
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Ouvrir la sidebar</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-border md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        
        {/* Breadcrumb / Title Area */}
        <div className="flex items-center text-sm flex-1">
          {/* Desktop Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              GPD ERP
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-foreground tracking-tight">{currentTitle}</span>
          </div>
          
          {/* Mobile Title */}
          <div className="sm:hidden flex items-center">
            <span className="font-semibold text-foreground tracking-tight">{currentTitle}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex flex-1 items-center justify-end sm:justify-center">
          <div className="w-full max-w-lg hidden sm:block">
            <Input 
              type="search" 
              placeholder="Rechercher des projets, contrats, documents..." 
              leftIcon={<Search className="h-4 w-4" />}
              className="bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input h-9"
            />
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <span className="sr-only">Notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </Button>
          
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            <span className="sr-only">Aide</span>
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* User Dropdown (Simulated for layout) */}
          <div className="flex items-center gap-x-4">
            <button type="button" className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors">
              <span className="sr-only">Ouvrir menu utilisateur</span>
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                MN
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
