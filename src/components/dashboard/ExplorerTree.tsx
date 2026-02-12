import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronLeft, 
  Folder, FolderOpen, 
  Store, 
  Box, 
  Search,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Interfaces based on the user's description and existing app data
export interface ExplorerCategory {
  id: string; // Acts as parent_category_code
  name: string;
  nameAr?: string;
  // code?: string; // If available
}

export interface ExplorerBrand {
  id: string; // Acts as brand_code usually, or we use 'code'
  name: string;
  nameAr?: string;
  code?: string;
  parentCategoryId?: string; // Relation to category
}

export interface ExplorerProduct {
  id: string; // Acts as product_code
  name: string;
  nameAr?: string;
  brandId?: string; // Relation to brand
  sku?: string;
}

interface ExplorerTreeProps {
  categories: ExplorerCategory[];
  brands: ExplorerBrand[];
  products: ExplorerProduct[];
  onSelectCategory: (category: ExplorerCategory) => void;
  onSelectBrand: (brand: ExplorerBrand) => void;
  onSelectProduct: (product: ExplorerProduct) => void;
  selectedId?: string; // ID of the currently selected item
  className?: string;
  isLoading?: boolean;
}

type TreeNodeType = 'category' | 'brand' | 'product';

interface TreeNode {
  id: string;
  type: TreeNodeType;
  label: string;
  data: ExplorerCategory | ExplorerBrand | ExplorerProduct;
  children: TreeNode[];
  count?: number; // For categories (brands count) and brands (products count)
  code: string; // The code used for matching
}

export function ExplorerTree({
  categories,
  brands,
  products,
  onSelectCategory,
  onSelectBrand,
  onSelectProduct,
  selectedId,
  className,
  isLoading
}: ExplorerTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Helper to toggle node expansion
  const toggleNode = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Build the tree structure
  const treeData = useMemo(() => {
    if (isLoading) return [];

    const rootNodes: TreeNode[] = [];
    const usedBrandIds = new Set<string>();

    // Helper to build a brand node
    const buildBrandNode = (brand: ExplorerBrand): TreeNode => {
        const brandCode = brand.code || brand.id;
        
        // Find Products
        const brandProducts = products.filter(p => 
            p.brandId === brand.id || p.brandId === brand.code
        );

        const productNodes: TreeNode[] = brandProducts.map(prod => ({
          id: prod.id,
          type: 'product',
          label: prod.nameAr || prod.name,
          data: prod,
          children: [],
          code: prod.id
        }));

        return {
          id: brand.id,
          type: 'brand',
          label: brand.name,
          data: brand,
          children: productNodes,
          count: productNodes.length,
          code: brandCode
        };
    };

    // 1. Map Categories (Level 1)
    // Filter out "أخرى" as requested
    const validCategories = categories.filter(c => 
      c.name !== 'أخرى' && c.nameAr !== 'أخرى' && c.name !== 'Other'
    );

    validCategories.forEach(cat => {
      const catCode = cat.id; // Using ID as code based on current data flow
      
      // Find Brands for this Category (Level 2)
      // Normalize both IDs to strings for comparison to handle any type mismatches
      const catBrands = brands.filter(b => {
        const brandParentId = b.parentCategoryId ? String(b.parentCategoryId).trim() : '';
        const categoryId = String(catCode).trim();
        const match = brandParentId === categoryId;
        if (match) usedBrandIds.add(b.id);
        return match;
      });

      const brandNodes = catBrands.map(buildBrandNode);

      rootNodes.push({
        id: cat.id,
        type: 'category',
        label: cat.nameAr || cat.name,
        data: cat,
        children: brandNodes,
        count: brandNodes.length,
        code: catCode
      });
    });

    // 2. Handle Orphan Brands
    const orphanBrands = brands.filter(b => !usedBrandIds.has(b.id));
    if (orphanBrands.length > 0) {
        const orphanBrandNodes = orphanBrands.map(buildBrandNode);
        
        rootNodes.push({
            id: 'uncategorized-brands',
            type: 'category',
            label: 'ماركات غير مصنفة',
            data: { id: 'uncategorized', name: 'Uncategorized', nameAr: 'ماركات غير مصنفة' } as ExplorerCategory,
            children: orphanBrandNodes,
            count: orphanBrandNodes.length,
            code: 'uncategorized'
        });
    }

    return rootNodes;
  }, [categories, brands, products, isLoading]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;

    const query = searchQuery.toLowerCase();
    
    // Recursive filter function
    const filterNode = (node: TreeNode): TreeNode | null => {
      const matches = 
        node.label.toLowerCase().includes(query) || 
        node.code.toLowerCase().includes(query);

      // If it's a leaf (product), return if matches
      if (node.children.length === 0) {
        return matches ? node : null;
      }

      // If it has children, filter them
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is TreeNode => child !== null);

      // Return node if it matches OR has matching children
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          // If searching, we might want to expand parents of matches
        };
      }

      return null;
    };

    return treeData
      .map(node => filterNode(node))
      .filter((node): node is TreeNode => node !== null);

  }, [treeData, searchQuery]);

  // Auto-expand on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          if (node.children.length > 0) collectIds(node.children);
        });
      };
      collectIds(filteredTree);
      setExpandedNodes(allIds);
    } else {
      // Optional: Collapse all or revert to previous state when search clears
      // For now, let's keep them as is or maybe collapse all?
      // setExpandedNodes(new Set()); 
    }
  }, [searchQuery, filteredTree]);

  const handleSelect = (node: TreeNode) => {
    if (node.type === 'category') {
      onSelectCategory(node.data as ExplorerCategory);
      toggleNode(node.id); // Also toggle expansion
    } else if (node.type === 'brand') {
      onSelectBrand(node.data as ExplorerBrand);
      toggleNode(node.id); // Also toggle expansion
    } else if (node.type === 'product') {
      onSelectProduct(node.data as ExplorerProduct);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (!treeData.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FolderOpen className="h-10 w-10 mb-2 opacity-20" />
        <p>لا توجد بيانات لعرضها</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Search Header */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في التصنيفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-9 text-right"
            dir="rtl"
          />
        </div>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1" dir="rtl">
        <div className="p-2 space-y-1">
          {filteredTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            filteredTree.map(node => (
              <TreeItem 
                key={node.id} 
                node={node} 
                level={0} 
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onSelect={handleSelect}
                selectedId={selectedId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Recursive Tree Item Component
interface TreeItemProps {
  node: TreeNode;
  level: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string, e?: React.MouseEvent) => void;
  onSelect: (node: TreeNode) => void;
  selectedId?: string;
}

function TreeItem({ node, level, expandedNodes, toggleNode, onSelect, selectedId }: TreeItemProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  const getIcon = () => {
    if (node.type === 'category') return isExpanded ? FolderOpen : Folder;
    if (node.type === 'brand') return Store;
    return Box;
  };

  const Icon = getIcon();

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm",
          isSelected 
            ? "bg-primary/10 text-primary font-medium" 
            : "hover:bg-muted/50 text-foreground/80",
          level > 0 && "mt-0.5"
        )}
        style={{ paddingRight: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/Collapse Chevron */}
        <div 
          className={cn(
            "p-0.5 rounded-sm hover:bg-muted/80 transition-colors",
            !hasChildren && "invisible"
          )}
          onClick={(e) => toggleNode(node.id, e)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 opacity-50" />
          )}
        </div>

        {/* Icon */}
        <Icon className={cn(
          "h-4 w-4 shrink-0",
          node.type === 'category' && "text-amber-500",
          node.type === 'brand' && "text-purple-500",
          node.type === 'product' && "text-blue-500"
        )} />

        {/* Label */}
        <span className="flex-1 truncate text-right">
          {node.label}
        </span>

        {/* Count Badge */}
        {node.count !== undefined && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] min-w-[20px] justify-center">
            {node.count}
          </Badge>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="border-r border-border/40 mr-[11px]">
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
      
      {/* Empty State for Expanded Parents */}
      {isExpanded && !hasChildren && node.type !== 'product' && (
         <div 
           className="py-2 pr-8 text-xs text-muted-foreground italic"
           style={{ paddingRight: `${(level + 1) * 16 + 8}px` }}
         >
           لا يوجد {node.type === 'category' ? 'ماركات' : 'منتجات'}
         </div>
      )}
    </div>
  );
}
