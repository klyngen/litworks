/* eslint-disable @typescript-eslint/ban-types */
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';

import { installRouter } from '../utils/installRouter';

export type ImportResult = {
    [key: string]: object;
};

export type ConstructableObject = {
    new (): Node;
};

export type Route = {
    readonly name: string;
    readonly route: RegExp;
    readonly action?: () => Promise<ImportResult> | ConstructableObject;
    readonly data?: Record<string, unknown>;
};

export class NavigationService {
    routes: readonly Route[] = [];

    private readonly routeSubject: Subject<Route> = new ReplaySubject(1);
    private readonly routeParams = new BehaviorSubject<
        Record<string, string> | undefined
    >(undefined);

    addRoutes(routes: readonly Route[]) {
        this.routes = routes;
        const initialRoute = this.findMatchingRoute(window.location);

        if (initialRoute) {
            this.routeSubject.next(initialRoute.route);
            this.routeParams.next(initialRoute.params);
        } else {
            const route = this.routes.find(
                (item) => item.route.toString() === '/'
            );
            if (route === null) {
                throw new Error('Unable to find default route');
            }
        }

        installRouter((location) => {
            this.changeNavigation(location);
        });
    }

    get currentRoute$(): Observable<Route> {
        return this.routeSubject;
    }

    /**
     * Contains parameters from routes that are defined as named groups in regex
     * `/someUrl\/(?<someId>[0-9]+)`
     * will produce the followin object
     * `{someId: 42}`
     * */
    get routeParams$(): Observable<Record<string, string> | undefined> {
        return this.routeParams;
    }

    setCurrentRoute(path: string, state: string | null = null) {
        history.pushState(path, state || '');
        history.replaceState(state, '', path);
        this.changeNavigation(window.location);
    }

    private changeNavigation(location: Location) {
        const routingData = this.findMatchingRoute(location);
        this.routeSubject.next(routingData.route);
        this.routeParams.next(routingData.params);
    }

    private findMatchingRoute(location: Location): {
        readonly route: Route;
        readonly params?: Record<string, string>;
    } {
        const closestMatch = this.routes
            .map((route) => ({
                route,
                match: location.pathname.match(route.route),
            }))
            .filter((match) => match.match !== null)[0];

        if (closestMatch) {
            return {
                route: closestMatch.route,
                params: closestMatch.match?.groups,
            };
        }
        const notFound = (this.routes as readonly Route[]).find(
            (item) => item.route.toString() === '/\\/404/'
        );

        if (!notFound) {
            throw Error('No not-found-route defined');
        }

        return { route: notFound };
    }
}
