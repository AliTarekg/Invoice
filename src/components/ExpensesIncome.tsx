
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TransactionForm, Currency, CURRENCY_NAMES, CURRENCY_SYMBOLS, Supplier } from '../types';
import { addTransaction } from '../lib/transactions';
import { getActiveSuppliers } from '../lib/suppliers';
import { formatDateInput } from '../lib/utils';

const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Income',
  'Investment Returns',
  'Grants',
  'Other Income'
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
  'Other Expenses'
];

export default function ExpensesIncome() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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
    if (user) {
      setFormData(prev => ({ ...prev, currency: user.defaultCurrency }));
    }
  }, [user]);

  useEffect(() => {
    if (user && formData.type === 'expense') {
      loadSuppliers();
    }
  }, [user, formData.type]);

  const loadSuppliers = async () => {
    try {
      const data = await getActiveSuppliers();
      setSuppliers(data);
    } catch (error) {
      setSuppliers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.amount || !formData.category || !user) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsLoading(true);
    try {
      await addTransaction(formData, user.id);
      setSuccess('تم تسجيل العملية بنجاح');
      setFormData({
        type: 'expense',
        amount: '',
        currency: user.defaultCurrency,
        category: '',
        description: '',
        date: formatDateInput(new Date()),
        supplierId: '',
      });
    } catch (err) {
      setError('حدث خطأ أثناء التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 mt-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6">💰 تسجيل مصروف أو إيراد</h2>
      {error && <div className="text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">{error}</div>}
      {success && <div className="text-green-600 mb-4 bg-green-50 border border-green-200 rounded-lg p-3 font-medium">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* نوع العملية */}
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="radio" 
              checked={formData.type==='expense'} 
              onChange={()=>setFormData(f=>({...f, type:'expense', category:'', supplierId:''}))} 
              className="text-cyan-600 focus:ring-cyan-500 focus:ring-2 h-4 w-4"
            /> 
            <span className="text-slate-700 font-medium">مصروف</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="radio" 
              checked={formData.type==='income'} 
              onChange={()=>setFormData(f=>({...f, type:'income', category:'', supplierId:''}))} 
              className="text-cyan-600 focus:ring-cyan-500 focus:ring-2 h-4 w-4"
            /> 
            <span className="text-slate-700 font-medium">إيراد</span>
          </label>
        </div>
        {/* المبلغ والعملة */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold text-slate-700">المبلغ *</label>
            <input 
              type="number" 
              step="0.01" 
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50" 
              value={formData.amount} 
              onChange={e=>setFormData(f=>({...f, amount:e.target.value}))} 
              required 
              min={0} 
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-slate-700">العملة</label>
            <select 
              value={formData.currency} 
              onChange={e=>setFormData(f=>({...f, currency:e.target.value as Currency}))} 
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50"
            >
              {Object.entries(CURRENCY_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{CURRENCY_SYMBOLS[code as Currency]} {code}</option>
              ))}
            </select>
          </div>
        </div>
        {/* التصنيف */}
        <div>
          <label className="block mb-2 font-semibold text-slate-700">التصنيف *</label>
          <select 
            value={formData.category} 
            onChange={e=>setFormData(f=>({...f, category:e.target.value}))} 
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50" 
            required
          >
            <option value="">اختر تصنيفًا</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        {/* المورد (للمصروف فقط) */}
        {formData.type === 'expense' && suppliers.length > 0 && (
          <div>
            <label className="block mb-2 font-semibold text-slate-700">المورد (اختياري)</label>
            <select 
              value={formData.supplierId || ''} 
              onChange={e=>setFormData(f=>({...f, supplierId:e.target.value}))} 
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50"
            >
              <option value="">اختر موردًا</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name} - {s.category}</option>
              ))}
            </select>
          </div>
        )}
        {/* الوصف */}
        <div>
          <label className="block mb-2 font-semibold text-slate-700">الوصف</label>
          <input 
            type="text" 
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50" 
            value={formData.description} 
            onChange={e=>setFormData(f=>({...f, description:e.target.value}))} 
            placeholder="اكتب وصف العملية" 
          />
        </div>
        {/* التاريخ */}
        <div>
          <label className="block mb-2 font-semibold text-slate-700">التاريخ *</label>
          <input 
            type="date" 
            className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full transition-all duration-200 bg-white/50" 
            value={formData.date} 
            onChange={e=>setFormData(f=>({...f, date:e.target.value}))} 
            required 
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg w-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? 'جاري التسجيل...' : 'تسجيل'}
        </button>
      </form>
    </div>
  );
}
