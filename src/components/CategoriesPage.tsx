import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

const PFAND_CATEGORY: Category = {
  id: 'pfand',
  name: 'Pfand',
  createdAt: 'fixed',
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  // Helper to ensure Pfand is always present
  const withPfand = (cats: Category[]) => {
    const hasPfand = cats.some(cat => cat.id === PFAND_CATEGORY.id || cat.name.toLowerCase() === 'pfand');
    if (hasPfand) {
      // Replace any existing Pfand with the fixed one (by id or name)
      return [
        PFAND_CATEGORY,
        ...cats.filter(cat => cat.id !== PFAND_CATEGORY.id && cat.name.toLowerCase() !== 'pfand'),
      ];
    }
    return [PFAND_CATEGORY, ...cats];
  };

  useEffect(() => {
    const savedCategories = localStorage.getItem('grocery-categories');
    if (savedCategories) {
      setCategories(withPfand(JSON.parse(savedCategories)));
    } else {
      setCategories([PFAND_CATEGORY]);
    }
  }, []);

  const saveCategories = (updatedCategories: Category[]) => {
    // Never save without Pfand
    const cats = withPfand(updatedCategories);
    localStorage.setItem('grocery-categories', JSON.stringify(cats.filter(cat => cat.id !== PFAND_CATEGORY.id)));
    setCategories(cats);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    // Prevent duplicate or reserved name 'Pfand'
    if (newCategoryName.trim().toLowerCase() === 'pfand' || categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, newCategory];
    saveCategories(updatedCategories);
    setNewCategoryName('');
    
    toast({
      title: "Success",
      description: "Category added successfully!",
    });
  };

  const deleteCategory = (id: string) => {
    if (id === PFAND_CATEGORY.id) {
      toast({
        title: "Error",
        description: 'The "Pfand" category cannot be deleted.',
        variant: "destructive",
      });
      return;
    }
    const updatedCategories = categories.filter(category => category.id !== id);
    saveCategories(updatedCategories);
    
    toast({
      title: "Category deleted",
      description: "Category removed from your list",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <p className="text-muted-foreground">Manage your grocery item categories</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add new category
          </CardTitle>
          <CardDescription>
            Create categories to organize your grocery items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Category name (e.g., Fruits, Vegetables)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1"
            />
            <Button onClick={addCategory} variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Your Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories yet. Add your first category above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-2">
                    {category.id === PFAND_CATEGORY.id && (
                      <Recycle className="text-green-600" />
                    )}
                    <h3 className="font-medium text-foreground">{category.name}</h3>
                  </div>
                  {category.id !== PFAND_CATEGORY.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}