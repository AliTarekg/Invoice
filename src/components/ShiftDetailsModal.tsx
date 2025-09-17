import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, User, Clock, DollarSign, CreditCard, ShoppingCart, Calendar, TrendingUp } from 'lucide-react';

export default function ShiftDetailsModal({ shift, onClose }: { shift: any, onClose: () => void }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<{ email?: string; displayName?: string; id?: string } | null>(null);

  useEffect(() => {
    async function fetchSalesAndUser() {
      setLoading(true);
      setError('');
      try {
        // جلب تفاصيل المبيعات
        const q = query(collection(db, 'sales'), where('shiftId', '==', shift.id));
        const snap = await getDocs(q);
        setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // جلب بيانات المستخدم
        if (shift.userId) {
          const userDoc = await getDoc(doc(db, 'users', shift.userId));
          if (userDoc.exists()) {
            setUserInfo(userDoc.data() as any);
          } else {
            setUserInfo({ id: shift.userId });
          }
        }
      } catch (err) {
        setError('تعذر تحميل تفاصيل المبيعات أو بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    }
    fetchSalesAndUser();
  }, [shift.id, shift.userId]);

  // حساب الإحصائيات
  const totalSalesCount = sales.length;
  const cashSales = sales.filter(s => s.paymentType === 'cash').length;
  const cardSales = sales.filter(s => s.paymentType === 'card').length;
  const avgSaleAmount = totalSalesCount > 0 ? (shift.totalSales / totalSalesCount) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8" />
            <div>
              <h3 className="text-2xl font-bold">تفاصيل الوردية #{shift.id}</h3>
              <p className="text-cyan-100 text-sm">
                {shift.isOpen ? (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    وردية مفتوحة
                  </span>
                ) : (
                  'وردية مغلقة'
                )}
              </p>
            </div>
          </div>
          <button 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors" 
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* بيانات المستخدم والتوقيتات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-6 w-6 text-cyan-600" />
                <h4 className="text-lg font-semibold text-slate-800">معلومات المستخدم</h4>
              </div>
              {userInfo ? (
                <div className="space-y-2">
                  <p className="text-slate-700">
                    <span className="font-medium">الاسم:</span> {userInfo.displayName || 'غير محدد'}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-medium">البريد:</span> {userInfo.email || 'غير محدد'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    <span className="font-medium">معرف المستخدم:</span> {userInfo.id || shift.userId}
                  </p>
                </div>
              ) : (
                <p className="text-slate-700">{shift.userId}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6 text-cyan-600" />
                <h4 className="text-lg font-semibold text-slate-800">التوقيتات</h4>
              </div>
              <div className="space-y-2">
                <p className="text-slate-700">
                  <span className="font-medium">وقت الفتح:</span><br />
                  <span className="text-sm text-slate-600">
                    {shift.openedAt?.seconds ? new Date(shift.openedAt.seconds * 1000).toLocaleString('ar-EG') : '-'}
                  </span>
                </p>
                <p className="text-slate-700">
                  <span className="font-medium">وقت الإغلاق:</span><br />
                  <span className="text-sm text-slate-600">
                    {shift.closedAt?.seconds ? new Date(shift.closedAt.seconds * 1000).toLocaleString('ar-EG') : 'لم يتم الإغلاق بعد'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* الإحصائيات المالية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-bold text-xl">{shift.totalSales || 0}</p>
              <p className="text-green-600 text-sm">إجمالي المبيعات</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-bold text-xl">{shift.totalCash || 0}</p>
              <p className="text-blue-600 text-sm">إجمالي النقد</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-purple-800 font-bold text-xl">{shift.totalCard || 0}</p>
              <p className="text-purple-600 text-sm">إجمالي البطاقات</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <ShoppingCart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-orange-800 font-bold text-xl">{totalSalesCount}</p>
              <p className="text-orange-600 text-sm">عدد المبيعات</p>
            </div>
          </div>

          {/* إحصائيات إضافية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-center">
              <p className="text-cyan-800 font-bold text-lg">{avgSaleAmount.toFixed(2)}</p>
              <p className="text-cyan-600 text-sm">متوسط قيمة البيع</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-bold text-lg">{cashSales}</p>
              <p className="text-green-600 text-sm">مبيعات نقدية</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
              <p className="text-indigo-800 font-bold text-lg">{cardSales}</p>
              <p className="text-indigo-600 text-sm">مبيعات بالبطاقة</p>
            </div>
          </div>

          {/* جدول المبيعات */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-cyan-600" />
              عمليات البيع في هذه الوردية
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-slate-600">جاري تحميل المبيعات...</p>
              </div>
            ) : error ? (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">{error}</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                <p>لا توجد عمليات بيع في هذه الوردية</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    <tr>
                      <th className="p-3 text-right font-semibold">رقم الفاتورة</th>
                      <th className="p-3 text-center font-semibold">العميل</th>
                      <th className="p-3 text-center font-semibold">التاريخ</th>
                      <th className="p-3 text-center font-semibold">الإجمالي</th>
                      <th className="p-3 text-center font-semibold">الضريبة</th>
                      <th className="p-3 text-center font-semibold">طريقة الدفع</th>
                      <th className="p-3 text-center font-semibold">المنتجات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <tr key={sale.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{sale.id}</td>
                        <td className="p-3 text-center text-slate-700">{sale.customerName || '-'}</td>
                        <td className="p-3 text-center text-slate-700 text-xs">
                          {sale.date ? new Date(sale.date).toLocaleString('ar-EG') : '-'}
                        </td>
                        <td className="p-3 text-center font-semibold text-green-600">{sale.total}</td>
                        <td className="p-3 text-center text-slate-700">{sale.tax}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sale.paymentType === 'cash' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {sale.paymentType === 'cash' ? 'نقدي' : 'بطاقة'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="max-w-xs">
                            {sale.products?.map((p: any, i: number) => (
                              <div key={i} className="text-xs text-slate-600 mb-1">
                                {p.name} × {p.quantity} بسعر {p.price}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
