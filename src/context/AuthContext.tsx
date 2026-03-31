import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  ConfirmationResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  organization: string;
  isPremium: boolean;
  isBlocked: boolean;
  role: 'admin' | 'user';
  lastIp: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isGlobalPremium: boolean;
  loading: boolean;
  needsProfileSetup: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string, remember: boolean) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithPhone: (phone: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  logout: () => Promise<void>;
  setupProfile: (name: string, org: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGlobalPremium, setIsGlobalPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setNeedsProfileSetup(false);
          
          onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            }
          });
        } else {
          setNeedsProfileSetup(true);
        }
      } else {
        setProfile(null);
        setNeedsProfileSetup(false);
      }
      setLoading(false);
    });

    const globalRef = doc(db, 'settings', 'global');
    const unsubGlobal = onSnapshot(globalRef, (snap) => {
      if (snap.exists()) {
        setIsGlobalPremium(snap.data().isGlobalPremium || false);
      } else {
        setDoc(globalRef, { isGlobalPremium: false }).catch(console.error);
      }
    }, (error) => {
      console.error("Error listening to global settings:", error);
    });

    return () => {
      unsubscribe();
      unsubGlobal();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string, remember: boolean) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithPhone = async (phone: string, appVerifier: RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phone, appVerifier);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setupProfile = async (name: string, org: string) => {
    if (!user) return;
    
    let ip = 'Unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ip = data.ip;
    } catch (e) {
      console.error('Failed to fetch IP');
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      displayName: name,
      organization: org,
      isPremium: false,
      isBlocked: false,
      role: (user.email === 'sonlyhongduc@gmail.com') ? 'admin' : 'user',
      lastIp: ip,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setNeedsProfileSetup(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, isGlobalPremium, loading, needsProfileSetup, 
      loginWithGoogle, loginWithEmail, registerWithEmail, loginWithPhone,
      logout, setupProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
