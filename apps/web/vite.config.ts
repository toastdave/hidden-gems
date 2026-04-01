import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

function createClientManualChunks(id: string) {
	if (!id.includes('node_modules')) {
		return
	}

	if (id.includes('maplibre-gl')) {
		return 'vendor-map'
	}

	if (id.includes('better-auth')) {
		return 'vendor-auth'
	}

	if (id.includes('@lucide/svelte')) {
		return 'vendor-icons'
	}

	if (
		id.includes('bits-ui') ||
		id.includes('@internationalized/date') ||
		id.includes('tailwind-variants') ||
		id.includes('tailwind-merge') ||
		id.includes('clsx')
	) {
		return 'vendor-ui'
	}
}

export default defineConfig(({ isSsrBuild }) => ({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: isSsrBuild
				? undefined
				: {
						manualChunks: createClientManualChunks,
					},
		},
	},
	server: {
		host: true,
		allowedHosts: ['.ts.net'],
		port: 1101,
	},
}))
