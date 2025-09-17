// src/components/ProductsManagement.tsx
'use client';
import { useState, useEffect } from 'react';
import { Product } from '../types/product';
import { getProducts, deleteProduct } from '../lib/products';
import ProductForm from './ProductForm';
import ProductDetailsModal from './ProductDetailsModal';
import EditProductForm from './EditProductForm';
import { getSuppliers } from '../lib/suppliers';
import { Supplier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function ProductsManagement() {
  const { user } = useAuth();
  const { success, error: notifyError, info, warning } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      info('Loading Products', 'Fetching product catalog...');
      const data = await getProducts();
      setProducts(data);
      success('Products Loaded', `Successfully loaded ${data.length} products`);
      
      // Check for low stock items (assuming we have quantity or similar field)
      const lowStockItems = data.filter(product => (product as any).quantity && (product as any).quantity <= 5);
      if (lowStockItems.length > 0) {
        warning('Low Stock Alert', `${lowStockItems.length} products have low stock (≤5 units)`, {
          persistent: true,
          action: {
            label: 'View Items',
            onClick: () => {
              info('Low Stock Items', lowStockItems.map(p => `${p.name}: ${(p as any).quantity || 0} units`).join('\n'));
            }
          }
        });
      }
    } catch (error) {
      notifyError('Loading Failed', 'Failed to load products. Please try again.', {
        action: {
          label: 'Retry',
          onClick: loadProducts
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    getSuppliers().then(setSuppliers);
  }, []);

  const handleDelete = async (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    const result = window.confirm(`هل أنت متأكد من حذف المنتج "${productToDelete?.name}"؟`);
    if (!result) return;
    
    try {
      info('Deleting Product', `Removing "${productToDelete?.name}" from catalog...`);
      await deleteProduct(id);
      success('Product Deleted', `"${productToDelete?.name}" has been removed successfully`);
      loadProducts();
    } catch (error) {
      notifyError('Delete Failed', `Failed to delete "${productToDelete?.name}". Please try again.`, {
        action: {
          label: 'Try Again',
          onClick: () => handleDelete(id)
        }
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-blue-700">إدارة المنتجات</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow" onClick={() => setShowForm(true)}>
          <span className="mr-2">إضافة منتج جديد</span>
          <svg width="20" height="20" fill="none" stroke="currentColor"><path d="M12 4v12m6-6H6" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      {showForm && (
        <div className="mb-8">
          <ProductForm onProductAdded={() => { setShowForm(false); loadProducts(); }} />
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا توجد منتجات مسجلة</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black">
              <tr>
                <th className="p-2">اسم المنتج</th>
                <th className="p-2">الباركود</th>
                <th className="p-2">سعر الشراء</th>
                <th className="p-2">سعر البيع</th>
                <th className="p-2">أقل كمية</th>
                <th className="p-2">الموردون</th>
                <th className="p-2">خيارات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b hover:bg-blue-50 transition cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <td className="p-2 font-semibold text-gray-900">{product.name}</td>
                  <td className="p-2 font-mono text-xs text-gray-900">{product.barcode}</td>
                  <td className="p-2 text-gray-900">{product.purchasePrice}</td>
                  <td className="p-2 text-gray-900">{product.salePrice}</td>
                  <td className="p-2 text-gray-900">{product.minSaleQuantity}</td>
                  <td className="p-2 text-gray-900">
                    {product.supplierIds.map(sid => {
                      const supplier = suppliers.find(s => s.id === sid);
                      return supplier ? <span key={sid} className="bg-blue-50 text-blue-700 px-2 py-1 rounded mr-1">{supplier.name}</span> : null;
                    })}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
                      title="طباعة باركود"
                      onClick={e => { e.stopPropagation(); window.open(`/api/print-barcode?code=${product.barcode}&name=${encodeURIComponent(product.name)}`, '_blank'); }}
                    >طباعة</button>
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded" onClick={e => { e.stopPropagation(); setEditProduct(product); }}>تعديل</button>
                    {(user && user.role === 'admin') && (
                      <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded" onClick={e => { e.stopPropagation(); handleDelete(product.id); }}>حذف</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          suppliers={suppliers}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => { setEditProduct(selectedProduct); setSelectedProduct(null); }}
        />
      )}
      {editProduct && (
        <EditProductForm
          product={editProduct}
          onProductUpdated={() => { setEditProduct(null); loadProducts(); }}
          onCancel={() => setEditProduct(null)}
        />
      )}
    </div>
  );
}
