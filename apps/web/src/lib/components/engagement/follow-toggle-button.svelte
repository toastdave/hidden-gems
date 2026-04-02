<script lang="ts">
import { Button, type ButtonSize } from '$lib/components/ui/button'
import { cn } from '$lib/utils'
import UserPlus from '@lucide/svelte/icons/user-plus'
import Users from '@lucide/svelte/icons/users'

const {
	class: className,
	hostId,
	initialActive = false,
	redirectTo,
	signedIn,
	size = 'sm',
}: {
	class?: string
	hostId: string
	initialActive?: boolean
	redirectTo: string
	signedIn: boolean
	size?: ButtonSize
} = $props()

let isFollowing = $state(false)
let isPending = $state(false)
let requestError = $state('')

$effect(() => {
	isFollowing = initialActive
})

const signInHref = $derived(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)

async function toggleFollow() {
	if (!signedIn || isPending) {
		return
	}

	const previousValue = isFollowing
	isFollowing = !previousValue
	isPending = true
	requestError = ''

	const response = await fetch('/api/follows', {
		method: previousValue ? 'DELETE' : 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({ hostId }),
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok || !payload?.ok) {
		isFollowing = previousValue
		requestError = payload?.message ?? 'Unable to update this followed host right now.'
		isPending = false
		return
	}

	isFollowing = payload.isFollowing
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
			isFollowing &&
				'border-leaf-400/40 bg-leaf-400/12 text-leaf-700 hover:bg-leaf-400/18 hover:text-leaf-700',
			className
		)}
		onclick={toggleFollow}
		disabled={isPending}
		aria-pressed={isFollowing}
	>
		{#if isFollowing}
			<Users class="size-4" />
		{:else}
			<UserPlus class="size-4" />
		{/if}
		{#if isPending}
			{isFollowing ? 'Following...' : 'Updating...'}
		{:else if isFollowing}
			Following
		{:else}
			Follow host
		{/if}
	</Button>
{:else}
	<Button href={signInHref} variant="outline" {size} class={cn('rounded-full', className)}>
		<UserPlus class="size-4" />
		Follow host
	</Button>
{/if}

<span class="sr-only" aria-live="polite">{requestError}</span>
