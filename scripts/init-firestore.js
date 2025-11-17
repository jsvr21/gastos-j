// Script para inicializar Firestore con estructura inicial
// Ejecutar con: node scripts/init-firestore.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Necesitarás descargar esto

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initFirestore() {
  try {
    console.log('Inicializando Firestore...');
    
    // Las colecciones se crean automáticamente cuando agregas el primer documento
    // No necesitamos crear documentos vacíos, pero podemos crear un documento de ejemplo
    
    console.log('✅ Firestore está listo para usar');
    console.log('Las colecciones se crearán automáticamente cuando agregues datos');
    console.log('');
    console.log('Estructura esperada:');
    console.log('- Colección: fortnights');
    console.log('  - Documentos con: userId, year, month, day, total, createdAt');
    console.log('- Colección: expenses');
    console.log('  - Documentos con: userId, fortnightId, name, amount, description, createdAt');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initFirestore();

