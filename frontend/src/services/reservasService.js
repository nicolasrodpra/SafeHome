import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { sortReservationsByTime } from "../utils/reservasCommon";

const RESERVAS_COLLECTION = "reservasZonasComunes";

const normalizeReservation = (snapshotDoc) => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    ...data,
    startHour: Number(data.startHour),
    endHour: Number(data.endHour),
    duration: Number(data.duration),
  };
};

export const subscribeToReservas = (onChange, onError) =>
  onSnapshot(
    collection(db, RESERVAS_COLLECTION),
    (snapshot) => {
      const nextReservas = snapshot.docs
        .map(normalizeReservation)
        .sort(sortReservationsByTime);

      onChange(nextReservas);
    },
    onError
  );

export const createReserva = async (payload) =>
  addDoc(collection(db, RESERVAS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const deleteReserva = async (reservationId) =>
  deleteDoc(doc(db, RESERVAS_COLLECTION, reservationId));
