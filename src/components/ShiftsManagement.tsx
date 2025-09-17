import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getShiftSummary } from '../lib/shiftSummary';
import ShiftDetailsModal from './ShiftDetailsModal';

export default function ShiftsManagement() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShift, setSelectedShift] = useState<any | null>(null);

  useEffect(() => {
    async function fetchShifts() {
      setLoading(true);
      setError('');
      try {
        const q = query(collection(db, 'shifts'), orderBy('openedAt', 'desc'));
        const snap = await getDocs(q);
        const shiftsRaw = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // جلب ملخص كل وردية مغلقة أو مفتوحة
        const shiftsWithSummary = await Promise.all(
          shiftsRaw.map(async shift => {
            const summary = await getShiftSummary(shift.id);
            return {
              ...shift,
              totalSales: summary.totalSales,
              totalCash: summary.totalCash,
              totalCard: summary.totalCard
            };
          })
        );
        setShifts(shiftsWithSummary);
      } catch (err) {
        setError('تعذر تحميل الورديات');
      } finally {
        setLoading(false);
      }
    }
    fetchShifts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6">🕒 إدارة الورديات</h2>
      {error && <div className="text-red-600 mb-2 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
      {loading ? (
        <div className="text-center py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 inline-block p-8 rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">جاري تحميل الورديات...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg text-sm">
            <thead className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <tr>
                <th className="p-3 font-semibold">رقم الوردية</th>
                <th className="p-3 font-semibold">المستخدم</th>
                <th className="p-3 font-semibold">وقت الفتح</th>
                <th className="p-3 font-semibold">وقت الإغلاق</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">إجمالي المبيعات</th>
                <th className="p-3 font-semibold">نقد</th>
                <th className="p-3 font-semibold">بطاقة</th>
                <th className="p-3 font-semibold">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <tr key={shift.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{shift.id}</td>
                  <td className="p-3 text-slate-700">{shift.userId}</td>
                  <td className="p-3 text-slate-700">{shift.openedAt?.seconds ? new Date(shift.openedAt.seconds * 1000).toLocaleString('ar-EG') : '-'}</td>
                  <td className="p-3 text-slate-700">{shift.closedAt?.seconds ? new Date(shift.closedAt.seconds * 1000).toLocaleString('ar-EG') : '-'}</td>
                  <td className="p-3">
                    {shift.isOpen ? <span className="text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full text-xs">مفتوحة</span> : <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs">مغلقة</span>}
                  </td>
                  <td className="p-3 text-slate-700">{shift.totalSales ?? '-'}</td>
                  <td className="p-3 text-slate-700">{shift.totalCash ?? '-'}</td>
                  <td className="p-3 text-slate-700">{shift.totalCard ?? '-'}</td>
                  <td className="p-3">
                    <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs transition-colors" onClick={() => setSelectedShift(shift)}>تفاصيل</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedShift && (
        <ShiftDetailsModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
      )}
    </div>
  );
}
