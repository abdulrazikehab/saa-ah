import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateService, Template } from '@/services/template.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const categoryColors: Record<string, string> = {
  fashion: 'bg-gradient-to-br from-pink-500 to-rose-500',
  electronics: 'bg-gradient-to-br from-blue-500 to-indigo-500',
  food: 'bg-gradient-to-br from-orange-500 to-red-500',
  beauty: 'bg-gradient-to-br from-purple-500 to-pink-500',
  home: 'bg-gradient-to-br from-green-500 to-emerald-500',
  digital: 'bg-gradient-to-br from-indigo-500 to-purple-500',
};

const categoryIcons: Record<string, string> = {
  fashion: '👗',
  electronics: '💻',
  food: '🍽️',
  beauty: '💄',
  home: '🏠',
  digital: '🎮',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templateService.getTemplates({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      console.log('Templates loaded:', data); // Debug log
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const categories = [
    { value: 'fashion', label: 'Fashion', icon: '👗' },
    { value: 'electronics', label: 'Electronics', icon: '💻' },
    { value: 'food', label: 'Food & Beverage', icon: '🍽️' },
    { value: 'beauty', label: 'Beauty', icon: '💄' },
    { value: 'home', label: 'Home & Furniture', icon: '🏠' },
    { value: 'digital', label: 'Digital Products', icon: '🎮' },
  ];

  const handleUseTemplate = (template: Template) => {
    // Navigate to page builder with template ID as query param
    // Encode template.id to handle special characters like + in base64 IDs
    navigate(`/dashboard/pages/new?templateId=${encodeURIComponent(template.id)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Website Templates
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Choose from our professionally designed templates to get started quickly
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/dashboard/pages/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Page
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
            >
              All Templates
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedCategory(cat.value)}
                className={selectedCategory === cat.value ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold mb-2">No templates found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search or filters'
                  : 'No templates available yet'}
              </p>
              <Button onClick={() => navigate('/dashboard/pages/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 dark:hover:border-blue-400"
                onClick={() => handleUseTemplate(template)}
              >
                {/* Template Thumbnail */}
                <div className={`h-48 relative ${categoryColors[template.category] || 'bg-gradient-to-br from-gray-400 to-gray-600'} overflow-hidden`}>
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-7xl mb-2">{categoryIcons[template.category] || '📄'}</div>
                        <p className="text-sm font-medium opacity-90">{template.category}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Use This Template
                    </Button>
                  </div>

                  {/* Official Badge */}
                  {template.isDefault && (
                    <Badge className="absolute top-3 right-3 bg-white text-gray-900 shadow-lg">
                      Official
                    </Badge>
                  )}
                </div>

                {/* Template Info */}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {template.description || 'Professional template ready to use'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {categoryIcons[template.category]} {template.category}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
