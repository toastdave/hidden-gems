import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'

export const listingTypeEnum = pgEnum('listing_type', [
	'yard_sale',
	'garage_sale',
	'estate_sale',
	'flea_market',
	'pop_up_market',
	'community_sale',
	'other',
])

export const listingStatusEnum = pgEnum('listing_status', [
	'draft',
	'published',
	'cancelled',
	'archived',
])

export const entitlementStatusEnum = pgEnum('entitlement_status', [
	'free',
	'trialing',
	'active',
	'past_due',
	'cancelled',
])

export const reportStatusEnum = pgEnum('report_status', [
	'open',
	'reviewing',
	'actioned',
	'dismissed',
])

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(table) => [uniqueIndex('session_token_idx').on(table.token)]
)

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const host = pgTable(
	'host',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		ownerUserId: text('owner_user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		slug: varchar('slug', { length: 64 }).notNull().unique(),
		displayName: varchar('display_name', { length: 120 }).notNull(),
		bio: text('bio'),
		avatarUrl: text('avatar_url'),
		locationLabel: varchar('location_label', { length: 120 }),
		isVerified: boolean('is_verified').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('host_owner_idx').on(table.ownerUserId)]
)

export const listing = pgTable(
	'listing',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		hostId: uuid('host_id')
			.notNull()
			.references(() => host.id, { onDelete: 'cascade' }),
		slug: varchar('slug', { length: 80 }).notNull().unique(),
		title: varchar('title', { length: 140 }).notNull(),
		description: text('description'),
		eventType: listingTypeEnum('event_type').notNull(),
		status: listingStatusEnum('status').notNull().default('draft'),
		startAt: timestamp('start_at', { withTimezone: true }).notNull(),
		endAt: timestamp('end_at', { withTimezone: true }),
		timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
		locationLabel: varchar('location_label', { length: 160 }).notNull(),
		addressLine1: varchar('address_line_1', { length: 160 }),
		addressLine2: varchar('address_line_2', { length: 160 }),
		city: varchar('city', { length: 80 }),
		region: varchar('region', { length: 80 }),
		postalCode: varchar('postal_code', { length: 32 }),
		countryCode: varchar('country_code', { length: 2 }).notNull().default('US'),
		latitude: numeric('latitude', { precision: 9, scale: 6 }),
		longitude: numeric('longitude', { precision: 9, scale: 6 }),
		priceSummary: varchar('price_summary', { length: 160 }),
		isFeatured: boolean('is_featured').notNull().default(false),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('listing_host_idx').on(table.hostId),
		index('listing_status_start_idx').on(table.status, table.startAt),
		index('listing_type_idx').on(table.eventType),
	]
)

export const listingTag = pgTable(
	'listing_tag',
	{
		listingId: uuid('listing_id')
			.notNull()
			.references(() => listing.id, { onDelete: 'cascade' }),
		tag: varchar('tag', { length: 48 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.listingId, table.tag] })]
)

export const media = pgTable(
	'media',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		listingId: uuid('listing_id')
			.notNull()
			.references(() => listing.id, { onDelete: 'cascade' }),
		objectKey: text('object_key').notNull().unique(),
		url: text('url').notNull(),
		altText: varchar('alt_text', { length: 160 }),
		sortOrder: integer('sort_order').notNull().default(0),
		width: integer('width'),
		height: integer('height'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('media_listing_idx').on(table.listingId)]
)

export const favorite = pgTable(
	'favorite',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		listingId: uuid('listing_id')
			.notNull()
			.references(() => listing.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.listingId] })]
)

export const follow = pgTable(
	'follow',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		hostId: uuid('host_id')
			.notNull()
			.references(() => host.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.hostId] })]
)

export const searchAlert = pgTable(
	'search_alert',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		label: varchar('label', { length: 80 }).notNull(),
		locationLabel: varchar('location_label', { length: 160 }).notNull(),
		latitude: numeric('latitude', { precision: 9, scale: 6 }),
		longitude: numeric('longitude', { precision: 9, scale: 6 }),
		radiusMiles: integer('radius_miles').notNull().default(15),
		eventTypes: text('event_types').array(),
		tags: text('tags').array(),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('search_alert_user_idx').on(table.userId)]
)

export const plan = pgTable('plan', {
	id: text('id').primaryKey(),
	slug: varchar('slug', { length: 48 }).notNull().unique(),
	name: varchar('name', { length: 80 }).notNull(),
	monthlyPriceCents: integer('monthly_price_cents').notNull(),
	annualPriceCents: integer('annual_price_cents'),
	featureFlags: jsonb('feature_flags').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const userEntitlement = pgTable(
	'user_entitlement',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		planId: text('plan_id')
			.notNull()
			.references(() => plan.id),
		status: entitlementStatusEnum('status').notNull().default('free'),
		polarCustomerId: text('polar_customer_id'),
		polarSubscriptionId: text('polar_subscription_id'),
		startsAt: timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('user_entitlement_user_idx').on(table.userId)]
)

export const billingEvent = pgTable('billing_event', {
	id: uuid('id').defaultRandom().primaryKey(),
	providerEventId: text('provider_event_id').notNull().unique(),
	eventName: varchar('event_name', { length: 120 }).notNull(),
	payload: jsonb('payload').notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const report = pgTable(
	'report',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		reporterUserId: text('reporter_user_id').references(() => user.id, { onDelete: 'set null' }),
		targetListingId: uuid('target_listing_id').references(() => listing.id, {
			onDelete: 'set null',
		}),
		targetHostId: uuid('target_host_id').references(() => host.id, { onDelete: 'set null' }),
		reason: varchar('reason', { length: 80 }).notNull(),
		details: text('details'),
		status: reportStatusEnum('status').notNull().default('open'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('report_status_idx').on(table.status)]
)

export const notification = pgTable(
	'notification',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: varchar('type', { length: 80 }).notNull(),
		title: varchar('title', { length: 140 }).notNull(),
		body: text('body'),
		data: jsonb('data').notNull().default({}),
		readAt: timestamp('read_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index('notification_user_idx').on(table.userId)]
)
