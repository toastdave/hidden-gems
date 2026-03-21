import type { ThemeMode } from '$lib/theme'

export function resolveMapTheme({
	explicitTheme,
	ambientTheme,
}: {
	explicitTheme?: ThemeMode
	ambientTheme: ThemeMode
}) {
	return explicitTheme ?? ambientTheme
}
