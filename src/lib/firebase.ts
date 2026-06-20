import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || "");
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const guestSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInAnonymously(auth);
    // Anonymous users don't have OAuth access tokens for external APIs,
    // so we'll just mock a token for them or pass empty string
    cachedAccessToken = "";
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Guest Sign in error:', error);
    if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
      let mockUid = localStorage.getItem('demo_uid');
      if (!mockUid) {
        mockUid = 'demo_user_' + Math.random().toString(36).substring(7);
        localStorage.setItem('demo_uid', mockUid);
      }
      const mockUser = {
        uid: mockUid,
        isAnonymous: true,
        displayName: 'Guest Demo',
        email: null,
      } as any;
      cachedAccessToken = "";
      return { user: mockUser, accessToken: cachedAccessToken };
    }
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
