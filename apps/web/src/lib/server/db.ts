import { env } from '$env/dynamic/private'
import { createDb } from '@hidden-gems/db'

const globalForDb = globalThis as typeof globalThis & {
	__hiddenGemsDb?: ReturnType<typeof createDb>
}

export const db = globalForDb.__hiddenGemsDb ?? createDb(env.DATABASE_URL)

if (!globalForDb.__hiddenGemsDb) {
	globalForDb.__hiddenGemsDb = db
}
