import type { PageServerLoad } from './$types';
import { getAvailableTimeRanges } from '$lib/server/stats';
import { getAuthSession } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url, cookies }) => {
    const usernameParam = url.searchParams.get('user') || url.searchParams.get('username') || '';
    const periodParam = url.searchParams.get('period') || '';
    const session = getAuthSession(cookies);

    return {
        timeRangeOptions: getAvailableTimeRanges(),
        prefilledUsername: usernameParam || session?.username || '',
        prefilledPeriod: periodParam,
        authenticatedUser: session
    };
};
