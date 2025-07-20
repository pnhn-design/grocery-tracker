import { useState, useEffect } from 'react';
import { Plus, Trash2, Store, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Market {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
}

export function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [newMarketName, setNewMarketName] = useState('');
  const [newMarketLocation, setNewMarketLocation] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedMarkets = localStorage.getItem('grocery-markets');
    if (savedMarkets) {
      setMarkets(JSON.parse(savedMarkets));
    }
  }, []);

  const saveMarkets = (updatedMarkets: Market[]) => {
    localStorage.setItem('grocery-markets', JSON.stringify(updatedMarkets));
    setMarkets(updatedMarkets);
  };

  const addMarket = () => {
    if (!newMarketName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a market name",
        variant: "destructive",
      });
      return;
    }

    const newMarket: Market = {
      id: Date.now().toString(),
      name: newMarketName.trim(),
      location: newMarketLocation.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedMarkets = [...markets, newMarket];
    saveMarkets(updatedMarkets);
    setNewMarketName('');
    setNewMarketLocation('');
    
    toast({
      title: "Success",
      description: "Market added successfully!",
    });
  };

  const deleteMarket = (id: string) => {
    const updatedMarkets = markets.filter(market => market.id !== id);
    saveMarkets(updatedMarkets);
    
    toast({
      title: "Market deleted",
      description: "Market removed from your list",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Markets & Stores</h1>
        <p className="text-muted-foreground">Manage your shopping locations</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Market
          </CardTitle>
          <CardDescription>
            Add markets and stores where you shop for groceries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Market name (e.g., Walmart, Tesco)"
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
            <Button onClick={addMarket} variant="gradient" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Market
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Your Markets ({markets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {markets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No markets yet. Add your first shopping location above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-background hover:shadow-soft transition-all animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-foreground">{market.name}</h3>
                      {market.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {market.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMarket(market.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 hover-scale"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}