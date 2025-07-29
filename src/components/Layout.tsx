import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Store, Database, ChevronDown, Tag, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  // { name: 'Items', href: '/items', icon: Package },
  // { name: 'Markets', href: '/markets', icon: Store },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
];

export function Layout() {
  const navigate = useNavigate();
  const { user, profile, userRole, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
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
                {/* Admin Link for Admins */}
                {userRole === 'admin' && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:text-foreground'
                      }`
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </NavLink>
                )}
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.username || 'User'}</p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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