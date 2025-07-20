import { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, ShoppingCart, Trash2, Minus, X } from 'lucide-react';
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
  createdAt: string;
}

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
  marketId?: string;
  marketName?: string;
  items: PurchaseItem[];
  totalAmount: number;
  createdAt: string;
}

interface Market {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export function PurchasesPage() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [currentItems, setCurrentItems] = useState<PurchaseItem[]>([]);
  
  // For adding new item to current purchase
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  // For quick item adding
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemCategory, setQuickItemCategory] = useState('');
  
  // For quick market adding
  const [showQuickAddMarket, setShowQuickAddMarket] = useState(false);
  const [quickMarketName, setQuickMarketName] = useState('');
  const [quickMarketLocation, setQuickMarketLocation] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    const savedItems = localStorage.getItem('grocery-items');
    const savedMarkets = localStorage.getItem('grocery-markets');
    const savedPurchases = localStorage.getItem('grocery-purchases');
    
    if (savedItems) {
      setGroceryItems(JSON.parse(savedItems));
    }
    if (savedMarkets) {
      setMarkets(JSON.parse(savedMarkets));
    }
    if (savedPurchases) {
      // Convert old format to new format if needed
      const parsed = JSON.parse(savedPurchases);
      if (parsed.length > 0 && parsed[0].itemId) {
        // Old format, convert it
        const converted = convertOldPurchases(parsed);
        setPurchases(converted);
        localStorage.setItem('grocery-purchases', JSON.stringify(converted));
      } else {
        setPurchases(parsed);
      }
    }
  }, []);

  const convertOldPurchases = (oldPurchases: any[]): Purchase[] => {
    const grouped = oldPurchases.reduce((acc, old) => {
      const dateKey = old.date.split('T')[0]; // Group by date only
      if (!acc[dateKey]) {
        acc[dateKey] = {
          id: `converted-${dateKey}`,
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

  const savePurchases = (updatedPurchases: Purchase[]) => {
    localStorage.setItem('grocery-purchases', JSON.stringify(updatedPurchases));
    setPurchases(updatedPurchases);
  };

  const addQuickItem = () => {
    if (!quickItemName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: quickItemName.trim(),
      category: quickItemCategory.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...groceryItems, newItem];
    localStorage.setItem('grocery-items', JSON.stringify(updatedItems));
    setGroceryItems(updatedItems);
    
    // Auto-select the new item
    setSelectedItemId(newItem.id);
    setQuickItemName('');
    setQuickItemCategory('');
    setShowQuickAdd(false);
    
    toast({
      title: "Success",
      description: "Item added and selected!",
    });
  };

  const addQuickMarket = () => {
    if (!quickMarketName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a market name",
        variant: "destructive",
      });
      return;
    }

    const newMarket: Market = {
      id: Date.now().toString(),
      name: quickMarketName.trim(),
      location: quickMarketLocation.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedMarkets = [...markets, newMarket];
    localStorage.setItem('grocery-markets', JSON.stringify(updatedMarkets));
    setMarkets(updatedMarkets);
    // Auto-select the new market
    setSelectedMarketId(newMarket.id);
    setQuickMarketName('');
    setQuickMarketLocation('');
    setShowQuickAddMarket(false);
    toast({
      title: "Success",
      description: "Market added and selected!",
    });
  };

  const addItemToCurrentPurchase = () => {
    if (!selectedItemId || !quantity || !unitPrice) {
      toast({
        title: "Error",
        description: "Please select an item, quantity, and unit price",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = groceryItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const total = qty * price;

    const newItem: PurchaseItem = {
      itemId: selectedItemId,
      itemName: selectedItem.name,
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
    };

    setCurrentItems([...currentItems, newItem]);
    setSelectedItemId('');
    setQuantity('');
    setUnitPrice('');
    
    toast({
      title: "Item added",
      description: `${selectedItem.name} added to current purchase`,
    });
  };

  const removeItemFromCurrent = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  const savePurchase = () => {
    if (currentItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the purchase",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const selectedMarket = markets.find(m => m.id === selectedMarketId);

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      marketId: selectedMarketId || undefined,
      marketName: selectedMarket?.name || undefined,
      items: currentItems,
      totalAmount,
      createdAt: new Date().toISOString(),
    };

    const updatedPurchases = [...purchases, newPurchase];
    savePurchases(updatedPurchases);
    
    setCurrentItems([]);
    setSelectedMarketId('');
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
  const currentTotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Purchase Tracking</h1>
        <p className="text-muted-foreground">Record your grocery shopping trips with multiple items</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Shopping Trip
          </CardTitle>
          <CardDescription>
            Set the date and add multiple items from your shopping trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Market Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Shopping Date:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
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
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Market:</label>
              <Select value={selectedMarketId} onValueChange={(value) => {
                if (value === 'add-new-market') {
                  setShowQuickAddMarket(true);
                } else {
                  setSelectedMarketId(value);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select market (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add-new-market" className="text-primary font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Market
                    </div>
                  </SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name} {market.location && `- ${market.location}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showQuickAddMarket && (
              <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                <h4 className="font-medium mb-3 text-primary">Quick Add New Market</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Market name"
                    value={quickMarketName}
                    onChange={(e) => setQuickMarketName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQuickMarket()}
                  />
                  <Input
                    placeholder="Location (optional)"
                    value={quickMarketLocation}
                    onChange={(e) => setQuickMarketLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQuickMarket()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addQuickMarket} variant="success" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowQuickAddMarket(false);
                        setQuickMarketName('');
                        setQuickMarketLocation('');
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Item Form */}
          <div className="border rounded-lg p-4 bg-secondary/20">
            <h3 className="font-medium mb-4">Add Item to Shopping Trip</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Select 
                  value={selectedItemId} 
                  onValueChange={(value) => {
                    if (value === 'add-new') {
                      setShowQuickAdd(true);
                    } else {
                      setSelectedItemId(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add-new" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Item
                      </div>
                    </SelectItem>
                    {groceryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItemToCurrentPurchase()}
              />

              <Input
                type="number"
                step="0.01"
                placeholder="Unit Price (€)"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItemToCurrentPurchase()}
              />

              <div className="flex items-center text-sm text-muted-foreground">
                Total: €{quantity && unitPrice ? (parseInt(quantity || '0') * parseFloat(unitPrice || '0')).toFixed(2) : '0.00'}
              </div>

              <Button onClick={addItemToCurrentPurchase} variant="success" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Quick Add Item Form */}
            {showQuickAdd && (
              <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                <h4 className="font-medium mb-3 text-primary">Quick Add New Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Item name"
                    value={quickItemName}
                    onChange={(e) => setQuickItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQuickItem()}
                  />
                  <Input
                    placeholder="Category (optional)"
                    value={quickItemCategory}
                    onChange={(e) => setQuickItemCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQuickItem()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addQuickItem} variant="success" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowQuickAdd(false);
                        setQuickItemName('');
                        setQuickItemCategory('');
                      }} 
                      variant="outline" 
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {groceryItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No items available. <a href="/items" className="text-primary hover:underline">Add some items</a> first!</p>
              </div>
            )}
          </div>

          {/* Current Items */}
          {currentItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Items in Current Purchase</h3>
                <span className="text-lg font-semibold text-primary">
                  Total: €{currentTotal.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {currentItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} × €{item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">
                        €{item.totalPrice.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemFromCurrent(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={savePurchase} variant="gradient" size="lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Save Shopping Trip (€{currentTotal.toFixed(2)})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Shopping Trips ({purchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shopping trips recorded yet. Add your first purchase above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="border rounded-lg p-4 bg-background hover:shadow-soft transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">
                        Shopping Trip - {format(new Date(purchase.date), "PPP")}
                        {purchase.marketName && (
                          <span className="text-sm text-muted-foreground ml-2">
                            at {purchase.marketName}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {purchase.items.length} item{purchase.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-semibold text-primary">
                        €{purchase.totalAmount.toFixed(2)}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {purchase.items.map((item, index) => (
                      <div key={index} className="text-sm bg-secondary/30 rounded p-2">
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-muted-foreground">
                          {item.quantity} × €{item.unitPrice.toFixed(2)} = €{item.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
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