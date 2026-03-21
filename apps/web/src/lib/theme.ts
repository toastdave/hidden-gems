import { browser } from '$app/environment'
import { readable } from 'svelte/store'

export type ThemeMode = 'light' | 'dark'

function getPreferredTheme(): ThemeMode {
	if (!browser) {
		return 'light'
	}

	if (document.documentElement.classList.contains('dark')) {
		return 'dark'
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = readable<ThemeMode>('light', (set) => {
	if (!browser) {
		return () => undefined
	}

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
	const observer = new MutationObserver(() => set(getPreferredTheme()))
	const handleChange = () => set(getPreferredTheme())

	set(getPreferredTheme())
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
	mediaQuery.addEventListener('change', handleChange)

	return () => {
		observer.disconnect()
		mediaQuery.removeEventListener('change', handleChange)
	}
})
