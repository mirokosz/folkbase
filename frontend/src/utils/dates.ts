import { Timestamp } from "firebase/firestore";

export const toDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Timestamp) return date.toDate();
  if (date instanceof Date) return date;
  return new Date(date);
};