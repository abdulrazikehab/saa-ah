import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Search, Loader2, Eye, Edit, MoreHorizontal, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { inventoryApi, InventorySetupItem } from '@/lib/inventory-api';
import { DataTablePagination } from '@/components/common/DataTablePagination';

export const DefaultInventoryTab = () => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const isRTL = i18n.language === 'ar';
    
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<InventorySetupItem[]>([]);
    const [entityType, setEntityType] = useState<'PRODUCT' | 'CATEGORY' | 'BRAND'>('PRODUCT');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [total, setTotal] = useState(0);
    const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventorySetupItem | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [emergencyReason, setEmergencyReason] = useState<string>('manual');
    const [emergencyNotes, setEmergencyNotes] = useState<string>('');
    const [movingToEmergency, setMovingToEmergency] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page when search changes
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryApi.getSetup('DEFAULT', entityType, page, itemsPerPage, debouncedSearch || undefined);
            setItems(res.data || []);
            setTotal(res.total || 0);
            setPendingChanges({}); // Clear pending changes on refresh
        } catch (error) {
            console.error("Failed to fetch default inventory", error);
            toast({
                title: t('common.error'),
                description: t('common.failedToLoad'),
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }, [entityType, page, itemsPerPage, debouncedSearch, t, toast]);

    useEffect(() => {
        setSelectedIds([]);
        fetchItems();
    }, [fetchItems]);

    const handleToggle = (id: string, currentStatus: boolean) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: !currentStatus
        }));
    };

    const handleSaveChanges = async () => {
        const changes = Object.entries(pendingChanges).map(([id, isActive]) => ({
            entityType: entityType,
            entityId: id,
            isActive
        }));
        
        if (changes.length === 0) return;

        try {
            await inventoryApi.updateVisibility('DEFAULT', changes);
            toast({
                title: t('common.success'),
                description: t('common.saveChanges')
            });
            fetchItems();
        } catch (error) {
            console.error("Failed to update visibility", error);
            toast({
                title: t('common.error'),
                description: t('common.failedToLoad'),
                variant: 'destructive'
            });
        }
    };

    const handleMoveToEmergency = (item?: InventorySetupItem) => {
        if (item) {
            setSelectedItem(item);
        } else {
            setSelectedItem(null);
        }
        setEmergencyReason('manual');
        setEmergencyNotes('');
        setShowEmergencyDialog(true);
    };

    const handleConfirmMoveToEmergency = async () => {
        const idsToMove = selectedItem ? [selectedItem.id] : selectedIds;
        if (idsToMove.length === 0) return;

        setMovingToEmergency(true);
        try {
            await inventoryApi.upsertEmergencyItems(idsToMove.map(id => ({
                productId: id,
                reason: emergencyReason,
                notes: emergencyNotes || undefined
            })));
            
            toast({
                title: t('common.success'),
                description: t('dashboard.inventory.movedToEmergency')
            });
            
            setShowEmergencyDialog(false);
            setSelectedItem(null);
            setSelectedIds([]);
            setEmergencyReason('manual');
            setEmergencyNotes('');
            fetchItems(); // Refresh the list
        } catch (error) {
            console.error("Failed to move to emergency inventory", error);
            toast({
                title: t('common.error'),
                description: t('common.failedToLoad'),
                variant: 'destructive'
            });
        } finally {
            setMovingToEmergency(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length && items.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(i => i.id));
        }
    };

    const toggleSelectItem = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const totalPages = useMemo(() => {
        return Math.ceil(total / itemsPerPage);
    }, [total, itemsPerPage]);

    const getEditLink = (item: InventorySetupItem) => {
        switch (entityType) {
            case 'PRODUCT':
                return `/dashboard/products?edit=${item.id}`;
            case 'CATEGORY':
                return `/dashboard/categories?edit=${item.id}`;
            case 'BRAND':
                return `/dashboard/settings/brands?edit=${item.id}`;
            default:
                return '#';
        }
    };

    const getViewLink = (item: InventorySetupItem) => {
        switch (entityType) {
            case 'PRODUCT':
                return `/products/${item.id}`;
            case 'CATEGORY':
                return `/categories/${item.id}`;
            case 'BRAND':
                return `/products?brandId=${item.id}`; // Preferred way to view brand products
            default:
                return '#';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="w-full sm:w-48">
                    <Select value={entityType} onValueChange={(v: 'PRODUCT' | 'CATEGORY' | 'BRAND') => setEntityType(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PRODUCT">{t('dashboard.inventory.products')}</SelectItem>
                            <SelectItem value="CATEGORY">{t('dashboard.inventory.categories')}</SelectItem>
                            <SelectItem value="BRAND">{t('dashboard.inventory.brands')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                        placeholder={t('common.search')}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchItems} className="whitespace-nowrap">
                        {t('common.refresh')}
                    </Button>
                    {entityType === 'PRODUCT' && selectedIds.length > 0 && (
                        <Button 
                            onClick={() => handleMoveToEmergency()} 
                            className="bg-orange-600 hover:bg-orange-700 text-white animate-in fade-in zoom-in-95 whitespace-nowrap"
                        >
                            <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('dashboard.inventory.moveToEmergency')} ({selectedIds.length})
                        </Button>
                    )}
                    {Object.keys(pendingChanges).length > 0 && (
                        <Button onClick={handleSaveChanges} className="animate-in fade-in whitespace-nowrap">
                            {t('common.saveChanges')} ({Object.keys(pendingChanges).length})
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/50">
                            <TableHead className="w-12 px-4">
                                <Checkbox 
                                    checked={items.length > 0 && selectedIds.length === items.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-semibold h-12">
                                {entityType === 'PRODUCT' ? t('dashboard.inventory.productName') : 
                                 entityType === 'CATEGORY' ? t('dashboard.inventory.categoryName') : 
                                 t('dashboard.inventory.brandName')}
                            </TableHead>
                            {entityType === 'PRODUCT' && <TableHead className="font-semibold h-12">SKU</TableHead>}
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.status')}</TableHead>
                            <TableHead className="font-semibold h-12">{t('dashboard.inventory.active')}</TableHead>
                            <TableHead className="text-center font-semibold h-12">{t('common.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={entityType === 'PRODUCT' ? 6 : 5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={entityType === 'PRODUCT' ? 6 : 5} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <span className="text-sm text-muted-foreground">{t('common.noData')}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                const isEffectiveActive = pendingChanges[item.id] !== undefined 
                                    ? pendingChanges[item.id] 
                                    : item.inventoryActive;

                                return (
                                    <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="w-12 px-4 py-4">
                                            <Checkbox 
                                                checked={selectedIds.includes(item.id)}
                                                onCheckedChange={() => toggleSelectItem(item.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium py-4 px-4">{item.name}</TableCell>
                                        {entityType === 'PRODUCT' && (
                                            <TableCell className="py-4 px-4">
                                                <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{item.sku || '-'}</span>
                                            </TableCell>
                                        )}
                                        <TableCell className="py-4 px-4">
                                            <Badge variant={item.globalActive ? 'default' : 'secondary'} className="font-normal">
                                                {item.globalActive ? t('common.active') : t('common.inactive')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Switch 
                                                    checked={isEffectiveActive}
                                                    onCheckedChange={() => handleToggle(item.id, isEffectiveActive)}
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`text-sm font-medium ${isEffectiveActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {isEffectiveActive ? t('dashboard.inventory.visible') : t('dashboard.inventory.hidden')}
                                                    </span>
                                                    {item.hasOverride && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {t('dashboard.inventory.inventorySetup')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-4">
                                            <div className={`flex items-center justify-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-muted transition-colors"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={isRTL ? 'end' : 'start'}>
                                                        <DropdownMenuItem onClick={() => handleToggle(item.id, isEffectiveActive)}>
                                                            {isEffectiveActive ? t('dashboard.inventory.hidden') : t('dashboard.inventory.visible')}
                                                        </DropdownMenuItem>
                                                        {entityType === 'PRODUCT' && (
                                                            <DropdownMenuItem 
                                                                onClick={() => handleMoveToEmergency(item)}
                                                                className="text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400"
                                                            >
                                                                <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                                                {t('dashboard.inventory.moveToEmergency')}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 0 && (
                <DataTablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPage}
                    onItemsPerPageChange={setItemsPerPage}
                    showItemsPerPage={true}
                />
            )}

            {/* Move to Emergency Inventory Dialog */}
            <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.inventory.moveToEmergency')}</DialogTitle>
                        <DialogDescription>
                            {selectedItem ? (
                                <span>
                                    {t('dashboard.inventory.moveToEmergencyDesc')}: <strong>{selectedItem.name}</strong>
                                </span>
                            ) : (
                                <span>
                                    {t('dashboard.inventory.moveToEmergencyBulkDesc', { count: selectedIds.length })}: <strong>{selectedIds.length} {t('dashboard.inventory.items')}</strong>
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">{t('dashboard.inventory.selectReason')}</Label>
                            <Select value={emergencyReason} onValueChange={setEmergencyReason}>
                                <SelectTrigger id="reason">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">{t('dashboard.inventory.reasonManual')}</SelectItem>
                                    <SelectItem value="needed">{t('dashboard.inventory.reasonNeeded')}</SelectItem>
                                    <SelectItem value="cost_gt_price">{t('dashboard.inventory.reasonCostGtPrice')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">{t('dashboard.inventory.addNotes')}</Label>
                            <Textarea
                                id="notes"
                                placeholder={t('dashboard.inventory.notes')}
                                value={emergencyNotes}
                                onChange={(e) => setEmergencyNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setShowEmergencyDialog(false);
                                setSelectedItem(null);
                                setEmergencyReason('manual');
                                setEmergencyNotes('');
                            }}
                            disabled={movingToEmergency}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            onClick={handleConfirmMoveToEmergency}
                            disabled={movingToEmergency}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {movingToEmergency ? (
                                <>
                                    <Loader2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('dashboard.inventory.moveToEmergency')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
