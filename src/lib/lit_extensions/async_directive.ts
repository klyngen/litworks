import { AsyncDirective } from 'lit/async-directive.js';
import { directive } from 'lit/directive.js';
import { Observable, Subscription } from 'rxjs';

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
