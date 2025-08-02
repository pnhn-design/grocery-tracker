import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Search, Recycle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GroceryItem {
  id: string;
  name: string;
  category_id: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export const ItemsPage = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user?.id).order('name'),
        supabase.from('items').select('*').eq('user_id', user?.id).order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setCategories(categoriesResult.data || []);
      setItems(itemsResult.data || []);
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

  const addItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .insert({
          user_id: user?.id,
          name: newItemName.trim(),
          category_id: selectedCategoryId || null,
        });

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

      toast({
        title: "Success",
        description: "Item added successfully",
      });

      setNewItemName("");
      setSelectedCategoryId("");
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    return categories.find(cat => cat.id === categoryId)?.name || "Unknown";
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((groups, item) => {
    const categoryName = getCategoryName(item.category_id);
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {} as Record<string, GroceryItem[]>);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Items</h1>
        <p className="text-muted-foreground">Manage your grocery items</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Item
            </CardTitle>
            <CardDescription>Add a new grocery item to your list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
            <div className="space-y-2">
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addItem} className="w-full">
              Add Item
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Your Items
            </CardTitle>
            <CardDescription>
              {items.length} items • Search to filter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(groupedItems).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {searchQuery ? "No items match your search" : "No items yet"}
                </p>
              ) : (
                Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
                  <div key={categoryName} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      {categoryName === 'Pfand' ? (
                        <Recycle className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                      {categoryName} ({categoryItems.length})
                    </div>
                    <div className="space-y-1 pl-6">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-background rounded border border-border/50"
                        >
                          <span className="font-medium">{item.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};