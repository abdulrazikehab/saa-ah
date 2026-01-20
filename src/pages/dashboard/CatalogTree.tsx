import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Package, Loader2 } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TreeNode {
  id: string;
  name: string;
  nameAr?: string;
  children: TreeNode[];
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku?: string;
}

export default function CatalogTree() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await coreApi.get('/catalog/tree', { requireAuth: true });
      setTree(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: t('catalog.tree.loadError', 'Failed to load catalog tree'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const filterTree = (nodes: TreeNode[], search: string): TreeNode[] => {
    if (!search) return nodes;
    
    const searchLower = search.toLowerCase();
    return nodes.map(node => {
      const matchesNode = 
        node.name.toLowerCase().includes(searchLower) ||
        node.nameAr?.toLowerCase().includes(searchLower) ||
        false;
      
      const matchingProducts = node.products.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.nameAr?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        false
      );

      const filteredChildren = filterTree(node.children, search);
      
      if (matchesNode || matchingProducts.length > 0 || filteredChildren.length > 0) {
        return {
          ...node,
          products: matchingProducts.length > 0 ? matchingProducts : node.products,
          children: filteredChildren,
        };
      }
      return null;
    }).filter(Boolean) as TreeNode[];
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const hasProducts = node.products.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
          }`}
          onClick={() => {
            if (hasChildren || hasProducts) {
              toggleNode(node.id);
            }
            setSelectedNode(node.id);
          }}
        >
          {hasChildren || hasProducts ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )
          ) : (
            <div className="w-4" />
          )}
          
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500" />
            )
          ) : (
            <Package className="h-4 w-4 text-blue-500" />
          )}
          
          <span className="flex-1 text-sm font-medium">
            {node.nameAr || node.name}
          </span>
          
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Badge variant="secondary" className="text-xs">
                {node.children.length}
              </Badge>
            )}
            {hasProducts && (
              <Badge variant="default" className="text-xs">
                {node.products.length} {t('catalog.tree.products', 'products')}
              </Badge>
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {node.children.map(child => renderNode(child, level + 1))}
            {hasProducts && (
              <div style={{ marginLeft: `${(level + 1) * 20}px` }} className="space-y-1">
                {node.products.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 py-1.5 px-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md"
                  >
                    <Package className="h-3 w-3" />
                    <span className="flex-1">{product.nameAr || product.name}</span>
                    {product.sku && (
                      <Badge variant="outline" className="text-xs">
                        {product.sku}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const filteredTree = filterTree(tree, searchTerm);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('catalog.tree.title', 'Catalog Explorer')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('catalog.tree.description', 'Browse your product catalog in a tree structure')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('catalog.tree.structure', 'Catalog Structure')}</span>
            <Input
              type="text"
              placeholder={t('catalog.tree.search', 'Search...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm
                ? t('catalog.tree.noResults', 'No matching items found')
                : t('catalog.tree.empty', 'No catalog data available. Import your catalog to get started.')}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-1">
                {filteredTree.map(node => renderNode(node))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
