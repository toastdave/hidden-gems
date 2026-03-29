<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { type DiscoveryEventType, getEventTypeLabel } from '$lib/content/discovery'
import type { ListingEditorValues, ListingFormErrors } from '$lib/server/listings'

type EventOption = { value: DiscoveryEventType | 'other'; label: string }

const eventOptions: EventOption[] = [
	{ value: 'yard_sale', label: getEventTypeLabel('yard_sale') },
	{ value: 'garage_sale', label: getEventTypeLabel('garage_sale') },
	{ value: 'estate_sale', label: getEventTypeLabel('estate_sale') },
	{ value: 'flea_market', label: getEventTypeLabel('flea_market') },
	{ value: 'pop_up_market', label: getEventTypeLabel('pop_up_market') },
	{ value: 'community_sale', label: getEventTypeLabel('community_sale') },
	{ value: 'other', label: 'Other local event' },
]

const {
	values,
	errors = {},
	headline,
	description,
	submitLabel = 'Save draft',
	publishLabel = 'Publish listing',
}: {
	values: ListingEditorValues
	errors?: ListingFormErrors
	headline: string
	description: string
	submitLabel?: string
	publishLabel?: string
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
				<div class="grid gap-2 md:col-span-2">
					<label class="text-sm font-semibold text-ink-950" for="title">Listing title</label>
					<Input id="title" name="title" value={values.title} placeholder="Saturday neighborhood sale with records and patio finds" required />
					{#if errors.title}
						<p class="text-sm text-coral-500">{errors.title}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="slug">Listing link</label>
					<div class="relative">
						<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-700/60">/sale/</span>
						<Input id="slug" name="slug" value={values.slug} class="pl-13" />
					</div>
					{#if errors.slug}
						<p class="text-sm text-coral-500">{errors.slug}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="eventType">Event type</label>
					<select id="eventType" name="eventType" class={fieldClass}>
						{#each eventOptions as option}
							<option value={option.value} selected={option.value === values.eventType}>
								{option.label}
							</option>
						{/each}
					</select>
					{#if errors.eventType}
						<p class="text-sm text-coral-500">{errors.eventType}</p>
					{/if}
				</div>

				<div class="grid gap-2 md:col-span-2">
					<label class="text-sm font-semibold text-ink-950" for="description">What should shoppers know?</label>
					<textarea id="description" name="description" rows="6" class={`${fieldClass} min-h-36`} placeholder="Call out standout items, best time to arrive, and any practical notes that make the stop worthwhile.">{values.description}</textarea>
					{#if errors.description}
						<p class="text-sm text-coral-500">{errors.description}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="startAt">Start date and time</label>
					<Input id="startAt" name="startAt" type="datetime-local" value={values.startAt} required />
					{#if errors.startAt}
						<p class="text-sm text-coral-500">{errors.startAt}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="endAt">End date and time</label>
					<Input id="endAt" name="endAt" type="datetime-local" value={values.endAt} />
					{#if errors.endAt}
						<p class="text-sm text-coral-500">{errors.endAt}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="timezone">Timezone</label>
					<Input id="timezone" name="timezone" value={values.timezone} placeholder="America/Chicago" />
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="priceSummary">Price summary</label>
					<Input id="priceSummary" name="priceSummary" value={values.priceSummary} placeholder="Most items under $20" />
				</div>

				<div class="grid gap-2 md:col-span-2">
					<label class="text-sm font-semibold text-ink-950" for="locationLabel">Neighborhood or stop description</label>
					<Input id="locationLabel" name="locationLabel" value={values.locationLabel} placeholder="Maplewood Ave & E 38 1/2 St" required />
					{#if errors.locationLabel}
						<p class="text-sm text-coral-500">{errors.locationLabel}</p>
					{/if}
				</div>

				<div class="grid gap-2 md:col-span-2">
					<label class="text-sm font-semibold text-ink-950" for="addressLine1">Street address</label>
					<Input id="addressLine1" name="addressLine1" value={values.addressLine1} placeholder="1234 Elm Street" />
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="addressLine2">Address line 2</label>
					<Input id="addressLine2" name="addressLine2" value={values.addressLine2} placeholder="Suite, gate code, or landmark" />
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="city">City</label>
					<Input id="city" name="city" value={values.city} placeholder="Austin" required />
					{#if errors.city}
						<p class="text-sm text-coral-500">{errors.city}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="region">State or region</label>
					<Input id="region" name="region" value={values.region} placeholder="TX" required />
					{#if errors.region}
						<p class="text-sm text-coral-500">{errors.region}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="postalCode">Postal code</label>
					<Input id="postalCode" name="postalCode" value={values.postalCode} placeholder="78722" />
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="countryCode">Country code</label>
					<Input id="countryCode" name="countryCode" value={values.countryCode} placeholder="US" />
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="latitude">Latitude</label>
					<Input id="latitude" name="latitude" value={values.latitude} placeholder="30.288200" required />
					{#if errors.latitude}
						<p class="text-sm text-coral-500">{errors.latitude}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label class="text-sm font-semibold text-ink-950" for="longitude">Longitude</label>
					<Input id="longitude" name="longitude" value={values.longitude} placeholder="-97.718400" required />
					{#if errors.longitude}
						<p class="text-sm text-coral-500">{errors.longitude}</p>
					{/if}
				</div>

				<div class="grid gap-2 md:col-span-2">
					<label class="text-sm font-semibold text-ink-950" for="tags">Searchable tags</label>
					<Input id="tags" name="tags" value={values.tags} placeholder="records, furniture, tools" />
					<p class="text-sm text-ink-700/70">Use a few comma-separated tags shoppers would naturally search for.</p>
				</div>
			</div>

			<label class="flex items-start gap-3 rounded-2xl border border-ink-950/8 bg-mist-100/70 p-4 text-sm text-ink-700">
				<input type="checkbox" name="isFeatured" checked={values.isFeatured} class="mt-1 size-4 rounded border-input text-ink-950" />
				<span>
					<span class="block font-semibold text-ink-950">Featured treatment</span>
					Use this when the event has enough depth, inventory, or community pull to anchor a weekend route.
				</span>
			</label>

			{#if errors.form}
				<p class="rounded-2xl border border-coral-500/20 bg-coral-500/10 px-4 py-3 text-sm text-coral-500">
					{errors.form}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				<Button type="submit" name="intent" value="draft" variant="outline" class="rounded-full px-6">
					{submitLabel}
				</Button>
				<Button type="submit" name="intent" value="publish" class="rounded-full px-6">
					{publishLabel}
				</Button>
			</div>
		</form>
	</CardContent>
</Card>
