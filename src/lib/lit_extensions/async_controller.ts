import {
    html,
    ReactiveController,
    ReactiveControllerHost,
    TemplateResult,
} from 'lit';
import { Observable, Subscription } from 'rxjs';

export function createAsyncController<T>(
    host: ReactiveControllerHost,
    observable: Observable<T>
): AsyncController<T | undefined>;
export function createAsyncController<T>(
    host: ReactiveControllerHost,
    observable: Observable<T>,
    defaultValue: T
): AsyncController<T>;

export function createAsyncController<T>(
    host: ReactiveControllerHost,
    observable: Observable<T>,
    defaultValue?: T
) {
    if (defaultValue) {
        return new AsyncController<T>(host, observable, defaultValue);
    }

    return new AsyncController<T | undefined>(host, observable, undefined);
}

export class AsyncController<T> implements ReactiveController {
    sub: Subscription | null = null;
    private error: string | undefined;
    private preFirstValue = true;

    constructor(
        private readonly host: ReactiveControllerHost,
        private readonly source: Observable<T>,
        private value: T
    ) {
        this.host.addController(this);
        if (this.value) {
            this.preFirstValue = false;
        }
    }

    hostConnected() {
        this.sub = this.source.subscribe({
            next: (value) => {
                this.checkIfPreFirstValue();
                this.value = value;
                this.error = undefined;
                this.host.requestUpdate();
            },
            error: (err) => {
                this.checkIfPreFirstValue();
                console.error(err);
                if (typeof err === 'string') {
                    this.error = err;
                    this.host.requestUpdate();
                    return;
                }

                if (typeof err.message === 'string') {
                    this.error = err.message;
                    this.host.requestUpdate();
                    return;
                }

                if (typeof err.toString === 'function') {
                    this.error = err.toString();
                    this.host.requestUpdate();
                    return;
                }

                this.error = JSON.stringify(err);
                this.host.requestUpdate();
            },
            complete: () => {
                this.sub?.unsubscribe();
            },
        });
    }

    private checkIfPreFirstValue() {
        if (this.preFirstValue) {
            this.preFirstValue = false;
        }
    }

    hostDisconnected() {
        this.sub?.unsubscribe();
    }

    render(params: {
        pending?: () => TemplateResult;
        onValue?: (value: T) => TemplateResult | TemplateResult[];
        onError?: (err: string) => TemplateResult;
        onEmpty?: () => TemplateResult;
        isEmpty?: (value: T) => boolean;
        initial?: () => TemplateResult;
    }): TemplateResult | TemplateResult[] {
        if (params.onEmpty && params.isEmpty === undefined) {
            throw new Error(
                'When having an on empty template we need a validation function'
            );
        }

        if (this.preFirstValue && params.initial) {
            return params.initial();
        }

        if (this.error && params.onError !== undefined) {
            return params.onError(this.error);
        }

        if (!this.value && params.pending !== undefined) {
            return params.pending();
        }

        if (params.onValue !== undefined) {
            if (
                params.isEmpty !== undefined &&
                params.isEmpty(this.value) &&
                params.onEmpty
            ) {
                return params.onEmpty();
            }

            return params.onValue(this.value);
        }
        return html``;
    }
}
