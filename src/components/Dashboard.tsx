import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  id: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  createdAt: string;
}

interface GroceryItem {
  id: string;
  name: string;
  category?: string;
}

export function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const savedPurchases = localStorage.getItem('grocery-purchases');
    const savedItems = localStorage.getItem('grocery-items');
    
    if (savedPurchases) {
      const parsed = JSON.parse(savedPurchases);
      // Handle both old and new format
      if (parsed.length > 0 && parsed[0].itemId) {
        // Old format, convert it
        const converted = convertOldPurchases(parsed);
        setPurchases(converted);
      } else {
        setPurchases(parsed);
      }
    }
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  const convertOldPurchases = (oldPurchases: any[]): Purchase[] => {
    const grouped = oldPurchases.reduce((acc, old) => {
      const dateKey = old.date.split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          id: `converted-${dateKey}-${Date.now()}`,
          date: old.date,
          items: [],
          totalAmount: 0,
          createdAt: old.createdAt
        };
      }
      
      acc[dateKey].items.push({
        itemId: old.itemId,
        itemName: old.itemName,
        quantity: 1,
        unitPrice: old.amount,
        totalPrice: old.amount
      });
      acc[dateKey].totalAmount += old.amount;
      
      return acc;
    }, {} as Record<string, Purchase>);
    
    return Object.values(grouped);
  };

  // Daily spending data
  const dailySpending = useMemo(() => {
    const grouped = purchases.reduce((acc, purchase) => {
      const date = format(parseISO(purchase.date), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + purchase.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, amount]) => ({
        date: format(parseISO(date), 'MMM dd'),
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [purchases]);

  // Monthly spending data with current month filter
  const monthlySpending = useMemo(() => {
    const currentMonthKey = format(currentMonth, 'yyyy-MM');
    const monthPurchases = purchases.filter(purchase => {
      const purchaseMonth = format(parseISO(purchase.date), 'yyyy-MM');
      return purchaseMonth === currentMonthKey;
    });

    const dailyData = monthPurchases.reduce((acc, purchase) => {
      const day = format(parseISO(purchase.date), 'dd');
      acc[day] = (acc[day] || 0) + purchase.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyData)
      .map(([day, amount]) => ({
        day: `${day}`,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [purchases, currentMonth]);

  // Top spending items
  const topSpendingItems = useMemo(() => {
    const grouped = purchases.reduce((acc, purchase) => {
      purchase.items.forEach(item => {
        acc[item.itemName] = (acc[item.itemName] || 0) + item.totalPrice;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [purchases]);

  // Price progression for selected item
  const priceProgression = useMemo(() => {
    if (!selectedItem) return [];
    
    const itemPurchases: Array<{ date: string; price: number; purchase: number }> = [];
    let purchaseCount = 0;
    
    purchases
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(purchase => {
        const item = purchase.items.find(item => item.itemId === selectedItem);
        if (item) {
          purchaseCount++;
          itemPurchases.push({
            purchase: purchaseCount,
            date: format(parseISO(purchase.date), 'MMM dd'),
            price: item.unitPrice
          });
        }
      });

    return itemPurchases;
  }, [purchases, selectedItem]);

  // Category spending breakdown
  const categorySpending = useMemo(() => {
    const categoryTotals = purchases.reduce((acc, purchase) => {
      purchase.items.forEach(item => {
        const groceryItem = items.find(gi => gi.id === item.itemId);
        const category = groceryItem?.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + item.totalPrice;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2))
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [purchases, items]);

  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const averagePerPurchase = purchases.length > 0 ? totalSpent / purchases.length : 0;
  const currentMonthSpending = purchases
    .filter(p => {
      const purchaseDate = parseISO(p.date);
      const now = new Date();
      return purchaseDate >= startOfMonth(now) && purchaseDate <= endOfMonth(now);
    })
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const COLORS = ['hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(220, 91%, 60%)', 'hsl(0, 84%, 60%)', 'hsl(280, 76%, 56%)'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Your grocery spending analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">€{totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">€{currentMonthSpending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Purchase</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">€{averagePerPurchase.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{purchases.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Daily spending</CardTitle>
            <CardDescription>Your spending patterns on over the past 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`€${value}`, 'Amount']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Monthly spending with navigator */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Monthly spending</CardTitle>
                <CardDescription>Your monthly spending on groceries.</CardDescription>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[80px] text-center">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  disabled={currentMonth >= new Date()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`€${value}`, 'Amount']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Category Breakdown */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>Your spending by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySpending} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="category" type="category" width={80} fontSize={11} />
                <Tooltip 
                  formatter={(value) => [`€${value}`, 'Amount']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(220, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Top Spending Items */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Top spending</CardTitle>
            <CardDescription>Items you're spending the most on.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topSpendingItems.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ name, value }) => `${name}: €${value}`}
                  labelLine={false}
                >
                  {topSpendingItems.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`€${value}`, 'Total Spent']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price Progression */}
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price progression
              </CardTitle>
              <CardDescription>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an item to see price progression" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {priceProgression.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceProgression}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, 'Price']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(280, 76%, 56%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(280, 76%, 56%)', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an item to see its price progression.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Items List */}
      {topSpendingItems.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
            <CardDescription>Complete list of items by total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSpendingItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-primary">€{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}