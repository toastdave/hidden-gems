<script lang="ts">
import { Button } from '$lib/components/ui/button'
import BellPlus from '@lucide/svelte/icons/bell-plus'
import BookmarkCheck from '@lucide/svelte/icons/bookmark-check'

const {
	eventType = '',
	initialSaved = false,
	latitude,
	locationLabel,
	longitude,
	radiusMiles,
	redirectTo,
	signedIn,
	tag = '',
}: {
	eventType?: string
	initialSaved?: boolean
	latitude: number
	locationLabel: string
	longitude: number
	radiusMiles: number
	redirectTo: string
	signedIn: boolean
	tag?: string
} = $props()

let didSave = $state(false)
let isPending = $state(false)
let requestError = $state('')

const isSaved = $derived(initialSaved || didSave)
const signInHref = $derived(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)

async function saveSearch() {
	if (!signedIn || isPending || isSaved) {
		return
	}

	isPending = true
	requestError = ''

	const response = await fetch('/api/search-alerts', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			eventType,
			latitude,
			locationLabel,
			longitude,
			radiusMiles,
			tag,
		}),
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		requestError = payload?.message ?? 'Unable to save this search right now.'
		isPending = false
		return
	}

	didSave = true
	isPending = false
}
</script>

{#if signedIn}
	{#if isSaved}
		<Button href="/account" variant="outline" class="w-full rounded-full">
			<BookmarkCheck class="size-4" />
			Search saved
		</Button>
	{:else}
		<Button type="button" onclick={saveSearch} disabled={isPending} class="w-full rounded-full">
			<BellPlus class="size-4" />
			{isPending ? 'Saving search...' : 'Save this search'}
		</Button>
	{/if}
{:else}
	<Button href={signInHref} variant="outline" class="w-full rounded-full">
		<BellPlus class="size-4" />
		Sign in to save this search
	</Button>
{/if}

<span class="sr-only" aria-live="polite">{requestError}</span>
