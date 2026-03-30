<script lang="ts">
import ListingEditorForm from '$lib/components/host/listing-editor-form.svelte'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import Image from '@lucide/svelte/icons/image'
import Sparkles from '@lucide/svelte/icons/sparkles'
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
			<Button href={`/sale/${data.listing.slug}`} variant="outline" class="rounded-full">View public page</Button>
			<Button href="/" class="rounded-full" variant="secondary">See discovery</Button>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
		<ListingEditorForm
			headline={data.listing.title}
			description="Update anything shoppers would care about before they head your way: timing, location confidence, and what is worth showing up for."
			values={form?.values ?? data.defaults}
			errors={form?.errors}
			submitLabel="Save changes"
			publishLabel={data.listing.status === 'published' ? 'Update published listing' : 'Publish listing'}
		/>

		<div class="space-y-6">
			<Card class="border-white/80 bg-white/88 backdrop-blur">
				<CardHeader>
					<div class="flex flex-wrap items-center gap-2">
						<CardTitle class="flex items-center gap-2 text-xl text-ink-950">
							<Image class="size-5 text-coral-500" />
							Listing photos
						</CardTitle>
						{#if data.mediaUpdated}
							<Badge variant="outline">Gallery updated</Badge>
						{/if}
					</div>
					<CardDescription>
						Add a few crisp images so people can tell at a glance whether this stop is worth it.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 px-4 pb-5 sm:px-6">
					<form method="POST" action="?/uploadMedia" enctype="multipart/form-data" class="grid gap-3">
						<input type="file" name="media" accept="image/*" class="rounded-2xl border border-ink-950/10 bg-mist-100/70 px-3 py-3 text-sm text-ink-700" />
						<input type="text" name="altText" class="min-h-11 rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none" placeholder="Short caption or alt text (optional)" />
						{#if form?.mediaError}
							<p class="text-sm text-coral-500">{form.mediaError}</p>
						{/if}
						<Button type="submit" class="w-full rounded-full">Upload image</Button>
					</form>

					{#if data.media.length === 0}
						<div class="rounded-2xl border border-dashed border-ink-950/15 bg-mist-100/70 p-4 text-sm leading-6 text-ink-700">
							No images yet. Add at least one strong photo before you promote this listing heavily.
						</div>
					{:else}
						<div class="space-y-3">
							{#each data.media as media, index}
								<div class="overflow-hidden rounded-2xl border border-ink-950/8 bg-white shadow-sm">
									<img src={media.url} alt={media.altText || data.listing.title} class="h-40 w-full object-cover" />
									<div class="space-y-3 p-4">
										<div class="flex items-center justify-between gap-3">
											<div>
												<p class="text-sm font-semibold text-ink-950">Image {index + 1}</p>
												<p class="text-sm text-ink-700">{media.altText || 'No caption yet'}</p>
											</div>
											{#if index === 0}
												<Badge class="bg-ink-950 text-mist-100">
													<Sparkles class="mr-1 size-3.5" />
													Cover
												</Badge>
											{/if}
										</div>
										<div class="flex flex-wrap gap-2">
											{#if index !== 0}
												<form method="POST" action="?/setCover">
													<input type="hidden" name="mediaId" value={media.id} />
													<Button type="submit" size="sm" variant="outline" class="rounded-full">Make cover</Button>
												</form>
											{/if}
											<form method="POST" action="?/deleteMedia">
												<input type="hidden" name="mediaId" value={media.id} />
												<Button type="submit" size="sm" variant="ghost" class="rounded-full text-coral-500 hover:text-coral-500">Remove</Button>
											</form>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</section>
