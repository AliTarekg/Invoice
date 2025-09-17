'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TransactionForm, Currency, CURRENCY_NAMES, CURRENCY_SYMBOLS, Supplier } from '../types';
import { addTransaction } from '../lib/transactions';
import { getActiveSuppliers } from '../lib/suppliers';
import { formatDateInput } from '../lib/utils';
import { Modal, Button, Input, Select } from './ui';
import { Plus, X, DollarSign, Calendar, User, FileText, Tag } from 'lucide-react';

const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Income',
  'Investment Returns',
  'Grants',
  'Other Income',
];

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Marketing',
  'Utilities',
  'Rent',
  'Equipment',
  'Software Subscriptions',
  'Travel',
  'Professional Services',
  'Insurance',
  'Other Expenses',
];

export default function AddTransaction() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<TransactionForm>({
    type: 'expense',
    amount: '',
    currency: user?.defaultCurrency || 'EGP',
    category: '',
    description: '',
    date: formatDateInput(new Date()),
    supplierId: '',
  });

  useEffect(() => {
    if (user && isOpen) {
      loadSuppliers();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, currency: user.defaultCurrency }));
    }
  }, [user]);

  const loadSuppliers = async () => {
    if (!user) return;

    try {
      const data = await getActiveSuppliers(); // No user ID - get all company suppliers
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !formData.description || !user) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await addTransaction(formData, user.id);
      setFormData({
        type: 'expense',
        amount: '',
        currency: user.defaultCurrency,
        category: '',
        description: '',
        date: formatDateInput(new Date()),
        supplierId: '',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const currencyOptions = Object.entries(CURRENCY_NAMES).map(([code]) => ({
    value: code,
    label: `${CURRENCY_SYMBOLS[code as Currency]} ${code}`
  }));

  const categoryOptions = categories.map(category => ({
    value: category,
    label: category
  }));

  const supplierOptions = suppliers.map(supplier => ({
    value: supplier.id,
    label: `${supplier.name} - ${supplier.category}`,
    icon: <User className="w-4 h-4" />
  }));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 z-50 group hover-lift"
      >
        <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute -top-12 right-0 bg-slate-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap animate-slide-in-up">
          إضافة معاملة
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="إضافة معاملة مالية"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* نوع المعاملة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              نوع المعاملة
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: 'income', category: '', supplierId: '' })
                }
                className={`p-4 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 border-2 flex items-center justify-center gap-2 ${
                  formData.type === 'income'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-lg hover-glow'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover-lift'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                إيراد
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: 'expense', category: '', supplierId: '' })
                }
                className={`p-4 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 border-2 flex items-center justify-center gap-2 ${
                  formData.type === 'expense'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-lg hover-glow'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover-lift'
                }`}
              >
                <FileText className="w-5 h-5" />
                مصروف
              </button>
            </div>
          </div>

          {/* المبلغ والعملة */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="المبلغ"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              icon={<DollarSign className="w-5 h-5" />}
            />

            <Select
              label="العملة"
              options={currencyOptions}
              value={formData.currency}
              onChange={(value) => setFormData({ ...formData, currency: value as Currency })}
            />
          </div>

          {/* التصنيف */}
          <Select
            label="التصنيف"
            placeholder="اختر تصنيفًا"
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            required
            searchable
          />

          {/* المورد (للمصروفات فقط) */}
          {formData.type === 'expense' && suppliers.length > 0 && (
            <Select
              label="المورد (اختياري)"
              placeholder="اختر موردًا"
              options={supplierOptions}
              value={formData.supplierId || ''}
              onChange={(value) => setFormData({ ...formData, supplierId: value })}
              searchable
            />
          )}

          {/* الوصف */}
          <Input
            label="الوصف"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="اكتب وصف المعاملة"
            required
            icon={<FileText className="w-5 h-5" />}
          />

          {/* التاريخ */}
          <Input
            label="التاريخ"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            icon={<Calendar className="w-5 h-5" />}
          />

          {/* أزرار التحكم */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="flex-1"
              icon={<Plus className="w-5 h-5" />}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة المعاملة'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
