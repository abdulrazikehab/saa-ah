import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileCustomPage({ pageId: propPageId }: { pageId?: string }) {
    const { pageId: paramPageId } = useParams();
    const navigate = useNavigate();
    const pageId = propPageId || paramPageId;
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                // Ensure we get the correct tenant config
                let currentTenantId = localStorage.getItem('storefrontTenantId') || sessionStorage.getItem('storefrontTenantId');
                const configUrl = currentTenantId 
                    ? `/app-builder/config?tenantId=${currentTenantId}` 
                    : '/app-builder/config';

                const res = await coreApi.get(configUrl);
                const appConfig = res.config || res;
                setConfig(appConfig);
                
                const foundPage = appConfig.pages?.find((p: any) => p.id === pageId);
                setPage(foundPage);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [pageId]);

    if (loading) return <div className="p-10 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-gray-900 mx-auto"></div></div>;

    if (!page) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-bold">Page Not Found</h2>
                <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    // Determine font family from config
    const style = { fontFamily: config?.fontFamily || 'inherit' };

    return (
        <div className="min-h-screen bg-gray-50 pb-20" style={style}>
             {/* Header */}
             <div className="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                   <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
                <h1 className="font-bold text-lg truncate">{page.title}</h1>
             </div>

             {/* Content Placeholder */}
             <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] text-center text-muted-foreground">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{page.title}</h2>
                <p className="text-sm max-w-xs mx-auto">
                   {/* Custom content will be rendered here */}
                   This page is active. Add content via the App Builder content editor.
                </p>
             </div>
        </div>
    );
}
