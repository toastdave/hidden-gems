<script lang="ts">
import ListingEditorForm from '$lib/components/host/listing-editor-form.svelte'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import type { ActionData, PageData } from './$types'

const { data, form } = $props<{ data: PageData; form: ActionData }>()
</script>

<svelte:head>
	<title>Edit Listing | Hidden Gems</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<Badge class="bg-ink-950 text-mist-100">{data.listing.status}</Badge>
				{#if data.saved}
					<Badge variant="outline">Saved just now</Badge>
				{/if}
			</div>
			<h1 class="mt-2 font-display text-4xl text-ink-950">Edit listing</h1>
			<p class="mt-3 max-w-2xl text-base leading-7 text-ink-700">
				Tighten the details, save a draft, or keep the listing live with updated information.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href="/host" variant="outline" class="rounded-full">Back to dashboard</Button>
			<Button href="/" class="rounded-full" variant="secondary">See discovery</Button>
		</div>
	</div>

	<ListingEditorForm
		headline={data.listing.title}
		description="Update anything shoppers would care about before they head your way: timing, location confidence, and what is worth showing up for."
		values={form?.values ?? data.defaults}
		errors={form?.errors}
		submitLabel="Save changes"
		publishLabel={data.listing.status === 'published' ? 'Update published listing' : 'Publish listing'}
	/>
</section>
