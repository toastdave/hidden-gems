<script lang="ts">
import HostProfileForm from '$lib/components/host/host-profile-form.svelte'
import { Badge } from '$lib/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import Compass from '@lucide/svelte/icons/compass'
import ShieldCheck from '@lucide/svelte/icons/shield-check'
import type { ActionData, PageData } from './$types'

const { data, form } = $props<{ data: PageData; form: ActionData }>()
</script>

<svelte:head>
	<title>Edit Host Profile | Hidden Gems</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
		<Card class="border-white/80 bg-ink-950 text-mist-100 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.55)]">
			<CardHeader>
				<div class="flex flex-wrap items-center gap-2">
					<Badge class="bg-white/10 text-mist-100">Host profile</Badge>
					{#if data.saved}
						<Badge variant="outline" class="border-white/20 text-mist-100">Saved just now</Badge>
					{/if}
				</div>
				<CardTitle class="font-display text-3xl text-mist-100">Keep your public identity polished</CardTitle>
				<CardDescription class="text-mist-100/75">
					Update the details buyers use to recognize your listings, trust your page, and follow your next stop.
				</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4 px-4 pb-5 text-sm sm:px-6">
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<ShieldCheck class="size-4" />
						Trust starts here
					</p>
					<p class="mt-2 leading-6 text-mist-100/75">
						A steady host name and location cue make repeat shoppers more confident when they tap into a listing.
					</p>
				</div>
				<div class="rounded-2xl border border-white/10 bg-white/6 p-4">
					<p class="flex items-center gap-2 font-semibold text-mist-100">
						<Compass class="size-4" />
						Separate from listing edits
					</p>
					<p class="mt-2 leading-6 text-mist-100/75">
						Refresh your profile without changing any live event details, gallery order, or publish state.
					</p>
				</div>
			</CardContent>
		</Card>

		<HostProfileForm
			headline="Edit your host profile"
			description="Keep your public page current so every listing feels more trustworthy the moment someone opens it."
			values={form?.values ?? data.defaults}
			errors={form?.errors}
			submitLabel="Save profile"
			secondaryHref="/host"
			secondaryLabel="Back to dashboard"
		/>
	</div>
</section>
