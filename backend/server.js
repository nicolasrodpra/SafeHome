require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("./firebaseKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API SafeHome funcionando");
});

const PORT = process.env.PORT ;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});