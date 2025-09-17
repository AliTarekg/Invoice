import { useState } from 'react';
import { addStockMovement } from '../lib/stock';
import { getProducts } from '../lib/products';
import { Product } from '../types/product';

export default function UpdateStockForm({ onStockUpdated }: { onStockUpdated?: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load products on mount
  useState(() => {
    getProducts().then(setProducts);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addStockMovement({
        productId,
        type,
        quantity,
        date: new Date().toISOString(),
        note,
      });
      setSuccess('تم تحديث المخزون بنجاح');
      setProductId('');
      setQuantity(1);
      setNote('');
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      setError('حدث خطأ أثناء تحديث المخزون');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 space-y-4 max-w-lg mx-auto animate-fadeIn">
      <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
        <svg width="20" height="20" fill="none" stroke="currentColor" className="text-blue-400"><rect x="3" y="3" width="14" height="14" rx="3" strokeWidth="2" /></svg>
        تحديث المخزون
      </h3>
      <div>
        <label className="block font-medium mb-1 text-purple-700">المنتج</label>
        <select value={productId} onChange={e => setProductId(e.target.value)} className="border rounded-lg px-3 py-2 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-200 text-gray-900" required>
          <option value="">اختر المنتج</option>
          {products.map((p: Product) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block font-medium mb-1 text-purple-700">النوع</label>
          <select value={type} onChange={e => setType(e.target.value as 'in' | 'out')} className="border rounded-lg px-3 py-2 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-200 text-gray-900">
            <option value="in">إضافة للمخزون</option>
            <option value="out">صرف من المخزون</option>
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block font-medium mb-1 text-purple-700">الكمية</label>
          <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200 text-gray-900" required />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1 text-purple-700">ملاحظة</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200 text-gray-900" placeholder="اكتب ملاحظة (اختياري)" />
      </div>
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg w-full shadow transition" disabled={loading}>
        {loading ? 'جاري التحديث...' : 'تحديث المخزون'}
      </button>
      {success && <div className="text-green-600 font-medium mt-2 text-center animate-fadeIn">{success}</div>}
      {error && <div className="text-red-600 font-medium mt-2 text-center animate-fadeIn">{error}</div>}

    </form>
  );
}
