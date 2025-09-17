import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  deleteDoc, 
  doc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Supplier, SupplierForm } from '../types';

const COLLECTION_NAME = 'suppliers';

export const addSupplier = async (supplierData: SupplierForm, addedBy: string): Promise<string> => {
  try {
    const supplier: Omit<Supplier, 'id'> = {
      ...supplierData,
      createdAt: new Date(),
      userId: addedBy, // Track who added it, but don't filter by it
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...supplier,
      createdAt: Timestamp.fromDate(supplier.createdAt),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding supplier:', error);
    throw error;
  }
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    // Get ALL suppliers for the company, not filtered by user
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const suppliers: Supplier[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      suppliers.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Supplier);
    });

    // Sort by name in JavaScript instead of Firestore
    suppliers.sort((a, b) => a.name.localeCompare(b.name));

    return suppliers;
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  try {
    // Get ALL active suppliers for the company
    const q = query(
      collection(db, COLLECTION_NAME),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const suppliers: Supplier[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      suppliers.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Supplier);
    });

    return suppliers;
  } catch (error) {
    console.error('Error getting active suppliers:', error);
    throw error;
  }
};

export const updateSupplier = async (id: string, updates: Partial<SupplierForm>): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), updates);
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
};

export const deactivateSupplier = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), { isActive: false });
  } catch (error) {
    console.error('Error deactivating supplier:', error);
    throw error;
  }
};
