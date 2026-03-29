<script lang="ts">
import ListingEditorForm from '$lib/components/host/listing-editor-form.svelte'
import { Button } from '$lib/components/ui/button'
import type { ActionData, PageData } from './$types'

const { data, form } = $props<{ data: PageData; form: ActionData }>()
</script>

<svelte:head>
	<title>Create Listing | Hidden Gems</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<p class="text-sm font-semibold uppercase tracking-[0.26em] text-ink-700/70">Host tools</p>
			<h1 class="mt-2 font-display text-4xl text-ink-950">Create a new listing</h1>
			<p class="mt-3 max-w-2xl text-base leading-7 text-ink-700">
				Add the details locals need to decide whether your stop belongs on their weekend route.
			</p>
		</div>
		<Button href="/host" variant="outline" class="rounded-full">Back to dashboard</Button>
	</div>

	<ListingEditorForm
		headline="Draft your next sale"
		description="Start with the essentials. You can save a draft or publish as soon as everything looks solid."
		values={form?.values ?? data.defaults}
		errors={form?.errors}
		submitLabel="Save draft"
		publishLabel="Publish listing"
	/>
</section>
