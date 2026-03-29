<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { authClient } from '$lib/auth-client'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import CalendarDays from '@lucide/svelte/icons/calendar-days'
import Compass from '@lucide/svelte/icons/compass'
import Store from '@lucide/svelte/icons/store'
import UserRound from '@lucide/svelte/icons/user-round'
import type { PageData } from './$types'

const { data } = $props<{ data: PageData }>()

let errorMessage = $state('')
let isSigningOut = $state(false)

async function signOut() {
	isSigningOut = true
	errorMessage = ''

	const result = await authClient.signOut()

	isSigningOut = false

	if (result.error) {
		errorMessage = result.error.message ?? 'Unable to sign out right now.'
		return
	}

	await invalidateAll()
	await goto('/')
}
</script>

<svelte:head>
	<title>Account | Hidden Gems</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
		<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			<CardHeader class="gap-3">
				<Badge class="bg-ink-950 text-mist-100">Account</Badge>
				<CardTitle class="font-display text-4xl text-ink-950">Hi, {data.user.name}.</CardTitle>
				<CardDescription class="max-w-2xl text-base leading-7 text-ink-700">
					Keep your account ready for saved finds, followed hosts, and a polished hosting presence when you are ready to publish.
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-4 px-4 pb-5 sm:grid-cols-2 sm:px-6">
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Email</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">{data.user.email}</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Status</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">
						{data.user.emailVerified ? 'Email verified' : 'Verify your email soon'}
					</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Host profile</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">
						{data.host ? data.host.displayName : 'Not set up yet'}
					</p>
				</div>
				<div class="rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4">
					<p class="text-xs uppercase tracking-[0.24em] text-ink-700/70">Session expires</p>
					<p class="mt-2 text-sm font-semibold text-ink-950">
						{new Date(data.session.expiresAt).toLocaleString()}
					</p>
				</div>
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<CardTitle class="font-display text-2xl text-mist-100">Your next move</CardTitle>
				<CardDescription class="text-mist-100/75">
					{#if data.host}
						Your host profile is ready. Review your dashboard and get ready to publish listings.
					{:else}
						Create a host profile to publish sales, pop-ups, and markets people can discover nearby.
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-mist-100/80">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<UserRound class="size-4" />
						Account ready
					</p>
					<p class="mt-2 leading-6">You can sign in across devices and keep your discovery activity in one place.</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-mist-100/80">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Store class="size-4" />
						Hosting path
					</p>
					<p class="mt-2 leading-6">
						{#if data.host}
							Your public host identity is live at /@{data.host.slug}.
						{:else}
							Set up a recognizable host name so shoppers trust what they are clicking into.
						{/if}
					</p>
				</div>
				<Button href={data.host ? '/host' : '/host/onboarding'} class="w-full rounded-full">
					{data.host ? 'Open host dashboard' : 'Create host profile'}
				</Button>
				<Button href="/" variant="secondary" class="w-full rounded-full">Back to discovery</Button>
				<Button variant="outline" class="w-full rounded-full border-white/20 bg-transparent text-mist-100 hover:bg-white/8 hover:text-mist-100" disabled={isSigningOut} onclick={signOut} type="button">
					{isSigningOut ? 'Signing out...' : 'Sign out'}
				</Button>

				{#if errorMessage}
					<p class="rounded-2xl border border-coral-500/20 bg-coral-500/10 px-4 py-3 text-sm text-coral-200">
						{errorMessage}
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-3">
		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
					<Compass class="size-5 text-coral-500" />
					Discovery ready
				</CardTitle>
			</CardHeader>
			<CardContent class="px-4 pb-5 text-sm leading-7 text-ink-700 sm:px-6">
				Browse nearby events, keep tabs on promising weekends, and use your account as the base for later saved activity.
			</CardContent>
		</Card>
		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
					<CalendarDays class="size-5 text-leaf-400" />
					Publishing next
				</CardTitle>
			</CardHeader>
			<CardContent class="px-4 pb-5 text-sm leading-7 text-ink-700 sm:px-6">
				The listing editor is the next step, so your account and host setup are ready before the publish flow lands.
			</CardContent>
		</Card>
		<Card class="border-white/80 bg-white/88 backdrop-blur">
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
					<Store class="size-5 text-ink-950" />
					Hosting focus
				</CardTitle>
			</CardHeader>
			<CardContent class="px-4 pb-5 text-sm leading-7 text-ink-700 sm:px-6">
				A clear host identity, a clean event title, and location confidence are the biggest levers for getting clicks.
			</CardContent>
		</Card>
	</div>
</section>
