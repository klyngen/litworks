import { User, UserManager, UserManagerSettings } from 'oidc-client-ts';
import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';

export enum LOGIN_STATUS {
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
    readonly token$: Observable<string>;
    readonly user$: Observable<User | null>;

    private readonly userManager: UserManager;
    private readonly loginStatusSubject = new BehaviorSubject(
        LOGIN_STATUS.NOT_LOGGED_IN
    );

    readonly loginStatus$: Observable<LOGIN_STATUS> =
        this.loginStatusSubject.asObservable();

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

        this.user$ = this.loginStatus$.pipe(
            filter((status) => status === LOGIN_STATUS.LOGGED_IN),
            switchMap(() => this.userManager.getUser())
        );
    }

    async loginFlow() {
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
}

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
