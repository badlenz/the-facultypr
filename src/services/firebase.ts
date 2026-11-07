import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  User
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export { auth, db, handleFirestoreError, OperationType };

// Helper type for Artist Account
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  nombreArtistico?: string;
  role: 'artist' | 'client' | 'admin';
  createdAt: string;
  driveFolderId?: string;
}

export interface Recibo {
  id: string;
  clienteEmail: string;
  nombreArtistico: string;
  monto: number;
  concepto: string;
  fecha: string;
  metodoPago: string;
  driveUrl?: string;
}

export interface ArchivoSesion {
  id: string;
  clienteEmail: string;
  nombreArtistico: string;
  nombreArchivo: string;
  tipo: 'Mezcla' | 'Master' | 'Stems' | 'Proyecto' | 'Recibo';
  driveUrl: string;
  fechaSubida: string;
  tamano?: string;
}

// Authentication Functions
export const registerUser = async (email: string, pass: string, displayName: string, nombreArtistico?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || nombreArtistico || 'Artista',
    nombreArtistico: nombreArtistico || displayName,
    role: 'artist',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
  return userProfile;
};

export const loginUser = async (email: string, pass: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return {
    uid: cred.user.uid,
    email: cred.user.email || email,
    displayName: cred.user.displayName || 'Usuario',
    role: 'artist',
    createdAt: new Date().toISOString()
  } as UserProfile;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Artista Google',
        nombreArtistico: user.displayName || 'Artista',
        role: 'artist',
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, userProfile);
      return userProfile;
    }

    return userDoc.data() as UserProfile;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      alert('La ventana emergente para iniciar sesión fue bloqueada por el navegador. Por favor, permítela para poder iniciar sesión.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn('El usuario canceló la solicitud de inicio de sesión.');
    } else {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
    return null;
  }
};

export const logoutUser = () => firebaseSignOut(auth);

// Firestore Collections Operations
export const saveRecibo = async (recibo: Recibo) => {
  const path = `recibos/${recibo.id}`;
  try {
    const ref = doc(db, 'recibos', recibo.id);
    await setDoc(ref, recibo);
    return recibo;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('Error saving recibo:', err);
    throw err;
  }
};

export const getRecibosPorEmail = async (email: string): Promise<Recibo[]> => {
  const path = 'recibos';
  try {
    const q = query(collection(db, 'recibos'), where('clienteEmail', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    const result: Recibo[] = [];
    snap.forEach(d => result.push(d.data() as Recibo));
    return result;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn('Notice fetching recibos:', err?.message || err);
    return [];
  }
};

export const saveArchivoSesion = async (archivo: ArchivoSesion) => {
  const path = `archivos/${archivo.id}`;
  try {
    const ref = doc(db, 'archivos', archivo.id);
    await setDoc(ref, archivo);
    return archivo;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('Error saving archivo:', err);
    throw err;
  }
};

export const getArchivosPorEmail = async (email: string): Promise<ArchivoSesion[]> => {
  const path = 'archivos';
  try {
    const q = query(collection(db, 'archivos'), where('clienteEmail', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    const result: ArchivoSesion[] = [];
    snap.forEach(d => result.push(d.data() as ArchivoSesion));
    return result;
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    console.warn('Notice fetching archivos:', err?.message || err);
    return [];
  }
};
