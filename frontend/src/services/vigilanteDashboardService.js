import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

const isToday = (timestamp) => {
  if (!timestamp?.toDate) return false;

  const date = timestamp.toDate();
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const subscribeVigilanteDashboardStats = (onChange, onError) => {
  const stats = {
    vehiculosHoy: 0,
    correspondenciaHoy: 0,
    visitantesHoy: 0,
  };

  const emit = () => {
    onChange({ ...stats });
  };

  const buildHandler = (key) => (snapshot) => {
    stats[key] = snapshot.docs.filter((docSnapshot) => isToday(docSnapshot.data().fecha)).length;
    emit();
  };

  const unsubscribers = [
    onSnapshot(collection(db, "vehiculos"), buildHandler("vehiculosHoy"), onError),
    onSnapshot(collection(db, "correspondencia"), buildHandler("correspondenciaHoy"), onError),
    onSnapshot(collection(db, "visitantes"), buildHandler("visitantesHoy"), onError),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
