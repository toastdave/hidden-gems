import { db } from '$lib/server/db'
import * as schema from '@hidden-gems/db/schema'
import { desc, eq } from 'drizzle-orm'

export type HostRecord = typeof schema.host.$inferSelect
export type HostListingRecord = typeof schema.listing.$inferSelect

export function slugifyHostName(value: string) {
	return value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64)
}

export async function getHostForUser(userId: string) {
	const rows = await db
		.select()
		.from(schema.host)
		.where(eq(schema.host.ownerUserId, userId))
		.limit(1)

	return rows[0] ?? null
}

export async function getHostBySlug(slug: string) {
	const rows = await db.select().from(schema.host).where(eq(schema.host.slug, slug)).limit(1)

	return rows[0] ?? null
}

export async function getHostListings(hostId: string) {
	return db
		.select()
		.from(schema.listing)
		.where(eq(schema.listing.hostId, hostId))
		.orderBy(desc(schema.listing.isFeatured), desc(schema.listing.startAt))
}
