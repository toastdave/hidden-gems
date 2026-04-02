<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import type { HostEditorErrors, HostEditorValues } from '$lib/server/host-editor'

const {
	values,
	errors = {},
	headline,
	description,
	submitLabel,
	secondaryHref = '/',
	secondaryLabel = 'Back home',
}: {
	values: HostEditorValues
	errors?: HostEditorErrors
	headline: string
	description: string
	submitLabel: string
	secondaryHref?: string
	secondaryLabel?: string
} = $props()

const fieldClass =
	'min-h-11 rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
</script>

<Card class="border-white/80 bg-white/88 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)] backdrop-blur">
	<CardHeader>
		<CardTitle class="font-display text-3xl text-ink-950">{headline}</CardTitle>
		<CardDescription class="text-base leading-7 text-ink-700">{description}</CardDescription>
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
						<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-700/60">
							/hosts/
						</span>
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
				<Input
					id="locationLabel"
					name="locationLabel"
					value={values.locationLabel}
					placeholder="East Austin, Cedar Park, South Congress..."
				/>
				{#if errors.locationLabel}
					<p class="text-sm text-coral-500">{errors.locationLabel}</p>
				{:else}
					<p class="text-sm text-ink-700/70">This gives shoppers a quick sense of where your events happen.</p>
				{/if}
			</div>

			<div class="grid gap-2">
				<label class="text-sm font-semibold text-ink-950" for="bio">Short bio</label>
				<textarea
					id="bio"
					name="bio"
					rows="5"
					class={`${fieldClass} min-h-32`}
					placeholder="What kinds of sales or finds can people expect from you?"
				>{values.bio}</textarea>
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
				<Button type="submit" class="rounded-full px-6">{submitLabel}</Button>
				<Button href={secondaryHref} type="button" variant="outline" class="rounded-full">
					{secondaryLabel}
				</Button>
			</div>
		</form>
	</CardContent>
</Card>
