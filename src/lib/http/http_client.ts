import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export class HttpClient {
    private readonly authenticationHeader$: Observable<
        Record<string, string>
    > | null = this.createAuthenticationHeaderObservable();

    constructor(private token$: Observable<string> | null = null) {}

    /** fetches a blob image and makes a string ready to be put in an image-tag src-attribute */
    fetchBlobImage(url: string, init: RequestInit) {
        return this.fetchBlob(url, init).pipe(
            map((blob) => {
                if (blob === null) {
                    return null;
                }
                const urlCreator = window.URL || window.webkitURL;
                return urlCreator.createObjectURL(blob);
            }),
            catchError(() => of(null))
        );
    }

    fetchBlob(url: string, init: RequestInit) {
        if (this.authenticationHeader$) {
            return this.authenticationHeader$.pipe(
                switchMap((header) => internalFetchBlob(url, init, header))
            );
        }

        return internalFetchBlob(url, init);
    }

    fetchJson<T>(url: string, init: RequestInit): Observable<T | null> {
        if (this.authenticationHeader$) {
            return this.authenticationHeader$.pipe(
                switchMap((header) => internalFetchJson<T>(url, init, header))
            );
        }
        return internalFetchJson(url, init);
    }

    private createAuthenticationHeaderObservable() {
        return (
            this.token$?.pipe(
                map((token) => {
                    return { Authorization: `Bearer ${token}` };
                })
            ) || null
        );
    }
}

const internalFetchBlob = (
    url: string,
    init: RequestInit,
    authenticationHeader?: Record<string, string>
) => {
    return fromFetch(url, {
        ...init,
        headers: {
            ...init.headers,
            ...authenticationHeader,
        },
    }).pipe(
        switchMap((response) => {
            if (response.status !== 200) {
                throw new Error('Error when fetching image blob');
            }

            return response.blob();
        }),
        catchError(() => of(null))
    );
};

const internalFetchJson = <T>(
    url: string,
    init: RequestInit,
    authenticationHeader?: Record<string, string>
) => {
    return fromFetch(url, {
        ...init,
        ...authenticationHeader,
    }).pipe(
        switchMap((response) => {
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
};
