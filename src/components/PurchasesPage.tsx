import { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, ShoppingCart, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GroceryItem {
  id: string;
  name: string;
  category?: string;
}

interface Purchase {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  date: string;
  createdAt: string;
}

export function PurchasesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const savedItems = localStorage.getItem('grocery-items');
    const savedPurchases = localStorage.getItem('grocery-purchases');
    
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    if (savedPurchases) {
      setPurchases(JSON.parse(savedPurchases));
    }
  }, []);

  const savePurchases = (updatedPurchases: Purchase[]) => {
    localStorage.setItem('grocery-purchases', JSON.stringify(updatedPurchases));
    setPurchases(updatedPurchases);
  };

  const addPurchase = () => {
    if (!selectedItemId || !amount) {
      toast({
        title: "Error",
        description: "Please select an item and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = items.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      itemId: selectedItemId,
      itemName: selectedItem.name,
      amount: parseFloat(amount),
      date: selectedDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedPurchases = [...purchases, newPurchase];
    savePurchases(updatedPurchases);
    
    setSelectedItemId('');
    setAmount('');
    setSelectedDate(new Date());
    
    toast({
      title: "Success",
      description: "Purchase recorded successfully!",
    });
  };

  const deletePurchase = (id: string) => {
    const updatedPurchases = purchases.filter(purchase => purchase.id !== id);
    savePurchases(updatedPurchases);
    
    toast({
      title: "Purchase deleted",
      description: "Purchase removed from your records",
    });
  };

  const sortedPurchases = purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Purchase Tracking</h1>
        <p className="text-muted-foreground">Record your grocery purchases</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Record New Purchase
          </CardTitle>
          <CardDescription>
            Select an item, date, and amount to track your spending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Input
              type="number"
              step="0.01"
              placeholder="Amount ($)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPurchase()}
            />

            <Button onClick={addPurchase} variant="gradient" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Record Purchase
            </Button>
          </div>

          {items.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>No items available. <a href="/items" className="text-primary hover:underline">Add some items</a> first!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Purchases ({purchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No purchases recorded yet. Add your first purchase above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">{purchase.itemName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(purchase.date), "PPP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-primary">
                      ${purchase.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePurchase(purchase.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}