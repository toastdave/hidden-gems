import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { getEnv } from './env'
import * as schema from './schema/index'

export type DatabaseSchema = typeof schema

export function createDbClient(databaseUrl = getEnv('DATABASE_URL')) {
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is required to create a database client')
	}

	return postgres(databaseUrl, {
		max: 10,
	})
}

export function createDb(databaseUrl = getEnv('DATABASE_URL')) {
	const client = createDbClient(databaseUrl)

	return drizzle(client, { schema })
}
