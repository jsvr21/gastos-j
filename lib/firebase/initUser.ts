// Función para inicializar datos del usuario cuando se registra por primera vez
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

export async function initializeUserData(userId: string) {
  try {
    // Verificar que db esté inicializado
    if (!db || typeof db === 'object' && Object.keys(db).length === 0) {
      console.warn('Firestore no está inicializado');
      return;
    }

    // Crear un documento de usuario si no existe
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Crear documento de usuario inicial
      await setDoc(userDocRef, {
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      console.log('Usuario inicializado en Firestore');
    } else {
      // Actualizar último login
      await setDoc(userDocRef, {
        lastLogin: new Date(),
      }, { merge: true });
    }
  } catch (error: any) {
    // Si hay error de permisos, simplemente lo ignoramos (no es crítico)
    if (error.code === 'permission-denied') {
      console.warn('No se pudo inicializar datos del usuario (permisos). Continuando...');
    } else {
      console.error('Error inicializando datos del usuario:', error);
    }
  }
}

