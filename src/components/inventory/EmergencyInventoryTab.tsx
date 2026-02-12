import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { inventoryApi, EmergencyInventoryItem } from '@/lib/inventory-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const EmergencyInventoryTab = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<EmergencyInventoryItem[]>([]);
    const [cardItems, setCardItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Auto Add Dialog
    const [showAutoAddDialog, setShowAutoAddDialog] = useState(false);
    const [activeAutoAction, setActiveAutoAction] = useState<'cost' | 'needed' | null>(null);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const [res, cardRes] = await Promise.all([
                inventoryApi.getEmergencyInventory(page, 20, search),
                inventoryApi.getCardEmergencyInventory(page, 20, search).catch(() => ({ data: [], total: 0 }))
            ]);
            setItems(res.data);
            setCardItems(cardRes.data || []);
            setTotal(res.total); // Only tracking total for products for now, pagination is shared/messy if not separated
        } catch (error) {
            console.error("Failed to fetch emergency inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [page, search]);

    const handleRemove = async (productId: string) => {
        if (!productId) return;
        try {
             await inventoryApi.removeEmergencyItem(productId);
             toast({ title: t('common.success'), description: "Item removed from emergency inventory" });
             fetchItems();
        } catch (error) {
             toast({ title: t('common.error'), variant: 'destructive', description: "Failed to remove item" });
        }
    };

    const handleRecoverCard = async (cardId: string) => {
        try {
             await inventoryApi.recoverCardsFromEmergency([cardId]);
             toast({ title: t('common.success'), description: "Card recovered successfully" });
             fetchItems();
        } catch (error) {
             toast({ title: t('common.error'), variant: 'destructive', description: "Failed to recover card" });
        }
    };

    const handleAutoAdd = async () => {
        try {
            if (activeAutoAction === 'cost') {
                await inventoryApi.autoAddCostGtPrice();
            } else if (activeAutoAction === 'needed') {
                await inventoryApi.autoAddNeeded();
            }
            toast({ title: t('common.success'), description: "Auto-add process completed" });
            setShowAutoAddDialog(false);
            fetchItems();
        } catch (error) {
             toast({ title: t('common.error'), variant: 'destructive', description: "Failed to auto-add items" });
        }
    };

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                 <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => { setActiveAutoAction('cost'); setShowAutoAddDialog(true); }}>
                        <Zap className="me-2 h-4 w-4" />
                        {t('dashboard.inventory.autoCostGtPrice')}
                    </Button>
                    <Button variant="outline" onClick={() => { setActiveAutoAction('needed'); setShowAutoAddDialog(true); }}>
                        <Zap className="me-2 h-4 w-4" />
                        {t('dashboard.inventory.autoNeeded')}
                    </Button>
                    {/* Manual Add would go here (Dialog with product picker) */}
                     {/* <Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button> */}
                </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50">
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.productName')}</TableHead>
                            <TableHead className="font-semibold h-12">SKU</TableHead>
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.reason')}</TableHead>
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.notes')}</TableHead>
                             <TableHead className="text-end font-semibold h-12">{t('dashboard.inventory.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('common.noData')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="py-4 px-4 font-medium">{item.product?.name}</TableCell>
                                    <TableCell className="py-4 px-4">
                                        <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{item.product?.sku || '-'}</span>
                                    </TableCell>
                                    <TableCell className="py-4 px-4">
                                        <Badge variant="outline">{item.reason}</Badge>
                                    </TableCell>
                                    <TableCell className="py-4 px-4 max-w-xs truncate text-sm text-muted-foreground">{item.notes}</TableCell>
                                    <TableCell className="text-right py-4 px-4">
                                         <Button variant="ghost" size="icon" onClick={() => handleRemove(item.productId)} className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                             <Trash2 className="h-4 w-4" />
                                         </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Digital Card Emergency Inventory Section */}
            <div className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.inventory.digitalCardEmergency') || 'Digital Card Emergency Inventory (Serials)'}</h3>
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/50">
                                <TableHead className="font-semibold h-12">{t('dashboard.inventory.productName')}</TableHead>
                                <TableHead className="font-semibold h-12">{t('dashboard.inventory.serialNumber') || 'Serial Number'}</TableHead>
                                <TableHead className="font-semibold h-12">{t('dashboard.inventory.pin') || 'PIN'}</TableHead>
                                <TableHead className="font-semibold h-12">{t('dashboard.inventory.importedAt') || 'Imported At'}</TableHead>
                                <TableHead className="text-end font-semibold h-12">{t('dashboard.inventory.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : cardItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {t('common.noData')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cardItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-4 px-4 font-medium">{item.product?.name}</TableCell>
                                        <TableCell className="py-4 px-4 font-mono">{item.cardCode}</TableCell>
                                        <TableCell className="py-4 px-4 font-mono">{item.cardPin || '-'}</TableCell>
                                        <TableCell className="py-4 px-4 text-sm text-muted-foreground">{new Date(item.importedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right py-4 px-4">
                                            <Button variant="ghost" size="sm" onClick={() => handleRecoverCard(item.id)} className="h-8 hover:bg-green-50 text-green-600">
                                                {t('common.recover') || 'Recover'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={showAutoAddDialog} onOpenChange={setShowAutoAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.inventory.autoAddItems')}</DialogTitle>
                        <DialogDescription>
                            {activeAutoAction === 'cost' 
                                ? t('dashboard.inventory.autoAddCostDesc')
                                : t('dashboard.inventory.autoAddNeededDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAutoAddDialog(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleAutoAdd}>{t('common.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
