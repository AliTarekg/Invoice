// src/components/SellProductForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { addStockMovement } from '../lib/stock';
import { getProducts } from '../lib/products';
import { generateSaleInvoice } from '../lib/saleInvoice';
import { addCustomer, findCustomerByPhone } from '../lib/customers';

interface SellProductFormProps {
  onSold?: () => void;
}

export default function SellProductForm({ onSold }: SellProductFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await getProducts();
        setProducts(data);
      } catch {
        setError('فشل تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!productId || !quantity || Number(quantity) <= 0) {
      setError('يرجى اختيار المنتج وكمية صحيحة');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('يرجى إدخال اسم العميل ورقم الهاتف');
      return;
    }
    try {
      // Save customer if not exists
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
      await addStockMovement({
        productId,
        type: 'out',
        quantity: Number(quantity),
        date: new Date().toISOString(),
        note,
      });
      // Generate invoice PDF
      const soldProduct = products.find(p => p.id === productId);
      if (soldProduct) {
        generateSaleInvoice({
          product: soldProduct,
          quantity: Number(quantity),
          date: new Date().toISOString(),
          note,
          price: soldProduct.salePrice,
          currency: 'EGP',
          customer: customerName,
        });
      }
      setSuccess('تم تسجيل عملية البيع بنجاح وتم إصدار الفاتورة');
      setProductId('');
      setQuantity('');
      setNote('');
      setCustomerName('');
      setCustomerPhone('');
      if (onSold) onSold();
    } catch {
      setError('فشل تسجيل البيع');
    }
  };

  return (
    <form className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 text-blue-700">بيع منتج</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">اسم العميل</label>
        <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">رقم هاتف العميل</label>
        <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">المنتج</label>
        <select className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200" value={productId} onChange={e => setProductId(e.target.value)} required>
          <option value="">اختر المنتج</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">الكمية</label>
        <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">ملاحظة (اختياري)</label>
        <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 mt-4">تسجيل البيع</button>
    </form>
  );
}
