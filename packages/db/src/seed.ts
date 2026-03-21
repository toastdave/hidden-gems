import { createDb } from './client'
import { plan } from './schema/index'

const db = createDb()

await db
	.insert(plan)
	.values([
		{
			id: 'free',
			slug: 'free',
			name: 'Free',
			monthlyPriceCents: 0,
			annualPriceCents: 0,
			featureFlags: {
				maxPhotos: 4,
				maxActiveListings: 1,
				maxAlerts: 3,
				featuredListings: false,
			},
		},
		{
			id: 'host-plus',
			slug: 'host-plus',
			name: 'Host Plus',
			monthlyPriceCents: 1200,
			annualPriceCents: 12000,
			featureFlags: {
				maxPhotos: 16,
				maxActiveListings: 10,
				maxAlerts: 15,
				featuredListings: true,
			},
		},
	])
	.onConflictDoNothing()

console.log('Seeded plans')
