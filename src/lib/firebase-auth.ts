import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export class FirebaseAuthService {
    static async signInWithGoogle(): Promise<User> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        }
    }

    static async signOut(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    static async getCurrentUser(): Promise<User | null> {
        return auth.currentUser;
    }

    static async getIdToken(): Promise<string | null> {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    }

    static onAuthStateChange(callback: (user: User | null) => void): () => void {
        return onAuthStateChanged(auth, callback);
    }
} 