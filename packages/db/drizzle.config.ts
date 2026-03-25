import { defineConfig } from 'drizzle-kit'
import { getEnv } from './src/env'

const databaseUrl = getEnv('DATABASE_URL')

if (!databaseUrl) {
	throw new Error('DATABASE_URL is required to run Drizzle commands')
}

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema/index.ts',
	out: './drizzle',
	dbCredentials: {
		url: databaseUrl,
	},
	verbose: true,
	strict: true,
})
