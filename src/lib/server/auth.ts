import type { Cookies } from '@sveltejs/kit';

export const AUTH_COOKIE_NAME = 'wrapped_auth';

export interface AuthSession {
    userId: string;
    username: string;
}

export function getAuthSession(cookies: Cookies): AuthSession | null {
    const raw = cookies.get(AUTH_COOKIE_NAME);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<AuthSession>;
        if (!parsed.userId || !parsed.username) return null;
        return { userId: parsed.userId, username: parsed.username };
    } catch {
        return null;
    }
}

export function setAuthSession(cookies: Cookies, session: AuthSession): void {
    cookies.set(AUTH_COOKIE_NAME, JSON.stringify(session), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
    });
}

export function clearAuthSession(cookies: Cookies): void {
    cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}
