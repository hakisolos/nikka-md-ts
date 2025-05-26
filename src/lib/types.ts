/** @format */

import { WASocket } from 'baileys';

export interface CommandContext {
	sock: any;
	// Add any other context properties needed
}

export interface EventContext {
	sock: any;
	// Add any event-specific context properties
}
