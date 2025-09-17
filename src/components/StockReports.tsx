'use client';

import { useEffect, useState } from 'react';
import UpdateStockForm from './UpdateStockForm';
import { getStockMovements, getProductStock } from '../lib/stock';
import { getProducts } from '../lib/products';
import { formatCurrency } from '../lib/utils';
import { StockMovement } from '../types/stock';
import { Product } from '../types/product';
import { Modal, Button, Input, Select } from './ui';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3, 
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Plus,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  Box
} from 'lucide-react';


export default function StockReports() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [stock, setStock] = useState<number | null>(null);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'overview' | 'movements' | 'alerts'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      getProductStock(selectedProduct).then(setStock);
    } else {
      setStock(null);
    }
  }, [selectedProduct]);

  async function fetchData() {
    setLoading(true);
    try {
      const [allMovements, allProducts] = await Promise.all([
        getStockMovements(),
        getProducts(),
      ]);
      setMovements(allMovements);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  // تصفية المنتجات حسب البحث
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // تصفية الحركات حسب الفلاتر
  const getFilteredMovements = () => {
    let filtered = movements;

    // فلترة حسب المنتج المختار
    if (selectedProduct) {
      filtered = filtered.filter(m => m.productId === selectedProduct);
    }

    // فلترة حسب نوع الحركة
    if (movementTypeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === movementTypeFilter);
    }

    // فلترة حسب التاريخ
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(m => new Date(m.date) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(m => new Date(m.date) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(m => new Date(m.date) >= filterDate);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(m => new Date(m.date) >= filterDate);
          break;
      }
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredMovements = getFilteredMovements();

  // حساب الإحصائيات
  const calculateStats = () => {
    const totalIn = filteredMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = filteredMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0);
    const netChange = totalIn - totalOut;

    // المنتجات منخفضة المخزون (أقل من 10)
    const lowStockProducts = products.filter(product => {
      const productMovements = movements.filter(m => m.productId === product.id);
      const currentStock = productMovements.reduce((total, m) => 
        total + (m.type === 'in' ? m.quantity : -m.quantity), 0
      );
      return currentStock < 10;
    });

    // أكثر المنتجات حركة
    const productActivity = products.map(product => {
      const productMovements = movements.filter(m => m.productId === product.id);
      const totalActivity = productMovements.reduce((sum, m) => sum + m.quantity, 0);
      return { product, activity: totalActivity };
    }).sort((a, b) => b.activity - a.activity);

    return {
      totalIn,
      totalOut,
      netChange,
      lowStockProducts,
      mostActiveProducts: productActivity.slice(0, 5),
      totalProducts: products.length,
      totalMovements: movements.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">جاري تحميل تقارير المخزون...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* إجمالي المنتجات */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">إجمالي المنتجات</h3>
            <p className="text-3xl font-bold">{stats.totalProducts}</p>
          </div>
          <Package className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* إجمالي الحركات */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">إجمالي الحركات</h3>
            <p className="text-3xl font-bold">{stats.totalMovements}</p>
          </div>
          <RefreshCw className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* الكمية المضافة */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">إجمالي الإضافات</h3>
            <p className="text-3xl font-bold">+{stats.totalIn}</p>
          </div>
          <ArrowUpCircle className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* الكمية المنصرفة */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">إجمالي الصرف</h3>
            <p className="text-3xl font-bold">-{stats.totalOut}</p>
          </div>
          <ArrowDownCircle className="w-12 h-12 opacity-80" />
        </div>
      </div>
    </div>
  );

  const renderMovements = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-600" />
          سجل حركات المخزون
        </h3>
        <span className="text-sm text-gray-500">
          {filteredMovements.length} حركة
        </span>
      </div>

      <div className="overflow-x-auto text-center">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="text-center p-3 font-semibold">المنتج</th>
              <th className="text-center p-3 font-semibold">النوع</th>
              <th className="text-center p-3 font-semibold">الكمية</th>
              <th className="text-center p-3 font-semibold">السبب</th>
              <th className="text-center p-3 font-semibold">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.map((movement, index) => {
              const product = products.find(p => p.id === movement.productId);
              return (
                <tr key={movement.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="p-3 font-medium text-gray-900">
                    {product?.name || 'منتج غير معروف'}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      movement.type === 'in' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'in' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {movement.type === 'in' ? 'إضافة' : 'صرف'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    <span className={movement.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                      {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{movement.reason || 'لا يوجد'}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(movement.date).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredMovements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>لا توجد حركات مخزون تطابق الفلاتر المحددة</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* تنبيهات المخزون المنخفض */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          تنبيهات المخزون المنخفض
        </h3>
        <div className="space-y-3">
          {stats.lowStockProducts.length > 0 ? (
            stats.lowStockProducts.map(product => {
              const currentStock = movements
                .filter(m => m.productId === product.id)
                .reduce((total, m) => total + (m.type === 'in' ? m.quantity : -m.quantity), 0);
              
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-red-600">المخزون: {currentStock} قطعة</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>جميع المنتجات بمخزون كافي</p>
            </div>
          )}
        </div>
      </div>

      {/* المنتجات الأكثر نشاطاً */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          المنتجات الأكثر نشاطاً
        </h3>
        <div className="space-y-3">
          {stats.mostActiveProducts.map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-600">نشاط عالي</p>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-blue-600">{item.activity}</p>
                <p className="text-xs text-gray-500">إجمالي الحركات</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            تقارير المخزون المتقدمة
          </h1>
          <p className="text-gray-600 text-lg">نظام شامل لمراقبة وتحليل حركة المخزون</p>
        </div>

        {/* شريط التنقل والفلاتر */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            {/* أزرار التنقل */}
            <div className="flex gap-2">
              {[
                { key: 'overview', label: 'نظرة عامة', icon: Eye },
                { key: 'movements', label: 'حركات المخزون', icon: RefreshCw },
                { key: 'alerts', label: 'تنبيهات', icon: AlertTriangle }
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentView === view.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  {view.label}
                </button>
              ))}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpdateStock(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                تحديث المخزون
              </button>
              
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث البيانات
              </button>

              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                تصدير التقرير
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">كل المنتجات</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
              <option value="quarter">آخر 3 أشهر</option>
            </select>

            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الحركات</option>
              <option value="in">إضافات فقط</option>
              <option value="out">صرف فقط</option>
            </select>
          </div>

          {selectedProduct && stock !== null && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 font-semibold text-center">
                المخزون الحالي للمنتج المختار: <span className="text-xl">{stock}</span> قطعة
              </p>
            </div>
          )}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="animate-fade-in">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'movements' && renderMovements()}
          {currentView === 'alerts' && renderAlerts()}
        </div>

        {/* مودال تحديث المخزون */}
        {showUpdateStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">تحديث المخزون</h3>
                <button
                  onClick={() => setShowUpdateStock(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <UpdateStockForm 
                onStockUpdated={() => {
                  fetchData();
                  setShowUpdateStock(false);
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
