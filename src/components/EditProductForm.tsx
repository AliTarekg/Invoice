// src/components/EditProductForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { Supplier } from '../types';
import { updateProduct } from '../lib/products';
import { getSuppliers } from '../lib/suppliers';

// ...existing code...
// (Assume all imports and state logic are above)

interface EditProductFormProps {
  product: Product;
  onProductUpdated: () => void;
  onCancel: () => void;
}

export default function EditProductForm({ product, onProductUpdated, onCancel }: EditProductFormProps) {
  const [name, setName] = useState(product.name);
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice);
  const [salePrice, setSalePrice] = useState(product.salePrice);
  const [minSaleQuantity, setMinSaleQuantity] = useState(product.minSaleQuantity);
  const [supplierIds, setSupplierIds] = useState<string[]>(product.supplierIds || []);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateProduct(product.id, {
        ...product,
        name,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        minSaleQuantity: Number(minSaleQuantity),
        supplierIds,
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      setError('فشل تعديل المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white rounded-2xl shadow-xl p-6 max-w-lg mx-auto animate-fadeIn" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6 text-blue-800 flex items-center gap-2">
        <svg width="22" height="22" fill="none" stroke="currentColor" className="text-blue-400"><rect x="3" y="3" width="16" height="16" rx="3" strokeWidth="2" /><path d="M7 7h8M7 11h8M7 15h4" strokeWidth="2" /></svg>
        تعديل المنتج
      </h2>
      {error && <div className="text-red-600 mb-2 text-center animate-fadeIn">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">اسم المنتج</label>
          <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">سعر الشراء</label>
          <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={purchasePrice} onChange={e => setPurchasePrice(Number(e.target.value))} required />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">سعر البيع</label>
          <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={salePrice} onChange={e => setSalePrice(Number(e.target.value))} required />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">أقل كمية للبيع</label>
          <input type="number" className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200" value={minSaleQuantity} onChange={e => setMinSaleQuantity(Number(e.target.value))} required />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 font-medium text-gray-700">الموردون</label>
          <select
            multiple
            className="border rounded-lg px-3 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200 bg-white"
            value={supplierIds}
            onChange={e => setSupplierIds(Array.from(e.target.selectedOptions, option => option.value))}
            required
          >
            {loading ? (
              <option>جاري التحميل...</option>
            ) : suppliers.length === 0 ? (
              <option disabled>لا يوجد موردون</option>
            ) : suppliers.map((supplier: Supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-6 justify-center">
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition" disabled={loading}>حفظ التعديلات</button>
        <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-5 py-2 rounded-lg shadow transition" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  );
}
