import { useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
// Hook: الاستماع اللحظي للمعاملات المالية
export function useTransactionsRealtime() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const txs: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        txs.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
        } as Transaction);
      });
      txs.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(txs);
    });
    return () => unsubscribe();
  }, []);
  return transactions;
}
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
  Timestamp,
  FieldValue 
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, TransactionForm } from '../types';

const COLLECTION_NAME = 'transactions';

export const addTransaction = async (transactionData: TransactionForm, addedBy: string): Promise<string> => {
  try {
    const transaction: Omit<Transaction, 'id'> = {
      ...transactionData,
      amount: parseFloat(transactionData.amount),
      date: new Date(transactionData.date),
      createdAt: new Date(),
      userId: addedBy, // Track who added it, but don't filter by it
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.fromDate(transaction.createdAt),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Get ALL transactions for the company, not filtered by user
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
      } as Transaction);
    });

    // Sort by date descending in JavaScript instead of Firestore
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (id: string, updates: Partial<TransactionForm>): Promise<void> => {
  try {
    const updateData: { [x: string]: FieldValue | Partial<unknown> | undefined } = { ...updates };
    
    if (updates.amount) {
      updateData.amount = parseFloat(updates.amount);
    }
    
    if (updates.date) {
      updateData.date = Timestamp.fromDate(new Date(updates.date));
    }

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};
