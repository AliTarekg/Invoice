import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  RotateCcw, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  TrendingDown,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';

interface ReturnItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Return {
  id: string;
  saleId: string;
  invoiceNumber?: string;
  customerName?: string;
  items: ReturnItem[];
  totalAmount: number;
  date: any;
  createdAt: string;
}

export default function ReturnsReport() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  async function fetchReturns() {
    setLoading(true);
    try {
      const returnsRef = collection(db, 'returns');
      const q = query(returnsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      const returnsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Return[];
      
      setReturns(returnsData);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  }

  // تصفية المرتجعات
  const getFilteredReturns = () => {
    let filtered = returns;

    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(returnItem =>
        (returnItem.invoiceNumber && returnItem.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (returnItem.customerName && returnItem.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        returnItem.saleId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // تصفية حسب التاريخ
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(item => 
            item.date && new Date(item.date.seconds * 1000) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(item => 
            item.date && new Date(item.date.seconds * 1000) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(item => 
            item.date && new Date(item.date.seconds * 1000) >= filterDate
          );
          break;
      }
    }

    return filtered;
  };

  const filteredReturns = getFilteredReturns();

  // حساب الإحصائيات
  const calculateStats = () => {
    const totalReturns = filteredReturns.length;
    const totalAmount = filteredReturns.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalItems = filteredReturns.reduce((sum, item) => 
      sum + item.items.reduce((itemSum, product) => itemSum + product.quantity, 0), 0
    );

    return { totalReturns, totalAmount, totalItems };
  };

  const stats = calculateStats();

  function viewReturnDetails(returnItem: Return) {
    setSelectedReturn(returnItem);
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">جاري تحميل تقارير المرتجعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <RotateCcw className="w-10 h-10 text-blue-600" />
            تقارير المرتجعات
          </h1>
          <p className="text-gray-600 text-lg">متابعة وتحليل عمليات إرجاع المنتجات</p>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">إجمالي المرتجعات</h3>
                <p className="text-3xl font-bold">{stats.totalReturns}</p>
              </div>
              <TrendingDown className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">إجمالي القيمة</h3>
                <p className="text-3xl font-bold">{stats.totalAmount}</p>
                <p className="text-sm opacity-80">جنيه</p>
              </div>
              <DollarSign className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">إجمالي القطع</h3>
                <p className="text-3xl font-bold">{stats.totalItems}</p>
                <p className="text-sm opacity-80">قطعة مرتجعة</p>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* الفلاتر */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
            </select>

            <button
              onClick={fetchReturns}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              تحديث البيانات
            </button>
          </div>
        </div>

        {/* جدول المرتجعات */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              سجل المرتجعات
            </h3>
            <span className="text-sm text-gray-500">
              {filteredReturns.length} مرتجع
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-right p-3 font-semibold">رقم الفاتورة</th>
                  <th className="text-right p-3 font-semibold">العميل</th>
                  <th className="text-center p-3 font-semibold">عدد المنتجات</th>
                  <th className="text-center p-3 font-semibold">القيمة الإجمالية</th>
                  <th className="text-center p-3 font-semibold">تاريخ المرتجع</th>
                  <th className="text-center p-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((returnItem, index) => (
                  <tr key={returnItem.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-3 font-medium text-gray-900">
                      {returnItem.invoiceNumber || returnItem.saleId}
                    </td>
                    <td className="p-3 text-gray-700">
                      {returnItem.customerName || 'غير محدد'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {returnItem.items.length} منتج
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-red-600">
                      {returnItem.totalAmount} جنيه
                    </td>
                    <td className="p-3 text-center text-gray-500">
                      {returnItem.date ? 
                        new Date(returnItem.date.seconds * 1000).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'غير محدد'
                      }
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => viewReturnDetails(returnItem)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredReturns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>لا توجد مرتجعات تطابق الفلاتر المحددة</p>
              </div>
            )}
          </div>
        </div>

        {/* مودال تفاصيل المرتجع */}
        {showModal && selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    تفاصيل المرتجع
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* معلومات المرتجع */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">رقم الفاتورة:</span>
                      <span>{selectedReturn.invoiceNumber || selectedReturn.saleId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">العميل:</span>
                      <span>{selectedReturn.customerName || 'غير محدد'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">تاريخ المرتجع:</span>
                      <span>
                        {selectedReturn.date ? 
                          new Date(selectedReturn.date.seconds * 1000).toLocaleDateString('ar-EG') : 
                          'غير محدد'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">إجمالي القيمة:</span>
                      <span className="font-bold text-red-600">{selectedReturn.totalAmount} جنيه</span>
                    </div>
                  </div>
                </div>

                {/* المنتجات المرتجعة */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    المنتجات المرتجعة
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-right p-3 font-semibold">المنتج</th>
                          <th className="text-center p-3 font-semibold">الكمية</th>
                          <th className="text-center p-3 font-semibold">السعر</th>
                          <th className="text-center p-3 font-semibold">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReturn.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-center">{item.price} جنيه</td>
                            <td className="p-3 text-center font-semibold text-red-600">
                              {item.total} جنيه
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-red-50 font-bold">
                          <td colSpan={3} className="p-3 text-right">الإجمالي:</td>
                          <td className="p-3 text-center text-red-600">
                            {selectedReturn.totalAmount} جنيه
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
