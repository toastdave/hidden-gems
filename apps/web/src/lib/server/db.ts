import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createDb } from '@hidden-gems/db'

const globalForDb = globalThis as typeof globalThis & {
	__hiddenGemsDb?: ReturnType<typeof createDb>
}

function readDatabaseUrlFromEnvFile() {
	const candidates = [
		resolve(process.cwd(), '.env'),
		resolve(process.cwd(), '../.env'),
		resolve(process.cwd(), '../../.env'),
	]

	for (const filePath of candidates) {
		if (!existsSync(filePath)) {
			continue
		}

		const match = readFileSync(filePath, 'utf8').match(/^DATABASE_URL=(.*)$/m)

		if (match?.[1]) {
			return match[1].trim()
		}
	}

	return undefined
}

function getDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL || readDatabaseUrlFromEnvFile()

	if (databaseUrl && !process.env.DATABASE_URL) {
		process.env.DATABASE_URL = databaseUrl
	}

	return databaseUrl
}

export const db = globalForDb.__hiddenGemsDb ?? createDb(getDatabaseUrl())

if (!globalForDb.__hiddenGemsDb) {
	globalForDb.__hiddenGemsDb = db
}
