// Inicializacion central de Firebase Admin.
// Se reutiliza en todo el backend para acceder a Auth y Firestore.
const admin = require("firebase-admin");
const serviceAccount = require("../firebaseKey.json");

// Algunos entornos locales inyectan un proxy invalido (127.0.0.1:9)
// que bloquea la obtencion del token OAuth de Firebase Admin.
const invalidLocalProxy = "http://127.0.0.1:9";
[
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
].forEach((proxyKey) => {
  if (process.env[proxyKey] === invalidLocalProxy) {
    delete process.env[proxyKey];
  }
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

module.exports = admin;
