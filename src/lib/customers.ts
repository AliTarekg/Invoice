import { db } from './firebase';
import { Customer, CustomerForm, CustomerPurchase } from '../types/customer';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  getDoc
} from 'firebase/firestore';

const CUSTOMERS_COLLECTION = 'customers';
const CUSTOMER_PURCHASES_COLLECTION = 'customerPurchases';

export async function addCustomer(customerData: CustomerForm): Promise<Customer> {
  const customer = {
    name: customerData.name,
    phone: customerData.phone,
    email: customerData.email || '',
    address: customerData.address || '',
    loyaltyPoints: 0,
    totalPurchases: 0,
    discount: parseFloat(customerData.discount) || 0,
    createdAt: Timestamp.now(),
    notes: customerData.notes || '',
  };
  
  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), customer);
  return { 
    id: docRef.id, 
    ...customer,
    createdAt: new Date(),
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastPurchase: data.lastPurchase?.toDate(),
    } as Customer;
  });
}

export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  const q = query(collection(db, CUSTOMERS_COLLECTION), where('phone', '==', phone));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docData = snapshot.docs[0];
  const data = docData.data();
  return { 
    id: docData.id, 
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastPurchase: data.lastPurchase?.toDate(),
  } as Customer;
}

export async function updateCustomer(id: string, updates: Partial<CustomerForm>): Promise<void> {
  const updateData: any = { ...updates };
  if (updates.discount) {
    updateData.discount = parseFloat(updates.discount);
  }
  await updateDoc(doc(db, CUSTOMERS_COLLECTION, id), updateData);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
}

// تسجيل عملية شراء للعميل
export async function addCustomerPurchase(purchase: Omit<CustomerPurchase, 'id'>): Promise<void> {
  const purchaseData = {
    ...purchase,
    date: Timestamp.fromDate(purchase.date),
  };
  
  // إضافة عملية الشراء
  await addDoc(collection(db, CUSTOMER_PURCHASES_COLLECTION), purchaseData);
  
  // تحديث بيانات العميل
  const customerRef = doc(db, CUSTOMERS_COLLECTION, purchase.customerId);
  const customerDoc = await getDoc(customerRef);
  
  if (customerDoc.exists()) {
    const currentData = customerDoc.data();
    const newLoyaltyPoints = (currentData.loyaltyPoints || 0) + purchase.pointsEarned;
    const newTotalPurchases = (currentData.totalPurchases || 0) + purchase.amount;
    
    await updateDoc(customerRef, {
      loyaltyPoints: newLoyaltyPoints,
      totalPurchases: newTotalPurchases,
      lastPurchase: Timestamp.fromDate(purchase.date),
    });
  }
}

// جلب سجل مشتريات العميل
export async function getCustomerPurchases(customerId: string): Promise<CustomerPurchase[]> {
  try {
    // التحقق من صحة معرف العميل
    if (!customerId || customerId.trim() === '') {
      console.warn('Customer ID is empty or invalid');
      return [];
    }

    // محاولة جلب البيانات من مجموعة مشتريات العملاء المخصصة
    try {
      const q = query(
        collection(db, CUSTOMER_PURCHASES_COLLECTION), 
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerId: data.customerId || customerId,
            saleId: data.saleId || doc.id,
            amount: data.amount || 0,
            date: data.date?.toDate() || new Date(),
            products: data.products || [],
            pointsEarned: data.pointsEarned || 0,
            discountApplied: data.discountApplied || 0,
          } as CustomerPurchase;
        });
      }
    } catch (purchasesError) {
      console.warn('Customer purchases collection not found or error accessing it:', purchasesError);
    }
    
    // إذا لم توجد بيانات في المجموعة المخصصة، ابحث في مجموعة المبيعات العامة
    try {
      const salesQuery = query(
        collection(db, 'sales'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      return salesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerId: customerId,
          saleId: doc.id,
          amount: data.totalAmount || data.total || 0,
          date: data.createdAt?.toDate() || data.date?.toDate() || new Date(),
          products: data.products || data.items || [],
          pointsEarned: calculateLoyaltyPoints(data.totalAmount || data.total || 0),
          discountApplied: data.discount || data.discountAmount || 0,
        } as CustomerPurchase;
      });
    } catch (salesError) {
      console.warn('Sales collection not found or error accessing it:', salesError);
      return [];
    }
    
  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    // إرجاع مصفوفة فارغة بدلاً من رفع خطأ
    return [];
  }
}

// حساب نقاط الولاء بناءً على مبلغ الشراء
export function calculateLoyaltyPoints(amount: number): number {
  // نقطة واحدة لكل 10 جنيه
  return Math.floor(amount / 10);
}
