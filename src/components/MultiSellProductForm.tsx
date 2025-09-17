import { addTransaction } from '../lib/transactions';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { getProducts } from '../lib/products';
import { getProductStock, addStockMovement } from '../lib/stock';
import { addCustomer, findCustomerByPhone } from '../lib/customers';
import { generateMultiSaleInvoice } from '../lib/saleInvoiceMulti';
import { generateReceiptPDF } from '../lib/saleReceipt';
import { SaleProduct } from '../types/sale';
import { useAuth } from '../contexts/AuthContext';
import { generateInvoiceNumber } from '../lib/pos';

export default function MultiSellProductForm({ onSold }: { onSold?: () => void }) {
  const [lastSale, setLastSale] = useState<{ name: string; phone: string; products: SaleProduct[]; date: string; total: number; invoiceNumber?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<SaleProduct[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const handleAddProduct = () => {
    setSelected([...selected, { productId: '', name: '', quantity: 1, price: 0, note: '' }]);
  };

  const handleProductChange = (idx: number, field: keyof SaleProduct, value: any) => {
    setSelected(sel => sel.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleRemove = (idx: number) => {
    setSelected(sel => sel.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }
    if (selected.length === 0) {
      setError('يرجى إضافة منتج واحد على الأقل');
      return;
    }
    // Validate all products
    for (const item of selected) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        setError('يرجى اختيار المنتجات والكميات بشكل صحيح');
        return;
      }
      const stock = await getProductStock(item.productId);
      if (item.quantity > stock) {
        setError(`الكمية المطلوبة للمنتج "${item.name}" غير متوفرة في المخزون (المتوفر: ${stock})`);
        return;
      }
    }
    setLoading(true);
    try {
      let customer = await findCustomerByPhone(customerPhone);
      if (!customer) {
        customer = await addCustomer({
          name: customerName,
          phone: customerPhone,
          email: '',
          address: '',
          discount: '0',
          notes: '',
        });
      }
      // Deduct stock
      for (const item of selected) {
        await addStockMovement({
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          date: new Date().toISOString(),
          note: item.note,
        });
      }
      // Record sale in sales collection
      const saleTotal = selected.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const { addSale } = await import('../lib/sale');
      const now = new Date().toISOString();
      
      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber();
      
      await addSale({
        invoiceNumber,
        customerName,
        customerPhone,
        products: selected,
        date: now,
        total: saleTotal,
      });
      // سجل معاملة مالية مرتبطة بالبيع
      await addTransaction({
        type: 'income',
        amount: String(saleTotal),
        currency: 'EGP',
        category: 'مبيعات',
        description: `بيع للعميل: ${customerName} (${customerPhone}) - فاتورة #${invoiceNumber}`,
        date: now,
      }, 'system');
      await Promise.all([
        generateMultiSaleInvoice({
          customerName,
          customerPhone,
          products: selected,
          date: now,
          currency: 'EGP',
        }),
        generateReceiptPDF({
          customerName,
          customerPhone,
          products: selected,
          date: now,
          currency: 'EGP',
          total: saleTotal,
        })
      ]);
      setLastSale({ name: customerName, phone: customerPhone, products: selected, date: now, total: saleTotal, invoiceNumber });
      setSuccess(`تم تسجيل عملية البيع بنجاح وتم إصدار الفاتورة رقم #${invoiceNumber}`);
      setSelected([]);
      setCustomerName('');
      setCustomerPhone('');
      setNote('');
      if (onSold) onSold();
    } catch (err) {
      setError('حدث خطأ أثناء البيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto animate-fadeIn" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-blue-800 flex items-center gap-2">
        <svg width="22" height="22" fill="none" stroke="currentColor" className="text-blue-400"><rect x="3" y="3" width="16" height="16" rx="3" strokeWidth="2" /><path d="M7 7h8M7 11h8M7 15h4" strokeWidth="2" /></svg>
        بيع منتجات متعددة
      </h2>
      {error && <div className="text-red-600 mb-2 text-center animate-fadeIn">{error}</div>}
      {success && <div className="text-green-600 mb-2 text-center animate-fadeIn">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">اسم العميل</label>
          <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">رقم هاتف العميل</label>
          <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition" onClick={handleAddProduct}>إضافة منتج</button>
      </div>
      {selected.map((item, idx) => (
        <div key={idx} className="mb-4 border rounded-xl p-3 flex flex-wrap gap-3 items-end bg-gray-50 shadow-sm animate-fadeIn">
          <div className="flex-1 min-w-[180px]">
            <label className="block mb-1 font-medium text-gray-700">المنتج</label>
            <select className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200" value={item.productId} onChange={e => {
              const prod = products.find(p => p.id === e.target.value);
              handleProductChange(idx, 'productId', e.target.value);
              handleProductChange(idx, 'name', prod?.name || '');
              handleProductChange(idx, 'price', prod?.salePrice || 0);
            }} required>
              <option value="">اختر المنتج</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block mb-1 font-medium text-gray-700">الكمية</label>
            <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={item.quantity} min={1} onChange={e => handleProductChange(idx, 'quantity', Number(e.target.value))} required />
          </div>
          <div className="w-40">
            <label className="block mb-1 font-medium text-gray-700">ملاحظة (اختياري)</label>
            <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={item.note || ''} onChange={e => handleProductChange(idx, 'note', e.target.value)} />
          </div>
          {(user && user.role === 'admin') && (
            <button type="button" className="text-red-600 font-bold ml-2 hover:underline" onClick={() => handleRemove(idx)}>حذف</button>
          )}
        </div>
      ))}
      <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow mt-4 w-full transition" disabled={loading}>{loading ? 'جاري البيع...' : 'تسجيل البيع وإصدار الفاتورة'}</button>
    </form>
  );
}
