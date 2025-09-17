export type Currency = 'USD' | 'EGP' | 'AED';

export type UserRole = 'admin' | 'cashier' | 'stock' | 'viewer';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  defaultCurrency: Currency;
  createdAt: Date;
  role: UserRole;
}

// إعادة تصدير أنواع العملاء
export * from './customer';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  userId: string;
  supplierId?: string;
  recurring?: RecurringTransaction;
}
// Multi-currency support
export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: Date;
}

// Budgets
export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: Currency;
  period: 'monthly' | 'annual';
  alertThreshold?: number; // percentage
}

// Recurring transactions
export interface RecurringTransaction {
  frequency: 'daily' | 'weekly' | 'monthly' | 'annual';
  nextDate: Date;
  endDate?: Date;
}

// Audit log
export interface AuditLog {
  id: string;
  action: 'add' | 'edit' | 'delete';
  entity: 'transaction' | 'supplier' | 'user';
  entityId: string;
  userId: string;
  timestamp: Date;
  details?: string;
}

export interface TransactionForm {
  type: 'income' | 'expense';
  amount: string;
  currency: Currency;
  category: string;
  description: string;
  date: string;
  supplierId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category: string;
  products: string[];
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  userId: string;
}

export interface SupplierForm {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category: string;
  products: string[];
  notes?: string;
  isActive: boolean;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  currency: Currency;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  currency: Currency;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  currency: Currency;
}

export interface CurrencyRates {
  USD: number;
  EGP: number;
  AED: number;
}

export const SUPPLIER_CATEGORIES = [
  'Office Supplies',
  'Technology',
  'Food & Beverage',
  'Marketing Materials',
  'Professional Services',
  'Equipment',
  'Raw Materials',
  'Packaging',
  'Transportation',
  'Utilities',
  'Other'
] as const;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EGP: 'ج.م',
  AED: 'د.إ'
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  EGP: 'Egyptian Pound',
  AED: 'UAE Dirham'
};


// Quotation types
export interface QuotationProduct {
  name: string;
  quantity: number;
  price: number;
}

export interface Quotation {
  id?: string;
  company: string;
  products: QuotationProduct[];
  taxRate: number; // معدل الضريبة بالنسبة المئوية
  paymentTerms: string; // شروط الدفع
  deliveryDate: string; // موعد التسليم
  createdAt: Date;
  userId: string;
}
