export function formatVenueLocation(venue: Record<string, unknown>): string {
	const city = typeof venue.city === 'string' ? venue.city : '';
	const state = typeof venue.state === 'string' ? venue.state : '';
	const country = typeof venue.country === 'string' ? venue.country : '';
	const parts = [city, state].filter(Boolean);
	if (parts.length === 0 && country) {
		return country;
	}
	if (country && country !== 'United States') {
		parts.push(country);
	}
	return parts.join(', ');
}
