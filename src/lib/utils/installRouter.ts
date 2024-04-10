/**  CODE IN THIS FILE IS FROM PWA-HELPERS
 * That repo is archived but the code is still accessible on
 * https://github.com/Polymer/pwa-helpers
 * */

/* eslint-disable functional/no-return-void */
export const installRouter = (
    locationUpdatedCallback: (location: Location, event: Event | null) => void
) => {
    document.body.addEventListener('click', (e) => {
        if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey
        )
            return;

        const anchor = e
            .composedPath()
            .filter((n) => (n as HTMLElement).tagName === 'A')[0] as
            | HTMLAnchorElement
            | undefined;
        if (
            !anchor ||
            anchor.target ||
            anchor.hasAttribute('download') ||
            anchor.getAttribute('rel') === 'external'
        )
            return;

        const href = anchor.href;
        if (!href || href.indexOf('mailto:') !== -1) return;

        const location = window.location;
        const origin =
            location.origin || location.protocol + '//' + location.host;
        if (href.indexOf(origin) !== 0) return;

        e.preventDefault();
        if (href !== location.href) {
            window.history.pushState({}, '', href);
            locationUpdatedCallback(location, e);
        }
    });

    window.addEventListener('popstate', (e) =>
        locationUpdatedCallback(window.location, e)
    );
    locationUpdatedCallback(window.location, null /* event */);
};
