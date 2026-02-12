# Sub-Market Digital Cards Template System

A comprehensive, modern, SaaS-ready template system for digital cards marketplaces with multi-tenant support.

## 📁 Folder Structure

```
Frontend/src/
├── components/
│   └── submarket/
│       ├── SubMarketProductCard.tsx    # Enhanced product card component
│       ├── CategoryCard.tsx             # Category display card
│       ├── SearchBar.tsx                # Search functionality
│       ├── ProductFilters.tsx           # Advanced filtering system
│       └── index.ts                     # Component exports
│
└── pages/
    └── submarket/
        ├── SubMarketHome.tsx            # Home page with all sections
        ├── CategoryListing.tsx           # Category/product listing page
        ├── SubMarketProductDetail.tsx   # Product details page
        ├── BuyerDashboard.tsx           # Post-purchase dashboard
        └── index.ts                      # Page exports
```

## 🎨 Pages Overview

### 1. Sub-Market Home Page (`SubMarketHome.tsx`)

**Sections Included:**
- ✅ Hero section with headline + CTA
- ✅ Search bar
- ✅ Features section (4 key features)
- ✅ Category grid/cards
- ✅ Featured products
- ✅ Statistics section
- ✅ Popular products
- ✅ Trust/CTA section

**Key Features:**
- Responsive design (mobile-first)
- Animated sections with Framer Motion
- Multi-tenant branding support
- SEO-friendly structure

### 2. Category Listing Page (`CategoryListing.tsx`)

**Features:**
- ✅ Category-specific product listing
- ✅ Advanced filters (price, category, rating, stock, sale)
- ✅ Search functionality
- ✅ Grid/List view toggle
- ✅ Product count display
- ✅ Responsive sidebar filters

**Filter Options:**
- Category selection
- Price range slider
- Minimum rating
- In stock only
- On sale filter

### 3. Product Details Page (`SubMarketProductDetail.tsx`)

**Fields Included:**
- ✅ Product title
- ✅ Product gallery with thumbnails
- ✅ Price with discount badge
- ✅ Product description
- ✅ What's included section
- ✅ Product type (digital)
- ✅ Variant selection (if available)
- ✅ Quantity selector
- ✅ Buy now button
- ✅ Add to cart button
- ✅ Reviews & ratings display
- ✅ Related products
- ✅ Tabs for: Description, Included, Reviews, Shipping

**Additional Features:**
- Image navigation
- Wishlist functionality
- Share button
- Trust badges

### 4. Buyer Dashboard (`BuyerDashboard.tsx`)

**Sections:**
- ✅ Purchased products list
- ✅ Download button for codes
- ✅ Order status tracking
- ✅ Invoice access
- ✅ User profile management
- ✅ Payment history
- ✅ Order history table

**Tabs:**
1. **My Products** - All purchased digital cards with download codes
2. **Orders** - Complete order history
3. **Profile** - User profile settings
4. **Payment History** - Transaction records

## 🧩 Components

### SubMarketProductCard
Enhanced product card with:
- Product image
- Product name
- Short description
- Price with discount
- Rating display
- Buy/View button
- Wishlist toggle
- Quick view option
- Grid and List view modes

### CategoryCard
Category display card with:
- Category image
- Category name
- Description
- Product count badge
- Hover effects

### SearchBar
Search functionality with:
- Real-time search
- Clear button
- Navigation support
- Custom placeholder

### ProductFilters
Advanced filtering system with:
- Category filters
- Price range slider
- Rating filters
- Stock status
- Sale filter
- Mobile-responsive sheet
- Active filter count

## 🎯 Multi-Tenant Support

### Theme Integration
All components use CSS variables for theming:
- `--theme-primary`
- `--theme-secondary`
- `--theme-background`
- `--theme-text`
- `--theme-muted-foreground`

### Tenant Branding
- Logo support via `StorefrontHeader`
- Custom colors per tenant
- Tenant-specific content

### Data Injection
- All API calls use `coreApi` which is tenant-aware
- Products, categories, and orders are filtered by tenant
- User data is tenant-scoped

## 📱 Responsive Design

- **Mobile-first** approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile filters in sheet/drawer
- Responsive grid layouts
- Touch-friendly buttons

## ♿ Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly
- Focus states on interactive elements

## 🔧 Usage Example

```tsx
import { SubMarketHome } from '@/pages/submarket';
import { SubMarketProductCard } from '@/components/submarket';

// In your router
<Route path="/" element={<SubMarketHome />} />
<Route path="/products/:id" element={<SubMarketProductDetail />} />
<Route path="/categories/:id" element={<CategoryListing />} />
<Route path="/dashboard" element={<BuyerDashboard />} />
```

## 🎨 Styling

Uses Tailwind CSS with:
- Custom theme variables
- Consistent spacing system
- Modern color palette
- Smooth transitions
- Hover effects
- Shadow system

## 📊 Data Flow

1. **Home Page**: Fetches featured products, categories, popular items
2. **Category Listing**: Filters products by category and search query
3. **Product Detail**: Loads single product with variants and related items
4. **Buyer Dashboard**: Loads user orders and purchased products

## 🚀 Performance

- Lazy loading for images
- Code splitting ready
- Optimized re-renders
- Memoized components where needed
- Efficient API calls

## 🔐 Security

- Authentication required for dashboard
- Tenant isolation
- Secure API calls
- Input validation

## 📝 Notes

- All components are TypeScript typed
- Error handling included
- Loading states implemented
- Toast notifications for user feedback
- Consistent error messages

## 🎯 Future Enhancements

- [ ] Product comparison feature
- [ ] Advanced search with filters
- [ ] Product reviews submission
- [ ] Wishlist persistence
- [ ] Recently viewed products
- [ ] Product recommendations
- [ ] Social sharing
- [ ] Print invoice option

