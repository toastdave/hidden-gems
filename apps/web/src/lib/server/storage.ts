import { env } from '$env/dynamic/private'
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'

const globalForStorage = globalThis as typeof globalThis & {
	__hiddenGemsStorage?: S3Client
}

function getStorageClient() {
	if (globalForStorage.__hiddenGemsStorage) {
		return globalForStorage.__hiddenGemsStorage
	}

	const client = new S3Client({
		region: 'us-east-1',
		endpoint: env.S3_ENDPOINT || undefined,
		forcePathStyle: true,
		credentials:
			env.S3_ACCESS_KEY && env.S3_SECRET_KEY
				? {
						accessKeyId: env.S3_ACCESS_KEY,
						secretAccessKey: env.S3_SECRET_KEY,
					}
				: undefined,
	})

	globalForStorage.__hiddenGemsStorage = client
	return client
}

function getBucket() {
	if (!env.S3_BUCKET) {
		throw new Error('S3_BUCKET is required for media storage')
	}

	return env.S3_BUCKET
}

function getFileExtension(file: File) {
	const fileNameExtension = file.name.split('.').pop()?.toLowerCase()

	if (fileNameExtension) {
		return fileNameExtension.replace(/[^a-z0-9]/g, '') || 'bin'
	}

	const mimeExtension = file.type.split('/').pop()?.toLowerCase()
	return mimeExtension?.replace(/[^a-z0-9]/g, '') || 'bin'
}

export async function uploadListingMedia(options: {
	listingId: string
	mediaId: string
	file: File
}) {
	const bucket = getBucket()
	const extension = getFileExtension(options.file)
	const objectKey = `listings/${options.listingId}/${options.mediaId}.${extension}`
	const client = getStorageClient()

	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: objectKey,
			Body: new Uint8Array(await options.file.arrayBuffer()),
			ContentType: options.file.type || 'application/octet-stream',
		})
	)

	return {
		objectKey,
		url: `/media/${options.mediaId}`,
	}
}

export async function deleteListingMediaObject(objectKey: string) {
	const bucket = getBucket()
	const client = getStorageClient()

	await client.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: objectKey,
		})
	)
}

export async function getListingMediaObject(objectKey: string) {
	const bucket = getBucket()
	const client = getStorageClient()

	return client.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: objectKey,
		})
	)
}
