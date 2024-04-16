import { map, merge, Observable } from 'rxjs';

type NamedObservable<T> = {
    readonly name: string;
    readonly observable: Observable<T>;
};

export const newNamedObservable = <T>(
    name: string,
    observable: Observable<T>
) => {
    const namedObservable: NamedObservable<T> = {
        name,
        observable,
    };

    return namedObservable;
};

type ObservableObjectMapping<T> = {
    [key: string]: Observable<T>;
};

type NamedObservableOutput<T> = {
    name: string;
    value: T;
};

/**
 * If you have multiple observables emitting the same type and you want to
 * distinguish them. Use this utility
 *
 * ```typescript
namedMerge({
    a: interval(1000),
    b: interval(1100),
    c: interval(1200)
}).subscribe(console.log);
// { name: "a", value: 0 }
// { name: "b", value: 0 }
// { name: "c", value: 0 }
// { name: "a", value: 1 }
// { name: "b", value: 1 }
// { name: "c", value: 1 }
 * ```
 *
 * Operator also supports the following input format
 ```typescript
namedMerge([
{name: "a", observable: interval(1000)}
{name: "b", observable: interval(1001)}
{name: "c", observable: interval(1002)}
]).subscribe(console.log);
// { name: "a", value: 0 }
// { name: "b", value: 0 }
// { name: "c", value: 0 }
// { name: "a", value: 1 }
// { name: "b", value: 1 }
// { name: "c", value: 1 }

 ```
*/
export function namedMerge<T>(
    observables: ObservableObjectMapping<T>
): Observable<NamedObservableOutput<T>>;
export function namedMerge<T>(
    observables: readonly NamedObservable<T>[]
): Observable<NamedObservableOutput<T>>;
export function namedMerge<T>(
    observables: readonly NamedObservable<T>[] | ObservableObjectMapping<T>
): Observable<NamedObservableOutput<T>> {
    if (Array.isArray(observables)) {
        return merge(
            ...(observables as NamedObservable<T>[])
                .filter((namedObservable) => !!namedObservable.observable)
                .map((namedObservable) =>
                    makeNamedValueObservableFromKeyValue(namedObservable)
                )
        );
    } else {
        const objectObservables = observables as ObservableObjectMapping<T>;

        return merge(
            ...Object.entries(objectObservables)
                .map((entry) => ({
                    name: entry[0],
                    observable: entry[1],
                }))
                .filter((namedObservable) => !!namedObservable.observable)
                .map((namedObservable) =>
                    makeNamedValueObservableFromKeyValue(namedObservable)
                )
        );
    }
}

function makeNamedValueObservableFromKeyValue<T>(
    observable: NamedObservable<T>
): Observable<NamedObservableOutput<T>> {
    return observable.observable.pipe(
        map((value) => ({
            name: observable.name,
            value,
        }))
    );
}
