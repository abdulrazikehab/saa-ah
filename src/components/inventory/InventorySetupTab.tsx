import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { inventoryApi, InventorySetupItem } from '@/lib/inventory-api';

export const InventorySetupTab = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const [activeInventoryType, setActiveInventoryType] = useState<'DEFAULT' | 'EMERGENCY'>('EMERGENCY');
    // We start with Category view as requested in plan, but user can switch
    const [activeEntityType, setActiveEntityType] = useState<'CATEGORY' | 'BRAND' | 'PRODUCT'>('CATEGORY');
    
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<InventorySetupItem[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    
    // Track pending changes: entityId -> newStatus
    const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getSetup(activeInventoryType, activeEntityType, page, 50, search);
            setItems(res.data);
            setPendingChanges({}); // Clear pending on refresh
        } catch (error) {
            console.error("Failed to fetch setup items", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [activeInventoryType, activeEntityType, page, search]);

    const handleToggle = (id: string, currentStatus: boolean) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: !currentStatus
        }));
    };

    const handleSave = async () => {
        const changes = Object.entries(pendingChanges).map(([id, isActive]) => ({
            entityType: activeEntityType,
            entityId: id,
            isActive
        }));
        
        if (changes.length === 0) return;

        try {
            await inventoryApi.updateVisibility(activeInventoryType, changes);
            toast({ title: t('common.success'), description: "Visibility settings updated" });
            fetchItems(); 
        } catch (error) {
             toast({ title: t('common.error'), variant: 'destructive', description: "Failed to update settings" });
        }
    };

    return (
        <div className="space-y-6">
             {/* Controls */}
             <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border">
                 <div className="flex flex-wrap gap-4 items-center">
                     <div className="w-48">
                        <label className="text-sm font-medium mb-1 block">{t('dashboard.inventory.inventoryView')}</label>
                        <Select value={activeInventoryType} onValueChange={(v: any) => setActiveInventoryType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DEFAULT">{t('dashboard.inventory.defaultInventory')}</SelectItem>
                                <SelectItem value="EMERGENCY">{t('dashboard.inventory.emergencyInventory')}</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>

                     <div className="w-48">
                        <label className="text-sm font-medium mb-1 block">{t('dashboard.inventory.entityType')}</label>
                        <Select value={activeEntityType} onValueChange={(v: any) => setActiveEntityType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CATEGORY">{t('dashboard.inventory.categories')}</SelectItem>
                                <SelectItem value="BRAND">{t('dashboard.inventory.brands')}</SelectItem>
                                <SelectItem value="PRODUCT">{t('dashboard.inventory.products')}</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {Object.keys(pendingChanges).length > 0 && (
                     <Button onClick={handleSave} className="animate-in fade-in">
                         {t('common.saveChanges')} ({Object.keys(pendingChanges).length})
                     </Button>
                )}
             </div>

             <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50">
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.name')}</TableHead>
                             {activeEntityType === 'PRODUCT' && <TableHead className="font-semibold h-12">SKU</TableHead>}
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.globalStatus')}</TableHead>
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.inventoryVisibility')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                             <TableRow>
                                <TableCell colSpan={activeEntityType === 'PRODUCT' ? 4 : 3} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={activeEntityType === 'PRODUCT' ? 4 : 3} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <span className="text-sm text-muted-foreground">{t('common.noData')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                const isEffectiveActive = pendingChanges[item.id] !== undefined ? pendingChanges[item.id] : item.inventoryActive;

                                return (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium py-4 px-4">{item.name}</TableCell>
                                        {activeEntityType === 'PRODUCT' && (
                                            <TableCell className="py-4 px-4">
                                                <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{item.sku || '-'}</span>
                                            </TableCell>
                                        )}
                                        <TableCell className="py-4 px-4">
                                            <Badge variant={item.globalActive ? 'default' : 'secondary'} className="font-normal">
                                                {item.globalActive ? t('dashboard.inventory.active') : t('dashboard.inventory.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Switch 
                                                    checked={isEffectiveActive}
                                                    onCheckedChange={() => handleToggle(item.id, isEffectiveActive)}
                                                    className="flex-shrink-0"
                                                />
                                                <span className={`text-sm font-medium ${isEffectiveActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {isEffectiveActive ? t('dashboard.inventory.visible') : t('dashboard.inventory.hidden')}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
