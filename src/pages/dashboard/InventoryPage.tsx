import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefaultInventoryTab } from '@/components/inventory/DefaultInventoryTab';
import { EmergencyInventoryTab } from '@/components/inventory/EmergencyInventoryTab';
import { InventorySetupTab } from '@/components/inventory/InventorySetupTab';
import { DigitalCardsInventoryTab } from '@/components/inventory/DigitalCardsInventoryTab';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'; // Assuming this exists or similar layout wrapper
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export const InventoryPage = () => {
    const { t } = useTranslation();
    const { settings } = useStoreSettings();
    const [activeTab, setActiveTab] = useState('default');

    const isDigitalStore = settings?.storeType === 'DIGITAL_CARDS';

    return (
        <div className="w-full space-y-6 pb-6">
            <div className="flex flex-col gap-2 pb-4 border-b">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.sidebar.inventory')}</h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
                    {t('dashboard.inventory.description')}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className={`grid w-full ${isDigitalStore ? 'max-w-3xl grid-cols-4' : 'max-w-2xl grid-cols-3'} h-11`}>
                    <TabsTrigger value="default" className="text-sm font-medium">{t('dashboard.inventory.defaultInventory')}</TabsTrigger>
                    {isDigitalStore && (
                        <TabsTrigger value="cards" className="text-sm font-medium">{t('common.cards')}</TabsTrigger>
                    )}
                    <TabsTrigger value="emergency" className="text-sm font-medium">{t('dashboard.inventory.emergencyInventory')}</TabsTrigger>
                    <TabsTrigger value="setup" className="text-sm font-medium">{t('dashboard.inventory.inventorySetup')}</TabsTrigger>
                </TabsList>

                <TabsContent value="default" className="space-y-4 mt-6">
                     <DefaultInventoryTab />
                </TabsContent>

                {isDigitalStore && (
                    <TabsContent value="cards" className="space-y-4 mt-6">
                        <DigitalCardsInventoryTab />
                    </TabsContent>
                )}

                <TabsContent value="emergency" className="space-y-4 mt-6">
                     <EmergencyInventoryTab />
                </TabsContent>

                 <TabsContent value="setup" className="space-y-4 mt-6">
                     <InventorySetupTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InventoryPage;
