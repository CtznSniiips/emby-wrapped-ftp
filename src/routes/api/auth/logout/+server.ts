import { json } from '@sveltejs/kit';
import { clearAuthSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
    clearAuthSession(cookies);
    return json({ ok: true });
};
