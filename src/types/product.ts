// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  minSaleQuantity: number;
  supplierIds: string[]; // Array of supplier IDs
  categoryId?: string; // معرف التصنيف
  categoryName?: string; // اسم التصنيف (للعرض)
  categoryColor?: string; // لون التصنيف (للعرض)
  categoryIcon?: string; // أيقونة التصنيف (للعرض)
}
