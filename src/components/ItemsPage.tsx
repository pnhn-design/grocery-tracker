import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface GroceryItem {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export function ItemsPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Search bar state
  const [showQuickCategoryAdd, setShowQuickCategoryAdd] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const { toast } = useToast();

  const PFAND_CATEGORY = { id: 'pfand', name: 'Pfand', createdAt: 'fixed' };

  useEffect(() => {
    const savedItems = localStorage.getItem('grocery-items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
    
    const savedCategories = localStorage.getItem('grocery-categories');
    let loadedCategories = savedCategories ? JSON.parse(savedCategories) : [];
    // Always include Pfand
    if (!loadedCategories.some(cat => cat.id === PFAND_CATEGORY.id || cat.name.toLowerCase() === 'pfand')) {
      loadedCategories = [PFAND_CATEGORY, ...loadedCategories];
    } else {
      loadedCategories = [PFAND_CATEGORY, ...loadedCategories.filter(cat => cat.id !== PFAND_CATEGORY.id && cat.name.toLowerCase() !== 'pfand')];
    }
    setCategories(loadedCategories);
  }, []);

  const saveCategories = (updatedCategories: Category[]) => {
    localStorage.setItem('grocery-categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const addQuickCategory = () => {
    if (!quickCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }
    // Prevent duplicate or reserved name 'Pfand'
    if (quickCategoryName.trim().toLowerCase() === 'pfand' || categories.some(cat => cat.name.toLowerCase() === quickCategoryName.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: quickCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, newCategory];
    saveCategories(updatedCategories);
    
    // Auto-select the new category
    setNewItemCategory(newCategory.id);
    setQuickCategoryName('');
    setShowQuickCategoryAdd(false);
    
    toast({
      title: "Success",
      description: "Category added and selected!",
    });
  };

  const saveItems = (updatedItems: GroceryItem[]) => {
    localStorage.setItem('grocery-items', JSON.stringify(updatedItems));
    setItems(updatedItems);
  };

  const addItem = () => {
    if (!newItemName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item name",
        variant: "destructive",
      });
      return;
    }

    // Find category name from ID
    const selectedCategory = categories.find(cat => cat.id === newItemCategory);
    
    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: selectedCategory?.name || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [...items, newItem];
    saveItems(updatedItems);
    setNewItemName('');
    setNewItemCategory('');
    
    toast({
      title: "Success",
      description: "Item added successfully!",
    });
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);
    
    toast({
      title: "Item deleted",
      description: "Item removed from your list",
    });
  };

  // Group items by category for display
  const groupedItems = items
    .filter((item) => {
      const words = item.name.toLowerCase().split(/\s+/);
      const query = searchQuery.toLowerCase();
      return words.some(word => word.startsWith(query));
    })
    .reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, GroceryItem[]>);

  // Force rebuild to clear cache

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Items</h1>
        <p className="text-muted-foreground">Manage your grocery item database</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add new item
          </CardTitle>
          <CardDescription>
            Add items to your grocery database to track purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Item name (e.g., Apples)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <Select value={newItemCategory} onValueChange={(value) => {
              if (value === 'add-new-category') {
                setShowQuickCategoryAdd(true);
              } else {
                setNewItemCategory(value);
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
            <Button onClick={addItem} variant="gradient" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Quick Add Category Form */}
          {showQuickCategoryAdd && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
              <h4 className="font-medium mb-3 text-primary">Quick Add New Category</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="Category name (e.g., Fruits, Vegetables)"
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addQuickCategory()}
                  className="flex-1"
                />
                <Button onClick={addQuickCategory} variant="success" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button 
                  onClick={() => {
                    setShowQuickCategoryAdd(false);
                    setQuickCategoryName('');
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Your Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items yet. Add your first grocery item above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="font-semibold text-lg text-foreground mb-3 flex items-center gap-2">
                    {category === 'Pfand' && <Recycle className="h-5 w-5 text-green-600" />}
                    {category}
                    <span className="text-sm text-muted-foreground font-normal">
                      ({categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-background hover:shadow-soft transition-all"
                      >
                        <div>
                          <h4 className="font-medium text-foreground">{item.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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