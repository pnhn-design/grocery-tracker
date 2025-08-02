import { supabase } from "@/integrations/supabase/client";

export interface LocalStorageData {
  categories?: any[];
  items?: any[];
  markets?: any[];
  purchases?: any[];
}

const PFAND_CATEGORY = {
  id: 'pfand',
  name: 'Pfand',
  createdAt: new Date().toISOString()
};

export async function migrateLocalStorageToSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated to migrate data');

  // Get existing data from localStorage
  const localData: LocalStorageData = {
    categories: JSON.parse(localStorage.getItem('groceryCategories') || '[]'),
    items: JSON.parse(localStorage.getItem('groceryItems') || '[]'),
    markets: JSON.parse(localStorage.getItem('groceryMarkets') || '[]'),
    purchases: JSON.parse(localStorage.getItem('groceryPurchases') || '[]'),
  };

  // Migrate categories (always include Pfand)
  const categoriesToMigrate = localData.categories || [];
  if (!categoriesToMigrate.find(cat => cat.name === 'Pfand')) {
    categoriesToMigrate.unshift(PFAND_CATEGORY);
  }

  const categoryIdMap = new Map();
  
  for (const category of categoriesToMigrate) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: category.name,
      })
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error('Error migrating category:', error);
    } else if (data) {
      categoryIdMap.set(category.id || category.name, data.id);
    }
  }

  // Migrate markets
  const marketIdMap = new Map();
  
  for (const market of localData.markets || []) {
    const { data, error } = await supabase
      .from('markets')
      .insert({
        user_id: user.id,
        name: market.name,
        location: market.location,
      })
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error('Error migrating market:', error);
    } else if (data) {
      marketIdMap.set(market.id, data.id);
    }
  }

  // Migrate items
  const itemIdMap = new Map();
  
  for (const item of localData.items || []) {
    const categoryId = categoryIdMap.get(item.category || 'Pfand');
    
    const { data, error } = await supabase
      .from('items')
      .insert({
        user_id: user.id,
        name: item.name,
        category_id: categoryId,
      })
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error('Error migrating item:', error);
    } else if (data) {
      itemIdMap.set(item.id, data.id);
    }
  }

  // Migrate purchases and purchase items
  for (const purchase of localData.purchases || []) {
    const marketId = marketIdMap.get(purchase.marketId);
    
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        market_id: marketId,
        date: purchase.date,
        total_amount: purchase.total || 0,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error migrating purchase:', purchaseError);
      continue;
    }

    // Migrate purchase items
    for (const item of purchase.items || []) {
      const itemId = itemIdMap.get(item.itemId);
      
      if (itemId) {
        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert({
            purchase_id: purchaseData.id,
            item_id: itemId,
            quantity: item.quantity || 1,
            unit_price: item.unitPrice || 0,
          });

        if (itemError) {
          console.error('Error migrating purchase item:', itemError);
        }
      }
    }
  }

  console.log('Migration completed successfully');
}

export async function hasExistingData(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (count || 0) > 0;
}