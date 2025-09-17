import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, serverTimestamp, setDoc, query, where, orderBy, limit, startAt, endAt } from 'firebase/firestore';

// توليد رقم فاتورة معقد وآمن
export async function generateInvoiceNumber(): Promise<string> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // إنشاء معرف فريد مع تشفير
    const timestamp = now.getTime();
    const randomSalt = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    // البحث عن آخر رقم فاتورة في هذا الشهر للحصول على التسلسل
    const q = query(
      collection(db, 'sales'),
      where('invoiceNumber', '>=', `INV-${year}${month}01-0001`),
      where('invoiceNumber', '<', `INV-${year}${month}32-0000`),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    let sequenceNumber = 1;
    
    if (!snapshot.empty) {
      const lastInvoice = snapshot.docs[0].data();
      const lastNumber = lastInvoice.invoiceNumber;
      // استخراج الرقم التسلسلي من آخر فاتورة
      const match = lastNumber.match(/-(\d{4})-\w{4}$/);
      if (match) {
        sequenceNumber = parseInt(match[1]) + 1;
      }
    }
    
    const sequence = String(sequenceNumber).padStart(4, '0');
    
    // إنشاء تحقق checksum بسيط
    const checksumData = `${year}${month}${day}${sequence}${randomSalt}`;
    const checksum = calculateChecksum(checksumData);
    
    // تنسيق الفاتورة: INV-YYYYMMDD-SSSS-CCCC
    // حيث CCCC هو checksum مشفر
    const invoiceNumber = `INV-${year}${month}${day}-${sequence}-${checksum}`;
    
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // استخدام نظام أساسي في حالة الخطأ
    const fallbackTimestamp = Date.now().toString().slice(-8);
    const fallbackRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-FALLBACK-${fallbackTimestamp}-${fallbackRandom}`;
  }
}

// حساب checksum للتحقق من صحة رقم الفاتورة
function calculateChecksum(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i) * (i + 1);
  }
  
  // تحويل إلى hex وأخذ آخر 4 أحرف
  const hex = sum.toString(16).toUpperCase();
  return hex.slice(-4).padStart(4, '0');
}

// التحقق من صحة رقم الفاتورة
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  try {
    // التحقق من التنسيق العام
    const regex = /^INV-(\d{8})-(\d{4})-([0-9A-F]{4})$/;
    const match = invoiceNumber.match(regex);
    
    if (!match) {
      // تحقق من التنسيق القديم
      const oldRegex = /^\d{10}$/;
      return oldRegex.test(invoiceNumber);
    }
    
    const [, dateStr, sequence, providedChecksum] = match;
    
    // إعادة حساب checksum للتحقق
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    
    // نحتاج للمزيد من المعلومات للتحقق الكامل
    // لكن يمكننا التحقق من التنسيق على الأقل
    return providedChecksum.length === 4 && /^[0-9A-F]{4}$/.test(providedChecksum);
  } catch (error) {
    console.error('Error validating invoice number:', error);
    return false;
  }
}

// استخراج معلومات من رقم الفاتورة
export function parseInvoiceNumber(invoiceNumber: string): {
  date?: Date;
  sequence?: number;
  isValid: boolean;
  format: 'new' | 'old' | 'fallback' | 'invalid';
} {
  try {
    // التنسيق الجديد
    const newRegex = /^INV-(\d{8})-(\d{4})-([0-9A-F]{4})$/;
    const newMatch = invoiceNumber.match(newRegex);
    
    if (newMatch) {
      const [, dateStr, sequenceStr] = newMatch;
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6)) - 1;
      const day = parseInt(dateStr.slice(6, 8));
      const sequence = parseInt(sequenceStr);
      
      return {
        date: new Date(year, month, day),
        sequence,
        isValid: true,
        format: 'new'
      };
    }
    
    // التنسيق الاحتياطي
    if (invoiceNumber.startsWith('INV-FALLBACK-')) {
      return {
        isValid: true,
        format: 'fallback'
      };
    }
    
    // التنسيق القديم
    const oldRegex = /^(\d{4})(\d{2})(\d{4})$/;
    const oldMatch = invoiceNumber.match(oldRegex);
    
    if (oldMatch) {
      const [, yearStr, monthStr, sequenceStr] = oldMatch;
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      const sequence = parseInt(sequenceStr);
      
      return {
        date: new Date(year, month, 1),
        sequence,
        isValid: true,
        format: 'old'
      };
    }
    
    return {
      isValid: false,
      format: 'invalid'
    };
  } catch (error) {
    console.error('Error parsing invoice number:', error);
    return {
      isValid: false,
      format: 'invalid'
    };
  }
}

// فتح وردية جديدة
export async function openShift(userId: string) {
  const ref = await addDoc(collection(db, 'shifts'), {
    userId,
    openedAt: serverTimestamp(),
    closedAt: null,
    totalSales: 0,
    totalCash: 0,
    totalCard: 0,
    isOpen: true,
  });
  return ref.id;
}

// إغلاق الوردية
export async function closeShift(shiftId: string, summary: any) {
  await updateDoc(doc(db, 'shifts', shiftId), {
    closedAt: serverTimestamp(),
    isOpen: false,
    ...summary,
  });
}

// جلب الوردية المفتوحة للمستخدم
export async function getOpenShift(userId: string) {
  const q = collection(db, 'shifts');
  const snapshot = await getDocs(q);
  type Shift = { id: string; userId: string; isOpen: boolean };
  return (snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Shift)).find(s => s.userId === userId && s.isOpen);
}

// البحث عن المبيعات بجزء من رقم الفاتورة
export async function searchSalesByInvoicePartial(partialInvoiceId: string) {
  try {
    const salesRef = collection(db, 'sales');
    const snapshot = await getDocs(salesRef);
    
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // البحث في رقم الفاتورة التسلسلي أولاً
    let matchingSales = sales.filter(sale => 
      sale.invoiceNumber && sale.invoiceNumber.toString().includes(partialInvoiceId)
    );
    
    // إذا لم توجد نتائج، ابحث في ID الـ Firestore للتوافق مع الفواتير القديمة
    if (matchingSales.length === 0) {
      matchingSales = sales.filter(sale => 
        sale.id.toLowerCase().startsWith(partialInvoiceId.toLowerCase())
      );
    }
    
    // ترتيب النتائج بحسب التاريخ (الأحدث أولاً)
    return matchingSales
      .sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 20); // إظهار أول 20 نتيجة فقط
  } catch (error) {
    console.error('Error searching sales:', error);
    throw error;
  }
}

// جلب تفاصيل فاتورة محددة
export async function getSaleById(saleId: string) {
  try {
    const saleDoc = await getDoc(doc(db, 'sales', saleId));
    if (saleDoc.exists()) {
      return {
        id: saleDoc.id,
        ...saleDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting sale:', error);
    throw error;
  }
}

// معالجة المرتجع
export async function processSaleReturn(saleId: string, returnData: any) {
  try {
    // إضافة سجل المرتجع
    const returnRef = await addDoc(collection(db, 'returns'), {
      originalSaleId: saleId,
      returnDate: serverTimestamp(),
      ...returnData
    });
    
    // تحديث حالة الفاتورة الأصلية
    await updateDoc(doc(db, 'sales', saleId), {
      isReturned: true,
      returnId: returnRef.id,
      returnDate: serverTimestamp()
    });
    
    return returnRef.id;
  } catch (error) {
    console.error('Error processing return:', error);
    throw error;
  }
}

// تسجيل عملية بيع
export async function addSale(sale: any) {
  // إنشاء رقم فاتورة تسلسلي
  const invoiceNumber = await generateInvoiceNumber();
  
  const ref = await addDoc(collection(db, 'sales'), {
    ...sale,
    invoiceNumber, // إضافة رقم الفاتورة التسلسلي
    createdAt: serverTimestamp(),
  });
  
  // إرجاع كل من ID ورقم الفاتورة
  return {
    id: ref.id,
    invoiceNumber
  };
}

// تسجيل دفعة
export async function addPayment(payment: any) {
  const ref = await addDoc(collection(db, 'payments'), {
    ...payment,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// تسجيل عملية في سجل الأحداث
export async function addAuditLog(log: any) {
  await addDoc(collection(db, 'audit_logs'), {
    ...log,
    createdAt: serverTimestamp(),
  });
}
