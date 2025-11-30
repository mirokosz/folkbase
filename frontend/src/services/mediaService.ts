import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function uploadTeamFile(file: File, teamId: string, uploadedBy: string) {
  const path = `teams/${teamId}/media/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  const snap = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snap.ref);

  const doc = await addDoc(collection(db, "media"), {
    teamId,
    storagePath: path,
    url,
    fileName: file.name,
    type: file.type,
    uploadedBy,
    createdAt: serverTimestamp()
  });

  return { id: doc.id, url, path };
}
