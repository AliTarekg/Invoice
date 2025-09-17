// src/components/ProductForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { Supplier } from '../types';
import { addProduct } from '../lib/products';
import { getSuppliers } from '../lib/suppliers';

interface ProductFormProps {
  onProductAdded?: () => void;
}

export default function ProductForm({ onProductAdded }: ProductFormProps) {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [minSaleQuantity, setMinSaleQuantity] = useState('');
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSuppliers() {
      setLoading(true);
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (err) {
        setError('فشل تحميل الموردين');
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !purchasePrice || !salePrice || !minSaleQuantity || supplierIds.length === 0) {
      setError('يرجى ملء جميع الحقول واختيار مورد واحد على الأقل');
      return;
    }
    // توليد باركود تلقائي (مثلاً رقم عشوائي فريد)
    const generatedBarcode = 'B' + Date.now() + Math.floor(Math.random() * 1000);
    try {
      await addProduct({
        name,
        barcode: generatedBarcode,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        minSaleQuantity: Number(minSaleQuantity),
        supplierIds,
      });
      setName('');
      setPurchasePrice('');
      setSalePrice('');
      setMinSaleQuantity('');
      setSupplierIds([]);
      if (onProductAdded) onProductAdded();
    } catch (err) {
      setError('فشل إضافة المنتج');
    }
  };

  return (
    <form className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 text-blue-700">إضافة منتج جديد</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">اسم المنتج</label>
        <input type="text" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      {/* الباركود يتم توليده تلقائياً */}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">سعر الشراء</label>
        <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">سعر البيع</label>
        <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={salePrice} onChange={e => setSalePrice(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">أقل كمية للبيع</label>
        <input type="number" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 placeholder-slate-500 bg-white transition-all duration-200" value={minSaleQuantity} onChange={e => setMinSaleQuantity(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label className="block mb-1 font-medium text-slate-700">الموردون</label>
        <select
          multiple
          className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 w-full text-slate-800 bg-white transition-all duration-200"
          value={supplierIds}
          onChange={e => setSupplierIds(Array.from(e.target.selectedOptions, option => option.value))}
          required
        >
          {loading ? (
            <option>جاري التحميل...</option>
          ) : suppliers.length === 0 ? (
            <option disabled>لا يوجد موردون</option>
          ) : suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow mt-4">إضافة المنتج</button>
    </form>
  );
}
