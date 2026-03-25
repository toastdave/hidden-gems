import { existsSync, readFileSync } from 'node:fs'

const rootEnvPath = new URL('../../../.env', import.meta.url)

let cachedEnv: Record<string, string> | null = null

function stripQuotes(value: string) {
	const trimmed = value.trim()

	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1)
	}

	return trimmed
}

function readRootEnv() {
	if (cachedEnv) {
		return cachedEnv
	}

	const values: Record<string, string> = {}

	if (!existsSync(rootEnvPath)) {
		cachedEnv = values
		return values
	}

	const lines = readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)

	for (const line of lines) {
		const trimmed = line.trim()

		if (!trimmed || trimmed.startsWith('#')) {
			continue
		}

		const separatorIndex = trimmed.indexOf('=')

		if (separatorIndex === -1) {
			continue
		}

		const key = trimmed
			.slice(0, separatorIndex)
			.trim()
			.replace(/^export\s+/, '')
		const value = stripQuotes(trimmed.slice(separatorIndex + 1))

		if (key) {
			values[key] = value
		}
	}

	cachedEnv = values
	return values
}

export function getEnv(name: string) {
	const value = process.env[name] ?? readRootEnv()[name]

	if (value && !process.env[name]) {
		process.env[name] = value
	}

	return value
}
