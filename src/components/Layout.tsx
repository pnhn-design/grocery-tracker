import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Store, Database, ChevronDown, Tag, LogOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { migrateLocalStorageToSupabase, hasExistingData } from '@/lib/migration';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  // { name: 'Items', href: '/items', icon: Package },
  // { name: 'Markets', href: '/markets', icon: Store },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
];

export function Layout() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      // Check if user has existing data and show migration option
      hasExistingData().then(exists => {
        if (!exists) {
          const hasLocalData = 
            localStorage.getItem('groceryCategories') ||
            localStorage.getItem('groceryItems') ||
            localStorage.getItem('groceryMarkets') ||
            localStorage.getItem('groceryPurchases');
          
          if (hasLocalData) {
            setShowMigration(true);
          }
        }
      });
    }
  }, [user, loading]);

  const handleMigration = async () => {
    try {
      await migrateLocalStorageToSupabase();
      toast({
        title: "Migration Complete",
        description: "Your data has been successfully migrated to the cloud!",
      });
      setShowMigration(false);
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <nav className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-foreground">GroceryTracker</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </NavLink>
                ))}
                {/* Databases Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground focus-visible:text-foreground"
                      style={{ background: 'none', border: 'none' }}
                      type="button"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Databases
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={() => navigate('/items')} className="cursor-pointer hover:text-foreground">
                      <Package className="h-4 w-4 mr-2" /> Items
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/categories')} className="cursor-pointer hover:text-foreground">
                      <Tag className="h-4 w-4 mr-2" /> Categories
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/markets')} className="cursor-pointer hover:text-foreground">
                      <Store className="h-4 w-4 mr-2" /> Markets
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {showMigration && (
                <Button onClick={handleMigration} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Migrate Data
                </Button>
              )}
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}