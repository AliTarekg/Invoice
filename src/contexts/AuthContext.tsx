'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Currency, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, defaultCurrency: Currency, role?: UserRole) => Promise<UserRole>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              photoURL: firebaseUser.photoURL || undefined,
              defaultCurrency: userData.defaultCurrency || 'USD',
              createdAt: userData.createdAt && typeof userData.createdAt.toDate === 'function'
                ? userData.createdAt.toDate()
                : new Date(userData.createdAt || Date.now()),
              role: userData.role || 'user',
            });
          } else {
            // Create user profile if it doesn't exist
            const newUser: Omit<User, 'id'> = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              defaultCurrency: 'USD',
              createdAt: new Date(),
              role: 'viewer',
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                createdAt: new Date(),
              });
              setUser({
                id: firebaseUser.uid,
                ...newUser,
              });
            } catch (firestoreError) {
              console.warn('Could not create user profile in Firestore, using auth data only:', firestoreError);
              // Fallback: create user from auth data only
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || '',
                defaultCurrency: 'USD',
                createdAt: new Date(),
                role: 'viewer',
              });
            }
          }
        } catch (error) {
          console.warn('Could not access Firestore, using auth data only:', error);
          // Fallback: create user from auth data only
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            defaultCurrency: 'USD',
            createdAt: new Date(),
            role: 'viewer',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string, defaultCurrency: Currency, role: UserRole = 'viewer') => {
    try {
      // First, try to create the user with Firebase Auth
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(firebaseUser, { displayName });

      // Check if this is the first user by trying to read users collection
      // If we get permission denied, it means there are users but we can't read them
      // If we can read and it's empty, this is the first user
      let isFirstUser = false;
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        isFirstUser = usersSnap.empty;
      } catch (error) {
        // If we can't read the collection, assume there are existing users
        console.log('Could not check existing users, assuming not first user');
        isFirstUser = false;
      }

      const assignedRole = isFirstUser ? 'admin' : role;

      // Create user document in Firestore
      const newUser: Omit<User, 'id'> = {
        email,
        displayName,
        defaultCurrency,
        createdAt: new Date(),
        role: assignedRole,
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      } catch (firestoreError) {
        console.warn('Could not save user profile to Firestore, but auth user was created:', firestoreError);
        // User is still created in Auth, just not in Firestore
      }

      return assignedRole;
    } catch (error) {
      // If user creation fails, try to delete the auth user if it was created
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    role: user?.role || 'user',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
