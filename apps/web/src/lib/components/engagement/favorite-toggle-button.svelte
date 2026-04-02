<script lang="ts">
import { Button, type ButtonSize } from '$lib/components/ui/button'
import { cn } from '$lib/utils'
import Heart from '@lucide/svelte/icons/heart'

const {
	class: className,
	initialActive = false,
	listingId,
	redirectTo,
	signedIn,
	size = 'sm',
}: {
	class?: string
	initialActive?: boolean
	listingId: string
	redirectTo: string
	signedIn: boolean
	size?: ButtonSize
} = $props()

let isFavorite = $state(false)
let isPending = $state(false)
let requestError = $state('')

$effect(() => {
	isFavorite = initialActive
})

const signInHref = $derived(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)

async function toggleFavorite() {
	if (!signedIn || isPending) {
		return
	}

	const previousValue = isFavorite
	isFavorite = !previousValue
	isPending = true
	requestError = ''

	const response = await fetch('/api/favorites', {
		method: previousValue ? 'DELETE' : 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({ listingId }),
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		isFavorite = previousValue
		requestError = payload?.message ?? 'Unable to update this saved listing right now.'
		isPending = false
		return
	}

	isFavorite = payload.isFavorite
	isPending = false
}
</script>

{#if signedIn}
	<Button
		type="button"
		variant="outline"
		{size}
		class={cn(
			'rounded-full',
			isFavorite &&
				'border-coral-500/30 bg-coral-500/10 text-coral-700 hover:bg-coral-500/15 hover:text-coral-700',
			className
		)}
		onclick={toggleFavorite}
		disabled={isPending}
		aria-pressed={isFavorite}
	>
		<Heart class={cn('size-4', isFavorite && 'fill-current')} />
		{#if isPending}
			{isFavorite ? 'Saving...' : 'Removing...'}
		{:else if isFavorite}
			Saved
		{:else}
			Save listing
		{/if}
	</Button>
{:else}
	<Button href={signInHref} variant="outline" {size} class={cn('rounded-full', className)}>
		<Heart class="size-4" />
		Save listing
	</Button>
{/if}

<span class="sr-only" aria-live="polite">{requestError}</span>
