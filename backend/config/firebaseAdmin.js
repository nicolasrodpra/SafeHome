// Inicializacion central de Firebase Admin.
// Se reutiliza en todo el backend para acceder a Auth y Firestore.
const admin = require("firebase-admin");
const serviceAccount = require("../firebaseKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
