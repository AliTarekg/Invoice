import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// جلب ملخص مبيعات ودفعات الوردية
export async function getShiftSummary(shiftId: string) {
  // جلب كل المبيعات المرتبطة بالوردية
  const salesSnap = await getDocs(query(collection(db, 'sales'), where('shiftId', '==', shiftId)));
  let totalSales = 0;
  let totalTax = 0;
  let totalCount = 0;
  salesSnap.forEach(doc => {
    const d = doc.data();
    totalSales += d.total || 0;
    totalTax += d.tax || 0;
    totalCount++;
  });
  let totalCash = 0;
  let totalCard = 0;
  const saleIds = salesSnap.docs.map(doc => doc.id);
  if (saleIds.length > 0) {
    const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('saleId', 'in', saleIds)));
    paymentsSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'cash') totalCash += d.amount || 0;
      if (d.type === 'card') totalCard += d.amount || 0;
    });
  }
  return {
    totalSales,
    totalTax,
    totalCount,
    totalCash,
    totalCard
  };
}
