export interface Media {
  id: string;
  uploadedByUserId: string;
  bucket: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  etag: string | null;
  createdAt: Date;
}
