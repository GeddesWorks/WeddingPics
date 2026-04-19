import { Client, Storage, ID, Query } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const storage = new Storage(client);
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
export { ID, Query };

export function getFilePreviewUrl(fileId) {
  return storage.getFilePreview(BUCKET_ID, fileId, 800, 800);
}

export function getFileViewUrl(fileId) {
  return storage.getFileView(BUCKET_ID, fileId);
}
