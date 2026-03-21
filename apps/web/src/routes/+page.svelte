<script lang="ts">
import { siteConfig } from '$lib/config/site'

const epics = [
	'Platform foundation',
	'Authentication and accounts',
	'Host profiles',
	'Listings creation and management',
	'Discovery and search',
	'Media uploads',
	'Engagement',
	'Alerts and notifications',
	'Freemium billing',
	'Trust and safety',
	'Observability and operations',
]

const stack = [
	'SvelteKit monolith',
	'Bun workspaces + Bun SSR adapter',
	'Drizzle + Postgres',
	'shadcn-svelte + mapcn-svelte',
	'Better Auth + Polar',
	'Biome + mise + Docker Compose',
]
</script>

<svelte:head>
	<title>Hidden Gems</title>
	<meta
		name="description"
		content={siteConfig.description}
	/>
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
	<header class="flex flex-col gap-8 rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-[0_32px_120px_-48px_rgba(19,34,38,0.45)] backdrop-blur md:p-10">
		<div class="flex flex-wrap items-center gap-3 text-sm font-medium text-ink-700">
			<span class="rounded-full bg-ink-950 px-3 py-1 text-mist-100">Hidden Gems</span>
			<span class="rounded-full border border-ink-950/10 px-3 py-1">Local discovery</span>
			<span class="rounded-full border border-ink-950/10 px-3 py-1">Weekend planning</span>
		</div>

		<div class="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
			<div class="space-y-6">
				<p class="font-display text-sm uppercase tracking-[0.3em] text-coral-500">{siteConfig.tagline}</p>
				<h1 class="max-w-3xl font-display text-5xl leading-none tracking-tight text-ink-950 sm:text-6xl">
					A home base for yard sales, flea markets, and hidden gems this weekend.
				</h1>
				<p class="max-w-2xl text-lg leading-8 text-ink-700">
					This base scaffold locks the stack, containerizes the app, wires the database
					package, and sets up the planning docs for the full MVP build.
				</p>
			</div>

			<div class="rounded-[1.5rem] border border-ink-950/10 bg-ink-950 p-6 text-mist-100">
				<p class="text-sm uppercase tracking-[0.28em] text-sun-300">Core loop</p>
				<ul class="mt-4 space-y-3 text-sm leading-7 text-mist-100/90">
					<li>Hosts can create and publish an event in minutes.</li>
					<li>Buyers can browse a trustworthy, map-heavy local feed.</li>
					<li>Premium plans unlock more visibility and better host tooling.</li>
				</ul>
			</div>
		</div>
	</header>

	<section class="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
		<div class="rounded-[1.75rem] border border-ink-950/10 bg-white/80 p-7 shadow-[0_24px_80px_-56px_rgba(19,34,38,0.6)] backdrop-blur">
			<p class="text-sm uppercase tracking-[0.28em] text-leaf-400">Locked stack</p>
			<ul class="mt-5 grid gap-3 text-sm text-ink-900 sm:grid-cols-2">
				{#each stack as item}
					<li class="rounded-2xl border border-ink-950/8 bg-mist-100/80 px-4 py-3">
						{item}
					</li>
				{/each}
			</ul>
		</div>

		<div class="rounded-[1.75rem] border border-ink-950/10 bg-white/80 p-7 shadow-[0_24px_80px_-56px_rgba(19,34,38,0.6)] backdrop-blur">
			<p class="text-sm uppercase tracking-[0.28em] text-coral-500">Planning coverage</p>
			<div class="mt-5 grid gap-3 text-sm text-ink-900 sm:grid-cols-2">
				{#each epics as epic}
					<div class="rounded-2xl border border-ink-950/8 bg-white px-4 py-3">{epic}</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="mt-8 rounded-[1.75rem] border border-dashed border-ink-950/15 bg-white/60 p-7 text-sm leading-7 text-ink-700 backdrop-blur">
		<p class="font-display text-lg text-ink-950">What this scaffold already includes</p>
		<div class="mt-4 grid gap-4 md:grid-cols-3">
			<div class="rounded-2xl bg-white/80 p-5">
				<p class="font-semibold text-ink-950">App shell</p>
				<p class="mt-2">SvelteKit, Bun-native SSR, Tailwind v4, and a branded landing page.</p>
			</div>
			<div class="rounded-2xl bg-white/80 p-5">
				<p class="font-semibold text-ink-950">Platform foundation</p>
				<p class="mt-2">Bun workspaces, Drizzle package, Docker Compose, and mise task runners.</p>
			</div>
			<div class="rounded-2xl bg-white/80 p-5">
				<p class="font-semibold text-ink-950">Product planning</p>
				<p class="mt-2">Epic PRDs and implementation tasks for the MVP roadmap in `docs/prds`.</p>
			</div>
		</div>
	</section>
</div>
