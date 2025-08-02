import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Recycle, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Category {
  id: string;
  name: string;
  created_at: string;
}

const PFAND_CATEGORY_NAME = 'Pfand';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;

      const categoriesData = data || [];
      
      // Ensure Pfand category exists
      if (!categoriesData.find(cat => cat.name === PFAND_CATEGORY_NAME)) {
        await createPfandCategory();
        loadCategories(); // Reload to include Pfand
        return;
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPfandCategory = async () => {
    const { error } = await supabase
      .from('categories')
      .insert({
        user_id: user?.id,
        name: PFAND_CATEGORY_NAME,
      });

    if (error && !error.message.includes('duplicate')) {
      console.error('Error creating Pfand category:', error);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    if (newCategoryName.toLowerCase() === PFAND_CATEGORY_NAME.toLowerCase()) {
      toast({
        title: "Error",
        description: "Pfand category already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user?.id,
          name: newCategoryName.trim(),
        });

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

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setNewCategoryName("");
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (name === PFAND_CATEGORY_NAME) {
      toast({
        title: "Error",
        description: "Cannot delete the Pfand category",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <p className="text-muted-foreground">Manage your grocery item categories</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Category
            </CardTitle>
            <CardDescription>Create a new category for your grocery items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
            </div>
            <Button onClick={addCategory} className="w-full">
              Add Category
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Your Categories
            </CardTitle>
            <CardDescription>
              {categories.length} categories • Search to filter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {searchQuery ? "No categories match your search" : "No categories yet"}
                </p>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      {category.name === PFAND_CATEGORY_NAME ? (
                        <Recycle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-primary/20" />
                      )}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    {category.name !== PFAND_CATEGORY_NAME && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category.id, category.name)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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