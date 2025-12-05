import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PieChart, DollarSign, TrendingUp, Target, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { usePortfolio, PortfolioItem } from '@/hooks/usePortfolio';
import { useAlpacaMarket } from '@/hooks/useAlpacaMarket';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { IllustratedStatCard } from './IllustratedStatCard';
import { AnimatedList } from './AnimatedList';

export const PortfolioManager = () => {
  const portfolioHook = usePortfolio();
  const alpaca = useAlpacaMarket();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [tempCash, setTempCash] = useState(portfolioHook.cash);
  const [newItem, setNewItem] = useState({
    name: '',
    value: 0,
    allocation: 0,
    change: 0,
    color: 'money-green'
  });

  const colors = ['money-green', 'crypto-orange', 'bitcoin-orange', 'money-gold'];

  // Use Alpaca data if connected, otherwise fall back to portfolio hook
  const isConnected = alpaca.isConnected;
  // Always use manual cash from portfolioHook (user can override Alpaca)
  const cash = portfolioHook.cash ?? 0;
  const totalValue = isConnected ? (alpaca.portfolioValue ?? 0) : (portfolioHook.totalValue ?? 0);
  const totalChangePercent = isConnected ? (alpaca.portfolioChange ?? 0) : (portfolioHook.totalChangePercent ?? 0);
  const portfolio = isConnected 
    ? alpaca.positions.map(pos => ({
        id: pos.symbol,
        name: pos.symbol,
        value: Number(pos.market_value) || 0,
        allocation: 0,
        change: Number(pos.unrealized_plpc) || 0,
        color: 'money-green',
        shares: Number(pos.qty) || 0,
        avgPrice: Number(pos.avg_entry_price) || 0
      }))
    : portfolioHook.portfolio;

  useEffect(() => {
    if (isConnected) {
      alpaca.loadPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleAddItem = () => {
    if (newItem.name && newItem.value > 0) {
      portfolioHook.addToPortfolio(newItem);
      setNewItem({ name: '', value: 0, allocation: 0, change: 0, color: 'money-green' });
      setIsAddingItem(false);
    }
  };

  const handleUpdateItem = () => {
    if (editingItem) {
      portfolioHook.updatePortfolioItem(editingItem.id, editingItem);
      setEditingItem(null);
    }
  };

  const handleEditCash = () => {
    setTempCash(cash);
    setIsEditingCash(true);
  };

  const handleSaveCash = () => {
    portfolioHook.setCash(tempCash);
    setIsEditingCash(false);
  };

  const handleCancelEditCash = () => {
    setTempCash(cash);
    setIsEditingCash(false);
  };

  const handleRefresh = async () => {
    if (isConnected) {
      await alpaca.syncAccount();
      await alpaca.loadPositions();
    }
  };

  const totalGrowth = Number(totalValue) * Number(totalChangePercent) / 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status Banner */}
      {isConnected && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Connected to Alpaca Paper Trading</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Enhanced Portfolio Overview */}
      <AnimatedList className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" staggerDelay={0.08}>
        <IllustratedStatCard
          title="💰 Money to Spend"
          value={`$${cash.toFixed(2)}`}
          subtitle="Click to edit"
          emoji="💵"
          illustration="coins"
          onClick={handleEditCash}
        />

        <IllustratedStatCard
          title="💎 My Treasure Chest"
          value={`$${totalValue.toFixed(2)}`}
          subtitle={`${totalChangePercent >= 0 ? '+' : ''}${totalChangePercent.toFixed(1)}% overall ${isConnected ? '(from Alpaca)' : ''}`}
          emoji="📊"
          illustration="treasure"
          trend={totalChangePercent >= 0 ? 'up' : 'down'}
        />

        <IllustratedStatCard
          title="🌱 How Much I've Grown"
          value={`${totalGrowth >= 0 ? '+' : ''}$${totalGrowth.toFixed(2)}`}
          subtitle="Keep it up! 🚀"
          emoji="📈"
          illustration="growth"
          trend={totalGrowth >= 0 ? 'up' : 'down'}
        />

        <IllustratedStatCard
          title="🏆 Everything I Have"
          value={`$${(totalValue + cash).toFixed(2)}`}
          subtitle="Total assets"
          emoji="👑"
          illustration="trophy"
        />
      </AnimatedList>

      {/* Edit Cash Dialog */}
      <Dialog open={isEditingCash} onOpenChange={setIsEditingCash}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>💰 Edit Your Cash</DialogTitle>
            <DialogDescription>
              Change how much money you have to spend
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cash-amount">Cash Amount ($)</Label>
              <Input
                id="cash-amount"
                type="number"
                value={tempCash}
                onChange={(e) => setTempCash(parseFloat(e.target.value) || 0)}
                className="text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCash} className="flex-1">
                💾 Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancelEditCash} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Portfolio Breakdown */}
      <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <PieChart className="h-5 w-5 text-money-green" />
                🎯 My Investment Collection
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                All the cool stuff you're invested in!
              </CardDescription>
            </div>
            
            {!isConnected && (
              <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Investment
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Investment</DialogTitle>
                  <DialogDescription>Add a new investment to your portfolio</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Investment Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., S&P 500 Index Fund"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Current Value ($)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newItem.value}
                      onChange={(e) => setNewItem(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="change">Performance (%)</Label>
                    <Input
                      id="change"
                      type="number"
                      value={newItem.change}
                      onChange={(e) => setNewItem(prev => ({ ...prev, change: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g., 5.2 for +5.2%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newItem.color}
                      onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                    >
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddItem} className="w-full">Add Investment</Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {portfolio.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-lg font-semibold mb-2">Your treasure chest is empty!</h3>
                <p className="text-muted-foreground mb-4">
                  Start your investment adventure by adding your first treasure! 💎
                </p>
                <Button variant="hero" onClick={() => setIsAddingItem(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add My First Investment! 🚀
                </Button>
              </div>
            ) : (
              portfolio.map((item) => {
                const colorMap: Record<string, string> = {
                  'money-green': 'bg-emerald-500',
                  'crypto-orange': 'bg-orange-500',
                  'bitcoin-orange': 'bg-orange-600',
                  'money-gold': 'bg-yellow-500'
                };
                const bgColor = colorMap[item.color] || 'bg-primary';
                
                return (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-gradient-to-r from-card/50 to-muted/20 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <div className={`w-6 h-6 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold`}>
                      {item.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{item.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.shares ? `${item.shares} shares @ $${item.avgPrice?.toFixed(2)}` : `${((item.value / totalValue) * 100 || 0).toFixed(1)}% of portfolio`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:gap-3">
                    <div className="text-left sm:text-right">
                      <p className="font-medium text-sm sm:text-base">${Number(item.value).toFixed(2)}</p>
                      <p className={`text-xs sm:text-sm ${item.change >= 0 ? 'text-money-green' : 'text-red-500'}`}>
                        {item.change >= 0 ? '+' : ''}{Number(item.change).toFixed(1)}%
                      </p>
                    </div>
                    {!isConnected && (
                      <div className="flex gap-1">
                      <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => setEditingItem(open ? item : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Investment</DialogTitle>
                          </DialogHeader>
                          {editingItem && (
                            <div className="space-y-4">
                              <div>
                                <Label>Investment Name</Label>
                                <Input
                                  value={editingItem.name}
                                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                              </div>
                              <div>
                                <Label>Current Value ($)</Label>
                                <Input
                                  type="number"
                                  value={editingItem.value}
                                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
                                />
                              </div>
                              <div>
                                <Label>Performance (%)</Label>
                                <Input
                                  type="number"
                                  value={editingItem.change}
                                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, change: parseFloat(e.target.value) || 0 } : null)}
                                />
                              </div>
                              <Button onClick={handleUpdateItem} className="w-full">Update Investment</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => portfolioHook.removeFromPortfolio(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};