import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImportStats {
  insertedBrands: number;
  updatedBrands: number;
  insertedCategories: number;
  insertedProducts: number;
  updatedProducts: number;
  skippedRows: number;
  errors: number;
}

export default function CatalogImportExport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: t('common.error'),
        description: t('catalog.import.invalidFileType'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setImportStats(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await coreApi.post('/admin/import/excel', formData, {
        requireAuth: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportStats(response as ImportStats);
      
      toast({
        title: t('catalog.import.success'),
        description: t('catalog.import.successDesc', {
          brands: response.insertedBrands + response.updatedBrands,
          categories: response.insertedCategories,
          products: response.insertedProducts + response.updatedProducts,
        }),
      });

      // Trigger products update event
      window.dispatchEvent(new Event('productsUpdated'));
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || t('common.unknownError');
      setImportError(errorMsg);
      toast({
        title: t('catalog.import.failed'),
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${coreApi.baseURL}/admin/export/excel`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('catalog.export.success'),
        description: t('catalog.export.successDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('catalog.export.failed'),
        description: error?.message || t('common.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('catalog.importExport.title', 'Catalog Import/Export')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('catalog.importExport.description', 'Import products, brands, and categories from Excel or export your current catalog')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('catalog.import.title', 'Import Catalog')}
            </CardTitle>
            <CardDescription>
              {t('catalog.import.description', 'Upload an Excel file to import brands, categories, and products')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload">
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      {t('catalog.import.uploading', 'Uploading...')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t('catalog.import.selectFile', 'Select Excel File')}
                    </>
                  )}
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                {t('catalog.import.formats', 'Supported: .xlsx, .xls')}
              </p>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={50} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  {t('catalog.import.processing', 'Processing your file...')}
                </p>
              </div>
            )}

            {importStats && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  {t('catalog.import.completed', 'Import Completed')}
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm space-y-1">
                  <div>✓ {importStats.insertedBrands} {t('catalog.import.brandsCreated', 'brands created')}</div>
                  <div>✓ {importStats.updatedBrands} {t('catalog.import.brandsUpdated', 'brands updated')}</div>
                  <div>✓ {importStats.insertedCategories} {t('catalog.import.categoriesCreated', 'categories created')}</div>
                  <div>✓ {importStats.insertedProducts} {t('catalog.import.productsCreated', 'products created')}</div>
                  <div>✓ {importStats.updatedProducts} {t('catalog.import.productsUpdated', 'products updated')}</div>
                  {importStats.skippedRows > 0 && (
                    <div className="text-yellow-600">⚠ {importStats.skippedRows} {t('catalog.import.rowsSkipped', 'rows skipped')}</div>
                  )}
                  {importStats.errors > 0 && (
                    <div className="text-red-600">✗ {importStats.errors} {t('catalog.import.errors', 'errors')}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {importError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>{t('catalog.import.error', 'Import Error')}</AlertTitle>
                <AlertDescription className="text-sm">{importError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('catalog.export.title', 'Export Catalog')}
            </CardTitle>
            <CardDescription>
              {t('catalog.export.description', 'Download your catalog as an Excel file')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-primary mb-4" />
              <Button
                onClick={handleExport}
                disabled={downloading}
                size="lg"
              >
                {downloading ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-bounce" />
                    {t('catalog.export.downloading', 'Downloading...')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('catalog.export.download', 'Download Excel')}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                {t('catalog.export.note', 'Export includes all brands, categories, and products')}
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('catalog.export.templateInfo', 'Template Format')}</AlertTitle>
              <AlertDescription className="text-sm">
                {t('catalog.export.templateDesc', 'The exported file uses the same format as the import template. You can edit and re-import it.')}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('catalog.importExport.instructions', 'Instructions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t('catalog.import.howTo', 'How to Import:')}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>{t('catalog.import.step1', 'Download the current catalog as a template (optional)')}</li>
              <li>{t('catalog.import.step2', 'Fill in the Excel file with your data')}</li>
              <li>{t('catalog.import.step3', 'Required columns: Brand Code, Brand Name, purple_cards_product_name_ar')}</li>
              <li>{t('catalog.import.step4', 'Category columns: Category, SubCategory1, SubCategory2, etc.')}</li>
              <li>{t('catalog.import.step5', 'Upload the file using the Import button above')}</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t('catalog.import.features', 'Features:')}</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>{t('catalog.import.feature1', 'Idempotent: Re-importing the same file will not create duplicates')}</li>
              <li>{t('catalog.import.feature2', 'Automatic SKU generation if not provided')}</li>
              <li>{t('catalog.import.feature3', 'Hierarchical category support (unlimited depth)')}</li>
              <li>{t('catalog.import.feature4', 'Brand and product upsert based on unique keys')}</li>
              <li>{t('catalog.import.feature5', 'Arabic text support with proper encoding')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
