// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbAkqFOz1I_mdQl_irPP0cV5jDNzZ5lHs",
  authDomain: "gastos-a9062.firebaseapp.com",
  projectId: "gastos-a9062",
  storageBucket: "gastos-a9062.firebasestorage.app",
  messagingSenderId: "731331334644",
  appId: "1:731331334644:web:9cea33a12d9530eb22e9a1",
  measurementId: "G-Z9W1CGJ7YN"
};

// Initialize Firebase only on client side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase only if no apps exist
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Analytics solo se inicializa si está disponible
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      console.warn('Analytics no disponible:', analyticsError);
    }
  } catch (error) {
    console.error('Error inicializando Firebase:', error);
  }
}

// Crear valores por defecto para evitar errores
const defaultApp = {} as FirebaseApp;
const defaultAuth = {} as Auth;
const defaultDb = {} as Firestore;

// Exportar con valores por defecto si no están inicializados
export const firebaseApp = app || defaultApp;
export const firebaseAuth = auth || defaultAuth;
export const firebaseDb = db || defaultDb;
export const firebaseAnalytics = analytics;

// Exportar con los nombres originales para compatibilidad
export { firebaseApp as app, firebaseAuth as auth, firebaseDb as db, firebaseAnalytics as analytics };

