import { S3Client } from "bun";

type StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  endpoint?: string;
  presignEndpoint?: string;
  publicBaseUrl?: string;
};

let internalClient: S3Client | null = null;
let presignClient: S3Client | null = null;

function readStorageConfig(): StorageConfig | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    presignEndpoint: process.env.S3_PRESIGN_ENDPOINT,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  };
}

function pathEncode(objectKey: string) {
  return objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getInternalClient() {
  if (internalClient) {
    return internalClient;
  }

  const config = readStorageConfig();
  if (!config) {
    return null;
  }

  internalClient = new S3Client({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    region: config.region,
    endpoint: config.endpoint,
  });

  return internalClient;
}

function getPresignClient() {
  if (presignClient) {
    return presignClient;
  }

  const config = readStorageConfig();
  if (!config) {
    return null;
  }

  presignClient = new S3Client({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucket,
    region: config.region,
    endpoint: config.presignEndpoint ?? config.endpoint,
  });

  return presignClient;
}

export function storageEnabled() {
  return readStorageConfig() !== null;
}

export function getStorageBucket() {
  return readStorageConfig()?.bucket ?? null;
}

export function buildPublicMediaUrl(objectKey: string) {
  const config = readStorageConfig();
  if (!config) {
    return null;
  }

  const base = (config.publicBaseUrl ?? config.presignEndpoint ?? config.endpoint)?.replace(
    /\/$/,
    "",
  );
  if (!base) {
    return null;
  }

  return `${base}/${encodeURIComponent(config.bucket)}/${pathEncode(objectKey)}`;
}

export function presignUploadUrl(objectKey: string, contentType: string, expiresIn = 600) {
  const client = getPresignClient();
  if (!client) {
    return null;
  }

  return client.presign(objectKey, {
    method: "PUT",
    expiresIn,
    type: contentType,
  });
}

export async function statObject(objectKey: string) {
  const client = getInternalClient();
  if (!client) {
    return null;
  }
  return client.stat(objectKey);
}

export async function objectExists(objectKey: string) {
  const client = getInternalClient();
  if (!client) {
    return false;
  }
  return client.exists(objectKey);
}

export async function deleteObject(objectKey: string) {
  const client = getInternalClient();
  if (!client) {
    return;
  }
  await client.delete(objectKey);
}
