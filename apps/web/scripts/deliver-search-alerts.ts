import { runSavedSearchAlertDelivery } from '../src/lib/server/search-alerts'

try {
	const summary = await runSavedSearchAlertDelivery()

	console.log(
		JSON.stringify(
			{
				message: 'Saved search delivery run complete',
				summary,
			},
			null,
			2
		)
	)
	process.exit(0)
} catch (error) {
	console.error(error)
	process.exit(1)
}
