// src/types/stock.ts
export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out'; // 'in' for purchase, 'out' for sale
  quantity: number;
  date: string;
  note?: string;
  reason?: string; // سبب الحركة (مبيعات، مشتريات، مرتجع، تسوية، إلخ)
}
