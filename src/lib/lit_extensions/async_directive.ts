import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';
import { Observable, Subscription } from 'rxjs';

/**
 * When you have an observable emitting a simple value, like a string or a number,
 * the observe-directive is probably the best way of tracking that value
 * ```typescript
 *
\@customElement("test-component")
export class TestComponent extends LitElement {
   // Emits every second
   private interval$ = interval(1000);

   render() {
     return html`<p>Current count: ${observe(this.interval$)}</p>`;
   }
}

```
 * */
class ObserveDirective<T> extends AsyncDirective {
    private subscription?: Subscription;

    render(observable: Observable<T>) {
        this.subscription = observable.subscribe((value) =>
            this.setValue(value)
        );
        return ``;
    }

    disconnected() {
        this.subscription?.unsubscribe();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createObservableDirective = <T>() =>
    directive(ObserveDirective<T>);

export const observe = directive(ObserveDirective);
