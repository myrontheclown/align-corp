import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from '../lib/firebase';

import {
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  UserProfile,
  UserRole,
} from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (
    email: string,
    pass: string
  ) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  persistedRole: UserRole | null;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<FirebaseUser | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  // REMOVED LOCALSTORAGE PERSISTENCE
  const [persistedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async firebaseUser => {
        try {
          // USER LOGGED IN
          if (
            firebaseUser &&
            firebaseUser.email
          ) {
            setLoading(true);

            setUser(firebaseUser);

            // DIRECT DOCUMENT FETCH
            const userRef = doc(
              db,
              'users',
              firebaseUser.uid
            );

            const userSnap = await getDoc(
              userRef
            );

            // EXISTING PROFILE
            if (userSnap.exists()) {
              const profileData = {
                ...userSnap.data(),
                uid: firebaseUser.uid,
              } as UserProfile;

              setProfile(profileData);
            }

            // CREATE NEW PROFILE
            else {
              const role: UserRole =
                firebaseUser.email ===
                  'myrondcrz15@gmail.com' ||
                  firebaseUser.email ===
                  'admin@test.com'
                  ? 'admin'
                  : firebaseUser.email ===
                    'manager@test.com'
                    ? 'manager'
                    : 'employee';

              const newProfile: UserProfile =
              {
                uid: firebaseUser.uid,
                email:
                  firebaseUser.email || '',
                displayName:
                  firebaseUser.displayName ||
                  'Enterprise User',
                role,
                department: 'General',
                createdAt:
                  serverTimestamp() as any,
              };

              await setDoc(
                userRef,
                newProfile
              );

              setProfile(newProfile);
            }
          }

          // USER LOGGED OUT
          else {
            setUser(null);
            setProfile(null);
            // CLEAR ALL AUTH CACHE
            localStorage.clear();
          }
        } catch (error) {
          console.error(
            '[Auth Error]',
            error
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();

    // IMPORTANT:
    // EMPTY DEPENDENCY ARRAY
    // PREVENTS AUTH LISTENER LOOP
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(
      auth,
      googleProvider
    );
  };

  const signInWithEmail = async (
    email: string,
    pass: string
  ) => {
    await signInWithEmailAndPassword(
      auth,
      email,
      pass
    );
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string
  ) => {
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );

    const userRef = doc(
      db,
      'users',
      userCredential.user.uid
    );

    const newProfile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      displayName: name,
      role: 'employee',
      department: 'General',
      createdAt:
        serverTimestamp() as any,
    };

    await setDoc(userRef, newProfile);

    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        persistedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};