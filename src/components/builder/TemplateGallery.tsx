import { useState, useEffect, useCallback } from 'react';
import { templateService, Template } from '@/services/template.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const categoryColors:  Record<string, string> = {
  fashion: 'bg-pink-500',
  electronics: 'bg-blue-500',
  food: 'bg-orange-500',
  beauty: 'bg-purple-500',
  home: 'bg-green-500',
  digital: 'bg-indigo-500',
};

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templateService.getTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = [
    { value: 'fashion', label: t('templates.categories.fashion', 'Fashion') },
    { value: 'electronics', label: t('templates.categories.electronics', 'Electronics') },
    { value: 'food', label: t('templates.categories.food', 'Food & Beverage') },
    { value: 'beauty', label: t('templates.categories.beauty', 'Beauty') },
    { value: 'home', label: t('templates.categories.home', 'Home & Furniture') },
    { value: 'digital', label: t('templates.categories.digital', 'Digital Products') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t('templates.title', 'Choose a Template')}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 rtl:right-3 rtl:left-auto" />
            <Input
              type="text"
              placeholder={t('templates.searchPlaceholder', 'Search templates...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rtl:pr-10 rtl:pl-3"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              {t('common.all', 'All')}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('templates.noTemplates', 'No templates found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  {/* Template Thumbnail */}
                  <div className={`h-48 relative ${categoryColors[template.category] || 'bg-gray-300'}`}>
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-5xl">
                        {template.category === 'fashion' && '👗'}
                        {template.category === 'electronics' && '💻'}
                        {template.category === 'food' && '🍽️'}
                        {template.category === 'beauty' && '💄'}
                        {template.category === 'home' && '🏠'}
                        {template.category === 'digital' && '🎮'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('templates.useTemplate', 'Use This Template')}
                      </Button>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      {template.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {t('templates.official', 'Official')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description || t('templates.noDescription', 'No description')}
                    </p>
                    <div className="mt-3">
                      <span className="text-xs text-gray-500 capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
