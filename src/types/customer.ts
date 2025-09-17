export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  discount: number; // نسبة الخصم (0-100)
  createdAt: Date;
  lastPurchase?: Date;
  notes?: string;
}

export interface CustomerForm {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  discount: string; // نسبة الخصم كـ string للتعامل مع الحقول
  notes?: string;
}

export interface CustomerPurchase {
  id: string;
  customerId: string;
  saleId: string;
  amount: number;
  date: Date;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  pointsEarned: number;
  discountApplied: number;
}
