import { Product } from './product';

export interface SaleProduct {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string; // رقم الفاتورة التسلسلي
  customerName: string;
  customerPhone: string;
  products: SaleProduct[];
  date: string;
  total: number;
  tax?: number;
  discount?: number;
  paymentType?: 'cash' | 'card';
  shiftId?: string;
  userId?: string;
  customerId?: string;
  isReturned?: boolean;
  returnId?: string;
  returnDate?: string;
}
