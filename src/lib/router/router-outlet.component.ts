import { html, LitElement, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property, queryAsync } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

import { ConstructableObject, NavigationService, Route } from './router';

const ELEMENT_NAME = 'litworks-router-outlet';

/**
 * Simple yet powerfull router
 * You can either have a global Navigation Service or multiple small navigation services, each controlling
 * a router-outlet
 *
 *
 * ```typescript
 const navigationService = new NavigationService();
 navigationService.addRoutes([
    { // This will lazy load a component
      name: "Route one",
      route: /\/one$/,
      action: () => {
        return import("./views/test-view/test-view.component");
      },
    },
    { // This will egarly load a component
      name: "Route two - egarly loaded component",
      route: /\/two$/,
      action: () => TestComponent,
    },
   { // This will lazy load a component
      name: "Route three - egarly loaded component with url params",
      route: /\/products/(?<productId>[0-9]+)$/,
      action: () => TestComponent,
    },
 ]);
  render() {
    return html`<litworks-router-outlet .navigationService=${navigationService}></litworks-router-outlet>`;
  }
  ```
 **/
@customElement(ELEMENT_NAME)
export class RouterOutlet extends LitElement {
    private readonly subscriptions: Subscription[] = [];

    @queryAsync('#view-container')
    viewContainer: Promise<HTMLDivElement> | undefined;

    private _navigationService?: NavigationService;

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
    }

    get navigationService(): NavigationService | undefined {
        return this._navigationService;
    }

    private async loadView(route: Route): Promise<void> {
        if (route && route.action) {
            try {
                const actionResult = route.action();
                // If the route action has all Promise-properties, then we can be certain it is a promise
                if (
                    'then' in actionResult &&
                    'catch' in actionResult &&
                    'finally' in actionResult
                ) {
                    const importResult = await actionResult;
                    this.viewContainer?.then((viewContainer) => {
                        viewContainer.innerHTML = '';
                        for (const key of Object.keys(importResult)) {
                            const element = importResult[
                                key
                            ] as ConstructableObject;
                            viewContainer.appendChild(new element());
                        }
                    });
                } else {
                    this.viewContainer?.then((viewContainer) => {
                        viewContainer.appendChild(new actionResult());
                    });
                }
            } catch (e) {
                console.error(`unable to load view: ${e}`);
            }
        }
    }

    render(): TemplateResult {
        return html`<div id="view-container"></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'litworks-router-outlet': RouterOutlet;
    }
}
