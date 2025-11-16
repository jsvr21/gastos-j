// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase Config desde .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only on client side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  try {
    // Initialize Firebase only if no apps exist
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);

    // Analytics solo se inicializa si está disponible
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      console.warn("Analytics no disponible:", analyticsError);
    }
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
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
