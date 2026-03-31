import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
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
  login: () => Promise<void>;
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
          
          // Listen to profile changes (e.g., admin blocking or granting premium)
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

    // Listen to global settings
    const globalRef = doc(db, 'settings', 'global');
    const unsubGlobal = onSnapshot(globalRef, (snap) => {
      if (snap.exists()) {
        setIsGlobalPremium(snap.data().isGlobalPremium || false);
      } else {
        // Create if not exists
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

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
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
      displayName: name,
      organization: org,
      isPremium: false,
      isBlocked: false,
      role: user.email === 'sonlyhongduc@gmail.com' ? 'admin' : 'user',
      lastIp: ip,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
    setNeedsProfileSetup(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isGlobalPremium, loading, needsProfileSetup, login, logout, setupProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
