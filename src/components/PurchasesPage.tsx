import { useState, useEffect } from 'react';
import { Plus, Calendar, DollarSign, ShoppingCart, Trash2, Minus, X, Recycle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GroceryItem {
  id: string;
  name: string;
  category_id?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

interface Market {
  id: string;
  name: string;
  location?: string;
  created_at: string;
}

interface Purchase {
  id: string;
  date: string;
  market_id?: string;
  total_amount: number;
  created_at: string;
}

interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  items?: {
    name: string;
  };
}

export function PurchasesPage() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<Record<string, PurchaseItem[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [currentItems, setCurrentItems] = useState<{ itemId: string; itemName: string; quantity: number; unitPrice: number; totalPrice: number; }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // For adding new item to current purchase
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  
  // For quick item adding
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickItemName, setQuickItemName] = useState('');
  const [quickItemCategoryId, setQuickItemCategoryId] = useState('');
  
  // For quick market adding
  const [showQuickAddMarket, setShowQuickAddMarket] = useState(false);
  const [quickMarketName, setQuickMarketName] = useState('');
  const [quickMarketLocation, setQuickMarketLocation] = useState('');
  
  // Add state for editing index at the top of PurchasesPage
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  
  // Add state for quick category adding
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [itemsResult, categoriesResult, marketsResult, purchasesResult] = await Promise.all([
        supabase.from('items').select('*').eq('user_id', user?.id).order('name'),
        supabase.from('categories').select('*').eq('user_id', user?.id).order('name'),
        supabase.from('markets').select('*').eq('user_id', user?.id).order('name'),
        supabase.from('purchases').select('*').eq('user_id', user?.id).order('date', { ascending: false })
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      if (marketsResult.error) throw marketsResult.error;
      if (purchasesResult.error) throw purchasesResult.error;

      setGroceryItems(itemsResult.data || []);
      setCategories(categoriesResult.data || []);
      setMarkets(marketsResult.data || []);
      setPurchases(purchasesResult.data || []);

      // Load purchase items for all purchases
      if (purchasesResult.data && purchasesResult.data.length > 0) {
        const purchaseItemsResult = await supabase
          .from('purchase_items')
          .select(`
            *,
            items (name)
          `)
          .in('purchase_id', purchasesResult.data.map(p => p.id));

        if (purchaseItemsResult.error) throw purchaseItemsResult.error;

        const groupedItems = (purchaseItemsResult.data || []).reduce((acc, item) => {
          if (!acc[item.purchase_id]) {
            acc[item.purchase_id] = [];
          }
          acc[item.purchase_id].push(item);
          return acc;
        }, {} as Record<string, any[]>);

        setPurchaseItems(groupedItems);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuickCategory = async () => {
    if (!quickCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user?.id,
          name: quickCategoryName.trim(),
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: "Error",
            description: "A category with this name already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setCategories([...categories, data]);
      setQuickItemCategoryId(data.id);
      setQuickCategoryName('');
      setShowQuickAddCategory(false);
      
      toast({
        title: "Success",
        description: "Category added and selected!",
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const addQuickItem = async () => {
    if (!quickItemName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user?.id,
          name: quickItemName.trim(),
          category_id: quickItemCategoryId || null,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: "Error",
            description: "An item with this name already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setGroceryItems([...groceryItems, data]);
      setSelectedItemId(data.id);
      setQuickItemName('');
      setQuickItemCategoryId('');
      setShowQuickAdd(false);
      
      toast({
        title: "Success",
        description: "Item added and selected!",
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const addQuickMarket = async () => {
    if (!quickMarketName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a market name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('markets')
        .insert({
          user_id: user?.id,
          name: quickMarketName.trim(),
          location: quickMarketLocation.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast({
            title: "Error",
            description: "A market with this name already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setMarkets([...markets, data]);
      setSelectedMarketId(data.id);
      setQuickMarketName('');
      setQuickMarketLocation('');
      setShowQuickAddMarket(false);
      
      toast({
        title: "Success",
        description: "Market added and selected!",
      });
    } catch (error) {
      console.error('Error adding market:', error);
      toast({
        title: "Error",
        description: "Failed to add market",
        variant: "destructive",
      });
    }
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

    const newItem = {
      itemId: selectedItemId,
      itemName: selectedItem.name,
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
    };

    if (editIndex !== null) {
      // Edit mode: replace item at editIndex
      const updatedItems = [...currentItems];
      updatedItems[editIndex] = newItem;
      setCurrentItems(updatedItems);
      setEditIndex(null);
      toast({
        title: "Item updated",
        description: `${selectedItem.name} updated in current purchase`,
      });
    } else {
      setCurrentItems([...currentItems, newItem]);
      toast({
        title: "Item added",
        description: `${selectedItem.name} added to current purchase`,
      });
    }
    setSelectedItemId('');
    setQuantity('');
    setUnitPrice('');
  };

  const removeItemFromCurrent = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  const savePurchase = async () => {
    if (currentItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalAmount = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // First create the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user?.id,
          date: selectedDate.toISOString().split('T')[0],
          market_id: selectedMarketId || null,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Then create the purchase items
      const purchaseItemsToInsert = currentItems.map(item => ({
        purchase_id: purchase.id,
        item_id: item.itemId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItemsToInsert);

      if (itemsError) throw itemsError;

      // Reload data to show the new purchase
      await loadData();
      
      setCurrentItems([]);
      setSelectedMarketId('');
      setSelectedDate(new Date());
      
      toast({
        title: "Success",
        description: "Purchase recorded successfully!",
      });
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({
        title: "Error",
        description: "Failed to save purchase",
        variant: "destructive",
      });
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadData();
      
      toast({
        title: "Purchase deleted",
        description: "Purchase removed from your records",
      });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      });
    }
  };

  const currentTotal = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading purchases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
        <p className="text-muted-foreground">Record your grocery shopping trips with multiple items</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add purchase
          </CardTitle>
          <CardDescription>
            Set the date and add multiple items from your shopping trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Market Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium whitespace-nowrap">Purchase date:</label>
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
            <h3 className="font-medium mb-4">Add item to purchase</h3>
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

              <Button 
                onClick={addItemToCurrentPurchase} 
                variant="success" 
                className="w-full"
                disabled={!(selectedItemId && quantity && unitPrice)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to purchase
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
                  <div>
                    <Select value={quickItemCategoryId} onValueChange={(value) => {
                      if (value === 'add-new-category') {
                        setShowQuickAddCategory(true);
                      } else {
                        setQuickItemCategoryId(value);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add-new-category" className="text-primary font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Category
                          </div>
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              {category.id === 'pfand' && <Recycle className="text-green-600" />}
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showQuickAddCategory && (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Category name"
                          value={quickCategoryName}
                          onChange={e => setQuickCategoryName(e.target.value)}
                        />
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            if (!quickCategoryName.trim()) {
                              toast({
                                title: "Error",
                                description: "Please enter a category name",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (categories.some(cat => cat.name.toLowerCase() === quickCategoryName.trim().toLowerCase()) || quickCategoryName.trim().toLowerCase() === 'pfand') {
                              toast({
                                title: "Error",
                                description: "This category already exists",
                                variant: "destructive",
                              });
                              return;
                            }
                             addQuickCategory();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowQuickAddCategory(false);
                            setQuickCategoryName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addQuickItem} variant="success" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button 
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickItemName('');
                      setQuickItemCategoryId('');
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
                <h3 className="font-medium">
                  {selectedMarketId && markets.find(m => m.id === selectedMarketId)?.name
                    ? `Your purchase from ${markets.find(m => m.id === selectedMarketId)?.name}`
                    : 'Your purchase'}
                </h3>
                <span className="text-lg font-semibold text-primary">
                  Total: €{currentTotal.toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {currentItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{item.itemName}</span>
                      {editIndex === index ? (
                        <>
                          <input
                            type="number"
                            min="1"
                            className="border rounded px-2 py-1 w-16 text-sm"
                            value={editQuantity}
                            onChange={e => setEditQuantity(e.target.value)}
                            autoFocus
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="border rounded px-2 py-1 w-20 text-sm"
                            value={editUnitPrice}
                            onChange={e => setEditUnitPrice(e.target.value)}
                          />
                          <span className="text-sm text-muted-foreground">
                            Total: €{editQuantity && editUnitPrice ? (parseInt(editQuantity || '0') * parseFloat(editUnitPrice || '0')).toFixed(2) : '0.00'}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.quantity} × €{item.unitPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">
                        €{item.totalPrice.toFixed(2)}
                      </span>
                      {editIndex === index ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              const qty = parseInt(editQuantity);
                              const price = parseFloat(editUnitPrice);
                              if (!qty || !price) return;
                              const updatedItems = [...currentItems];
                              updatedItems[index] = {
                                ...item,
                                quantity: qty,
                                unitPrice: price,
                                totalPrice: qty * price,
                              };
                              setCurrentItems(updatedItems);
                              setEditIndex(null);
                              setEditQuantity('');
                              setEditUnitPrice('');
                              toast({
                                title: "Item updated",
                                description: `${item.itemName} updated in current purchase`,
                              });
                            }}
                            className="mr-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditIndex(null);
                              setEditQuantity('');
                              setEditUnitPrice('');
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditIndex(index);
                            setEditQuantity(item.quantity.toString());
                            setEditUnitPrice(item.unitPrice.toString());
                          }}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Edit item"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemFromCurrent(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={savePurchase} variant="gradient" size="lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {`Save purchase (€${currentTotal.toFixed(2)})`}
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
            Recent purchases ({purchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No purchases recorded yet. Add the first purchase above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const purchaseItemsData = purchaseItems[purchase.id] || [];
                return (
                <div
                  key={purchase.id}
                  className="border rounded-lg p-4 bg-background hover:shadow-soft transition-all"
                >
                  {/* Title and badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {format(new Date(purchase.date), "PPP")}
                      </h3>
                      <div className="flex items-center mt-1" style={{ gap: 6 }}>
                        {purchase.market_id && markets.find(m => m.id === purchase.market_id) && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal flex items-center gap-1">
                            <Store className="h-3 w-3 mr-1" />
                            {markets.find(m => m.id === purchase.market_id)?.name}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                          {purchaseItemsData.length} item{purchaseItemsData.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-semibold text-primary">
                        €{purchase.total_amount.toFixed(2)}
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
                  {/* Items grid remains unchanged */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {purchaseItemsData.map((item, index) => (
                      <div key={index} className="text-sm bg-secondary/30 rounded p-2">
                        <div className="font-medium">{item.items?.name || 'Unknown Item'}</div>
                        <div className="text-muted-foreground">
                          {item.quantity} × €{item.unit_price.toFixed(2)} = €{item.total_price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}