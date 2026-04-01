<script lang="ts">
import { browser } from '$app/environment'
import { Input } from '$lib/components/ui/input'
import { cn } from '$lib/utils'

type LocationSuggestion = {
	label: string
	latitude: number
	longitude: number
}

const {
	name = 'place',
	nearName = 'near',
	latitudeName = 'lat',
	longitudeName = 'lng',
	value = '',
	latitude = '',
	longitude = '',
	presetNear = '',
	proximityLatitude,
	proximityLongitude,
	placeholder = 'Search city, ZIP code, or neighborhood',
	class: className,
}: {
	name?: string
	nearName?: string
	latitudeName?: string
	longitudeName?: string
	value?: string
	latitude?: string
	longitude?: string
	presetNear?: string
	proximityLatitude?: number
	proximityLongitude?: number
	placeholder?: string
	class?: string
} = $props()

const listboxId = `location-suggestions-${Math.random().toString(36).slice(2, 9)}`

let searchValue = $state('')
let selectedLatitude = $state('')
let selectedLongitude = $state('')
let suggestions = $state<LocationSuggestion[]>([])
let isOpen = $state(false)
let isLoading = $state(false)
let highlightedIndex = $state(-1)

$effect(() => {
	searchValue = value
	selectedLatitude = latitude
	selectedLongitude = longitude
	if (selectedLatitude && selectedLongitude) {
		suggestions = []
		isOpen = false
		highlightedIndex = -1
	}
})

function clearSelection() {
	selectedLatitude = ''
	selectedLongitude = ''
}

function selectSuggestion(suggestion: LocationSuggestion) {
	searchValue = suggestion.label
	selectedLatitude = String(suggestion.latitude)
	selectedLongitude = String(suggestion.longitude)
	suggestions = []
	isOpen = false
	highlightedIndex = -1
}

function handleInput() {
	clearSelection()
}

function handleKeydown(event: KeyboardEvent) {
	if (!isOpen || suggestions.length === 0) {
		return
	}

	if (event.key === 'ArrowDown') {
		event.preventDefault()
		highlightedIndex = (highlightedIndex + 1 + suggestions.length) % suggestions.length
		return
	}

	if (event.key === 'ArrowUp') {
		event.preventDefault()
		highlightedIndex = highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1
		return
	}

	if (event.key === 'Enter' && highlightedIndex >= 0) {
		event.preventDefault()
		const suggestion = suggestions[highlightedIndex]

		if (suggestion) {
			selectSuggestion(suggestion)
		}
		return
	}

	if (event.key === 'Escape') {
		isOpen = false
		highlightedIndex = -1
	}
}

$effect(() => {
	if (!browser) {
		return
	}

	const query = searchValue.trim()

	if (selectedLatitude && selectedLongitude) {
		suggestions = []
		isOpen = false
		highlightedIndex = -1
		isLoading = false
		return
	}

	if (query.length < 2) {
		suggestions = []
		isOpen = false
		highlightedIndex = -1
		isLoading = false
		return
	}

	const controller = new AbortController()
	const timeoutId = window.setTimeout(async () => {
		isLoading = true

		try {
			const params = new URLSearchParams({ q: query })

			if (Number.isFinite(proximityLatitude) && Number.isFinite(proximityLongitude)) {
				params.set('lat', String(proximityLatitude))
				params.set('lng', String(proximityLongitude))
			}

			const response = await fetch(`/api/discovery/location-search?${params.toString()}`, {
				signal: controller.signal,
			})

			if (!response.ok) {
				suggestions = []
				isOpen = false
				highlightedIndex = -1
				return
			}

			const payload = (await response.json()) as { suggestions?: LocationSuggestion[] }
			suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : []
			isOpen = suggestions.length > 0
			highlightedIndex = suggestions.length > 0 ? 0 : -1
		} catch (error) {
			if (!controller.signal.aborted) {
				console.error('Location autocomplete failed', error)
				suggestions = []
				isOpen = false
				highlightedIndex = -1
			}
		} finally {
			if (!controller.signal.aborted) {
				isLoading = false
			}
		}
	}, 180)

	return () => {
		controller.abort()
		window.clearTimeout(timeoutId)
	}
})
</script>

<div class="relative">
	<input type="hidden" name={nearName} value={searchValue.trim() ? '' : presetNear} />
	<input type="hidden" name={latitudeName} value={selectedLatitude} />
	<input type="hidden" name={longitudeName} value={selectedLongitude} />
	<Input
		{name}
		bind:value={searchValue}
		placeholder={placeholder}
		autocomplete="off"
		spellcheck={false}
		class={cn(className, isLoading && 'pr-12')}
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={isOpen}
		aria-controls={listboxId}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onfocus={() => {
			if (suggestions.length > 0) {
				isOpen = true
			}
		}}
		onblur={() => {
			window.setTimeout(() => {
				isOpen = false
			}, 120)
		}}
	/>

	{#if isLoading}
		<div class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-ink-700/70">
			Searching
		</div>
	{/if}

	{#if isOpen}
		<div
			id={listboxId}
			role="listbox"
			class="absolute z-20 mt-2 w-full overflow-hidden rounded-[1.25rem] border border-white/90 bg-white/96 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur"
		>
			{#each suggestions as suggestion, index (suggestion.label)}
				<button
					type="button"
					role="option"
					aria-selected={index === highlightedIndex}
					class={cn(
						'flex w-full items-start rounded-2xl px-3 py-2.5 text-left text-sm text-ink-700 transition-colors',
						index === highlightedIndex ? 'bg-mist-100 text-ink-950' : 'hover:bg-mist-100/80'
					)}
					onmousedown={(event) => {
						event.preventDefault()
					}}
					onclick={() => {
						selectSuggestion(suggestion)
					}}
				>
					{suggestion.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
