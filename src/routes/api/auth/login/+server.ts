import { json } from '@sveltejs/kit';
import { emby } from '$lib/server/emby';
import { setAuthSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await request.json().catch(() => null) as { username?: string } | null;
    const username = body?.username?.trim();

    if (!username) {
        return json({ valid: false, error: 'Username is required' }, { status: 400 });
    }

    try {
        const user = await emby.findUserByName(username);

        if (!user) {
            return json({ valid: false, error: 'User not found on this server' }, { status: 404 });
        }

        setAuthSession(cookies, { userId: user.Id, username: user.Name });

        return json({ valid: true, userId: user.Id, username: user.Name });
    } catch (error) {
        console.error('Error logging in user:', error);
        return json({ valid: false, error: 'Failed to connect to Emby server' }, { status: 500 });
    }
};
