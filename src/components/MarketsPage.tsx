import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Store, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Market {
  id: string;
  name: string;
  location?: string;
  created_at: string;
}

export const MarketsPage = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [newMarketName, setNewMarketName] = useState("");
  const [newMarketLocation, setNewMarketLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMarkets();
    }
  }, [user]);

  const loadMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setMarkets(data || []);
    } catch (error) {
      console.error('Error loading markets:', error);
      toast({
        title: "Error",
        description: "Failed to load markets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMarket = async () => {
    if (!newMarketName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a market name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('markets')
        .insert({
          user_id: user?.id,
          name: newMarketName.trim(),
          location: newMarketLocation.trim() || null,
        });

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

      toast({
        title: "Success",
        description: "Market added successfully",
      });

      setNewMarketName("");
      setNewMarketLocation("");
      loadMarkets();
    } catch (error) {
      console.error('Error adding market:', error);
      toast({
        title: "Error",
        description: "Failed to add market",
        variant: "destructive",
      });
    }
  };

  const deleteMarket = async (id: string) => {
    try {
      const { error } = await supabase
        .from('markets')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Market deleted successfully",
      });

      loadMarkets();
    } catch (error) {
      console.error('Error deleting market:', error);
      toast({
        title: "Error",
        description: "Failed to delete market",
        variant: "destructive",
      });
    }
  };

  const filteredMarkets = markets.filter(market =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (market.location && market.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading markets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Markets</h1>
        <p className="text-muted-foreground">Manage your grocery shopping locations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Market
            </CardTitle>
            <CardDescription>Add a new grocery store or market</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Market name"
              value={newMarketName}
              onChange={(e) => setNewMarketName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMarket()}
            />
            <Input
              placeholder="Location (optional)"
              value={newMarketLocation}
              onChange={(e) => setNewMarketLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMarket()}
            />
            <Button onClick={addMarket} className="w-full">
              Add Market
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Your Markets
            </CardTitle>
            <CardDescription>
              {markets.length} markets • Search to filter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredMarkets.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {searchQuery ? "No markets match your search" : "No markets yet"}
                </p>
              ) : (
                filteredMarkets.map((market) => (
                  <div
                    key={market.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <div>
                        <span className="font-medium">{market.name}</span>
                        {market.location && (
                          <p className="text-sm text-muted-foreground">{market.location}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMarket(market.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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