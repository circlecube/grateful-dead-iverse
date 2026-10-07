import type { ShowLinks } from './corpus/types';

const RECORDING_LINK_KEYS = ['archive_org', 'relisten', 'nugs', 'youtube', 'video', 'soundboard'];

export function showHasRecording(links: ShowLinks): boolean {
	for (const key of RECORDING_LINK_KEYS) {
		const val = links[key];
		if (typeof val === 'string' && val.trim()) {
			return true;
		}
		if (Array.isArray(val) && val.some((u) => typeof u === 'string' && u.trim())) {
			return true;
		}
	}
	return false;
}
