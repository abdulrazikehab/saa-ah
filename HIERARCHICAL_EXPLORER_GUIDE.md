# دليل استخدام المستكشف الهرمي وإدارة الأسواق
# Hierarchical Explorer & Market Management Guide

## 📦 الجزء الأول: استخدام المستكشف الهرمي لإضافة المنتجات
## Part 1: Using the Hierarchical Explorer to Add Products

### ما هو المستكشف الهرمي؟
### What is the Hierarchical Explorer?

المستكشف الهرمي هو أداة تسمح لك بالتنقل عبر هيكل منظم لإضافة المنتجات:
The Hierarchical Explorer is a tool that allows you to navigate through an organized structure to add products:

**المسار: العلامة التجارية → الفئة → الفئة الفرعية → ... → المنتج**
**Path: Brand → Category → Subcategory → ... → Product**

### خطوات الاستخدام:
### How to Use:

#### 1. فتح نموذج إضافة منتج
#### 1. Open Add Product Form

- اذهب إلى **لوحة التحكم** → **المنتجات** → **إضافة منتج**
- Go to **Dashboard** → **Products** → **Add Product**

#### 2. تفعيل المستكشف الهرمي
#### 2. Enable Hierarchical Explorer

- المستكشف الهرمي مفعّل افتراضياً (يمكنك إيقافه باستخدام المفتاح)
- The Hierarchical Explorer is enabled by default (you can disable it using the toggle)

#### 3. اختيار العلامة التجارية (اختياري)
#### 3. Select Brand (Optional)

- اختر علامة تجارية من القائمة المنسدلة
- Select a brand from the dropdown
- أو اتركه فارغاً للانتقال مباشرة للفئات
- Or leave it empty to go directly to categories

#### 4. التنقل عبر الفئات
#### 4. Navigate Through Categories

**في شاشة الفئات:**
**In Categories View:**

- **انقر على فئة** للانتقال إلى الفئات الفرعية
- **Click on a category** to navigate to subcategories
- **انقر على "إضافة فئة"** لإنشاء فئة جديدة
- **Click "Add Category"** to create a new category

**في شاشة الفئات الفرعية:**
**In Subcategories View:**

- **انقر على فئة فرعية** للانتقال إلى فئات فرعية أعمق
- **Click on a subcategory** to navigate to deeper subcategories
- **انقر على "إضافة فئة فرعية"** لإنشاء فئة فرعية جديدة تحت الفئة الحالية
- **Click "Add Subcategory"** to create a new subcategory under the current category
- **انقر على "عرض المنتجات"** إذا لم تكن هناك فئات فرعية
- **Click "View Products"** if there are no subcategories

#### 5. إضافة فئة جديدة
#### 5. Add New Category

عند النقر على "إضافة فئة" أو "إضافة فئة فرعية":
When clicking "Add Category" or "Add Subcategory":

1. **اسم الفئة (English)** - مطلوب
   - **Category Name (English)** - Required
2. **اسم الفئة (العربية)** - اختياري
   - **Category Name (Arabic)** - Optional
3. **الوصف** - اختياري
   - **Description** - Optional

- سيتم إنشاء الفئة تلقائياً تحت الفئة الحالية (إذا كنت في شاشة الفئات الفرعية)
- The category will be automatically created under the current category (if you're in subcategories view)

#### 6. عرض المنتجات
#### 6. View Products

- عند الوصول إلى فئة بدون فئات فرعية، سيتم عرض المنتجات تلقائياً
- When reaching a category without subcategories, products will be displayed automatically
- يمكنك النقر على منتج لإضافته (إذا كان هناك معالج)
- You can click on a product to add it (if there's a handler)

#### 7. اختيار الفئات
#### 7. Select Categories

- عند النقر على فئة (بدون فئات فرعية)، يتم إضافتها تلقائياً إلى قائمة الفئات المحددة
- When clicking on a category (without subcategories), it's automatically added to the selected categories list
- تظهر الفئات المحددة كشارات (Badges) في أعلى النموذج
- Selected categories appear as badges at the top of the form
- يمكنك إزالة فئة بالنقر على X في الشارة
- You can remove a category by clicking X on the badge

#### 8. التنقل
#### 8. Navigation

- **الخبز (Breadcrumbs)**: انقر على أي عنصر في المسار للعودة إليه
- **Breadcrumbs**: Click on any item in the path to return to it
- **زر الرجوع**: للعودة للشاشة السابقة
- **Back Button**: To return to the previous screen

---

## 🏪 الجزء الثاني: إضافة وإدارة الأسواق المتعددة
## Part 2: Adding and Managing Multiple Markets

### ما هو السوق (Market)؟
### What is a Market?

السوق (أو المتجر) هو متجر إلكتروني مستقل ببياناته الخاصة:
A Market (or Store) is an independent e-commerce store with its own data:

- منتجات خاصة
- Own products
- فئات خاصة
- Own categories
- طلبات خاصة
- Own orders
- عملاء خاصون
- Own customers
- إعدادات خاصة
- Own settings

### كيفية إضافة سوق جديد:
### How to Add a New Market:

#### الطريقة 1: من لوحة التحكم
#### Method 1: From Dashboard

1. **انقر على زر تبديل المتجر** في أعلى الشاشة (أيقونة المتجر)
   - **Click the Store Switcher button** at the top of the screen (Store icon)
2. **انقر على "إنشاء متجر جديد"**
   - **Click "Create New Store"**
3. **اتبع الخطوات:**
   - **Follow the steps:**

   **الخطوة 1: معلومات المتجر**
   **Step 1: Store Information**
   - اسم المتجر (مطلوب)
     - Store Name (Required)
   - وصف المتجر (اختياري)
     - Store Description (Optional)

   **الخطوة 2: النطاق (Domain)**
   **Step 2: Domain**
   - النطاق الفرعي (Subdomain) - مطلوب
     - Subdomain (Required)
     - مثال: `mystore` → `mystore.saeaa.com`
     - Example: `mystore` → `mystore.saeaa.com`
   - النطاق المخصص (اختياري) - يمكن إضافته لاحقاً
     - Custom Domain (Optional) - Can be added later

   **الخطوة 3: القالب (Template)**
   **Step 3: Template**
   - اختر قالب للمتجر
     - Choose a template for the store
   - يمكن تغييره لاحقاً
     - Can be changed later

4. **انقر على "إنشاء المتجر"**
   - **Click "Create Store"**

#### الطريقة 2: من رابط مباشر
#### Method 2: From Direct Link

- اذهب إلى: `/dashboard/market-setup` أو `/setup`
- Go to: `/dashboard/market-setup` or `/setup`

### إدارة الأسواق المتعددة:
### Managing Multiple Markets:

#### 1. التبديل بين الأسواق
#### 1. Switching Between Markets

1. **انقر على زر تبديل المتجر** في أعلى الشاشة
   - **Click the Store Switcher button** at the top of the screen
2. **اختر المتجر** من القائمة
   - **Select the Store** from the list
3. سيتم تحميل البيانات الخاصة بذلك المتجر
   - The data for that store will be loaded

#### 2. عرض جميع الأسواق
#### 2. View All Markets

- في قائمة تبديل المتجر، يمكنك رؤية:
  - In the store switcher list, you can see:
  - جميع المتاجر المرتبطة بحسابك
    - All stores linked to your account
  - المتجر النشط الحالي (مميز بعلامة ✓)
    - Current active store (marked with ✓)
  - عدد المتاجر المتاحة
    - Number of available stores

#### 3. حدود الأسواق
#### 3. Market Limits

- كل مستخدم لديه حد أقصى لعدد الأسواق
- Each user has a maximum limit for number of markets
- الحد الافتراضي: 1 سوق (يمكن زيادته حسب الخطة)
- Default limit: 1 market (can be increased based on plan)
- إذا وصلت للحد الأقصى، لن تتمكن من إنشاء أسواق جديدة
- If you reach the maximum limit, you won't be able to create new markets

#### 4. حذف أو إدارة السوق
#### 4. Delete or Manage Market

- حالياً، يمكنك إدارة كل سوق من لوحة التحكم الخاصة به
- Currently, you can manage each market from its own dashboard
- البيانات منفصلة تماماً بين الأسواق
- Data is completely separate between markets

---

## 💡 نصائح مهمة:
## Important Tips:

### للمستكشف الهرمي:
### For Hierarchical Explorer:

1. **استخدم الفئات الفرعية** لتنظيم أفضل
   - **Use subcategories** for better organization
2. **أنشئ الفئات أثناء التنقل** بدلاً من الخروج وإنشائها يدوياً
   - **Create categories while navigating** instead of exiting and creating them manually
3. **استخدم الخبز (Breadcrumbs)** للتنقل السريع
   - **Use Breadcrumbs** for quick navigation
4. **العلامة التجارية اختيارية** - يمكنك البدء مباشرة بالفئات
   - **Brand is optional** - You can start directly with categories

### للأسواق المتعددة:
### For Multiple Markets:

1. **استخدم أسماء واضحة** للمتاجر لتسهيل التمييز
   - **Use clear names** for stores to make them easy to distinguish
2. **استخدم نطاقات فرعية مميزة** لكل متجر
   - **Use distinct subdomains** for each store
3. **البيانات منفصلة** - المنتجات والفئات والطلبات منفصلة لكل متجر
   - **Data is separate** - Products, categories, and orders are separate for each store
4. **التبديل السريع** - استخدم زر تبديل المتجر للتنقل بسرعة
   - **Quick Switching** - Use the store switcher button to navigate quickly

---

## 🔧 استكشاف الأخطاء:
## Troubleshooting:

### المستكشف الهرمي لا يظهر:
### Hierarchical Explorer not showing:

- تأكد من تفعيل المفتاح "استخدام المستكشف الهرمي"
- Make sure the "Use Hierarchical Explorer" toggle is enabled
- تأكد من وجود فئات في النظام
- Make sure there are categories in the system

### لا يمكن إنشاء فئة جديدة:
### Cannot create new category:

- تأكد من إدخال اسم الفئة (English)
- Make sure you entered the category name (English)
- تحقق من اتصال الإنترنت
- Check internet connection
- تأكد من الصلاحيات
- Check permissions

### لا يمكن إنشاء سوق جديد:
### Cannot create new market:

- تحقق من الحد الأقصى لعدد الأسواق
- Check the maximum limit for number of markets
- تأكد من أن النطاق الفرعي غير مستخدم
- Make sure the subdomain is not already used
- النطاق الفرعي يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط
- Subdomain must contain only lowercase letters, numbers, and hyphens

---

## 📞 الدعم:
## Support:

إذا واجهت أي مشاكل، تحقق من:
If you encounter any issues, check:

1. **سجلات المتصفح (Console)** للأخطاء
   - **Browser Console** for errors
2. **شبكة الاتصال**
   - **Network Connection**
3. **الصلاحيات** - تأكد من أن لديك صلاحيات كافية
   - **Permissions** - Make sure you have sufficient permissions

---

**آخر تحديث: ديسمبر 2025**
**Last Updated: December 2025**

