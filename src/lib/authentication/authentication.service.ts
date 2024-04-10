import { User, UserManager, UserManagerSettings } from 'oidc-client-ts';
import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

const hasAuthParams = (location = window.location): boolean => {
    let searchParams = new URLSearchParams(location.search);
    if (
        (searchParams.get('code') || searchParams.get('error')) &&
        searchParams.get('state')
    ) {
        return true;
    }

    // response_mode: fragment
    searchParams = new URLSearchParams(location.hash.replace('#', '?'));
    if (
        (searchParams.get('code') || searchParams.get('error')) &&
        searchParams.get('state')
    ) {
        return true;
    }

    return false;
};

enum LOGIN_STATUS {
    LOGGED_IN,
    NOT_LOGGED_IN,
    ERROR,
}

export type AuthenticationConfiguration = {
    readonly authority: string;
    readonly client_id: string;
    readonly redirect_uri?: string;
    readonly scope: string;
};

export class AuthenticationService {
    readonly userManager: UserManager;
    readonly token$: Observable<string>;

    private readonly authenticationHeader$: Observable<Record<string, string>>;
    private readonly loginStatusSubject = new BehaviorSubject(
        LOGIN_STATUS.NOT_LOGGED_IN
    );

    constructor(configuration: AuthenticationConfiguration) {
        const settings: UserManagerSettings = {
            ...configuration,
            redirect_uri: configuration.redirect_uri || window.location.href,
        };
        this.userManager = new UserManager(settings);

        this.token$ = this.loginStatusSubject.pipe(
            filter((status) => status === LOGIN_STATUS.LOGGED_IN),
            switchMap(() => this.userManager.getUser()),
            filter((user): user is User => user !== null),
            map((user) => user.access_token)
        );

        this.authenticationHeader$ = this.token$.pipe(
            map((token) => {
                return { Authorization: `Bearer ${token}` };
            })
        );
    }

    async loginFlow() {
        this.userManager;

        if (hasAuthParams()) {
            await this.userManager.signinCallback();
            this.loginStatusSubject.next(LOGIN_STATUS.LOGGED_IN);
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
            return;
        }

        if ((await this.userManager.getUser()) === null) {
            this.userManager.signinRedirect();
            return;
        }

        this.loginStatusSubject.next(LOGIN_STATUS.LOGGED_IN);
    }

    authenticatedFetch<T>(
        input: string,
        init: RequestInit
    ): Observable<T | null> {
        return this.authenticationHeader$.pipe(
            switchMap((authenticationHeader) => {
                const headers: HeadersInit = {
                    ...authenticationHeader,
                    ...init?.headers,
                };

                return fromFetch(input, {
                    ...init,
                    headers,
                });
            }),
            switchMap((response) => {
                if (response.status === 401) {
                    this.userManager.signinRedirect();
                }

                if (response.ok) {
                    const contentType = response.headers.get('Content-Type');
                    if (contentType && contentType === 'application/json')
                        return response.json() as Promise<T>;

                    return Promise.resolve(null);
                } else {
                    throw new Error(
                        `Unable to fetch error with a ${response.status}`
                    );
                }
            })
        );
    }
}
