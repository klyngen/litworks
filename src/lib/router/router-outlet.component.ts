import { html, LitElement, TemplateResult } from 'lit';
import { property, queryAsync } from 'lit/decorators';
import { customElement } from 'lit/decorators/custom-element';
import { Subscription } from 'rxjs';

import { ImportResult, NavigationService, Route } from './router';

export type constructableObject = {
    new (): Node;
};

@customElement('router-outlet')
export class RouterOutlet extends LitElement {
    private readonly subscriptions: Subscription[] = [];

    @queryAsync('#view-container')
    viewContainer: Promise<HTMLDivElement> | undefined;

    private _navigationService?: NavigationService;
    private _routes?: readonly Route[];

    @property({ attribute: false })
    set routes(items: readonly Route[]) {
        this._routes = items;
        if (this._navigationService) {
            this._navigationService.addRoutes(items);
            this._routes = undefined;
        }
    }

    @property({ attribute: false })
    set navigationService(item: NavigationService | undefined) {
        if (!item) {
            return;
        }

        this._navigationService = item;

        this.subscriptions.push(
            this._navigationService?.currentRoute$.subscribe((route) => {
                this.loadView(route);
            })
        );
        if (this._routes && this._navigationService) {
            this._navigationService.addRoutes(this._routes);
            this._routes = undefined;
        }
    }

    get navigationService(): NavigationService | undefined {
        return this._navigationService;
    }

    private async loadView(route: Route): Promise<void> {
        if (route && route.action) {
            try {
                const component: ImportResult = await route.action();
                this.viewContainer?.then((viewContainer) => {
                    viewContainer.innerHTML = '';
                    for (const key of Object.keys(component)) {
                        const element = component[key] as constructableObject;
                        viewContainer.appendChild(new element());
                    }
                });
            } catch (e) {
                console.error(`unable to load view: ${e}`);
            }
        }
    }

    render(): TemplateResult {
        return html`<div id="view-container"></div>`;
    }
}
