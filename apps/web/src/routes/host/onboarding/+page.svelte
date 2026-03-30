<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import Compass from '@lucide/svelte/icons/compass'
import Sparkles from '@lucide/svelte/icons/sparkles'
import Store from '@lucide/svelte/icons/store'
import type { ActionData, PageData } from './$types'

const { data, form } = $props<{ data: PageData; form: ActionData }>()

const values = $derived(form?.values ?? data.defaults)
const errors = $derived(form?.errors ?? {})
</script>

<svelte:head>
	<title>Create Host Profile | Hidden Gems</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<CardTitle class="font-display text-3xl text-mist-100">Create your host identity</CardTitle>
				<CardDescription class="text-mist-100/75">
					Make it easy for locals to recognize your sales, follow your events, and trust what they will find.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 text-sm sm:px-6">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Store class="size-4" />
						One identity across every listing
					</p>
					<p class="mt-2 leading-6 text-mist-100/75">
						Your host page becomes the home base for future yard sales, estate edits, or market drops.
					</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Compass class="size-4" />
						Location context matters
					</p>
					<p class="mt-2 leading-6 text-mist-100/75">
						A clear neighborhood or city label helps nearby shoppers decide your stop belongs on their route.
					</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Sparkles class="size-4" />
						Keep it recognizable
					</p>
					<p class="mt-2 leading-6 text-mist-100/75">
						Use the same name people already know from signs, flyers, or your market booth.
					</p>
				</div>
			</CardContent>
		</Card>

		<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
			<CardHeader>
				<CardTitle class="font-display text-3xl text-ink-950">Welcome, {data.user.name}</CardTitle>
				<CardDescription class="text-base leading-7 text-ink-700">
					Set up your public host profile now so your first listing can feel complete the moment it goes live.
				</CardDescription>
			</CardHeader>
			<CardContent class="px-4 pb-5 sm:px-6">
				<form method="POST" class="grid gap-5">
					<div class="grid gap-5 md:grid-cols-2">
						<div class="grid gap-2">
							<label class="text-sm font-semibold text-ink-950" for="displayName">Host name</label>
							<Input id="displayName" name="displayName" value={values.displayName} required />
							{#if errors.displayName}
								<p class="text-sm text-coral-500">{errors.displayName}</p>
							{/if}
						</div>

						<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink-950" for="slug">Profile link</label>
						<div class="relative">
							<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-700/60">/hosts/</span>
							<Input id="slug" name="slug" value={values.slug} class="pl-16" />
						</div>
							{#if errors.slug}
								<p class="text-sm text-coral-500">{errors.slug}</p>
							{:else}
								<p class="text-sm text-ink-700/70">Lowercase letters, numbers, and dashes only.</p>
							{/if}
						</div>
					</div>

					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink-950" for="locationLabel">Neighborhood or city</label>
						<Input id="locationLabel" name="locationLabel" value={values.locationLabel} placeholder="East Austin, Cedar Park, South Congress..." />
						{#if errors.locationLabel}
							<p class="text-sm text-coral-500">{errors.locationLabel}</p>
						{:else}
							<p class="text-sm text-ink-700/70">This gives shoppers a quick sense of where your events happen.</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink-950" for="bio">Short bio</label>
						<textarea id="bio" name="bio" rows="5" class="min-h-32 rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" placeholder="What kinds of sales or finds can people expect from you?">{values.bio}</textarea>
						{#if errors.bio}
							<p class="text-sm text-coral-500">{errors.bio}</p>
						{:else}
							<p class="text-sm text-ink-700/70">A few clear lines are enough. Think recognizable, useful, and local.</p>
						{/if}
					</div>

					{#if errors.form}
						<p class="rounded-2xl border border-coral-500/20 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
							{errors.form}
						</p>
					{/if}

					<div class="flex flex-wrap items-center gap-3">
						<Button type="submit" class="rounded-full px-6">Create host profile</Button>
						<Button href="/" type="button" variant="outline" class="rounded-full">Back home</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</section>
