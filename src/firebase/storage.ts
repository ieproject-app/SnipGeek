"use client";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { initializeFirebase } from "@/firebase";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload.
 * @param path The path in storage (e.g., 'articles/hero.jpg').
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const { firebaseApp } = initializeFirebase();
  const storage = getStorage(firebaseApp ?? undefined);
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      null,
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      },
    );
  });
}

/**
 * Deletes a file from Firebase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const { firebaseApp } = initializeFirebase();
  const storage = getStorage(firebaseApp ?? undefined);
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file from storage:", error);
  }
}
