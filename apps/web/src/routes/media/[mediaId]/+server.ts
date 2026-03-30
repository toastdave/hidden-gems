import { getMediaById } from '$lib/server/listings'
import { getListingMediaObject } from '$lib/server/storage'
import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
	const media = await getMediaById(params.mediaId)

	if (!media) {
		throw error(404, 'Media not found')
	}

	try {
		const object = await getListingMediaObject(media.objectKey)
		const body = await object.Body?.transformToByteArray()

		if (!body) {
			throw error(404, 'Media not found')
		}

		return new Response(Buffer.from(body), {
			headers: {
				'content-type': object.ContentType || 'application/octet-stream',
				'cache-control': 'public, max-age=3600',
			},
		})
	} catch (err) {
		console.error('Failed to load media object', err)
		throw error(404, 'Media not found')
	}
}
