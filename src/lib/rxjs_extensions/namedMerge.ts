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

export const namedMerge = <T>(observables: readonly NamedObservable<T>[]) =>
    merge(
        observables
            .filter((namedObservable) => !!namedObservable.observable)
            .map((namedObservable) => makeNamedValueObservable(namedObservable))
    );

const makeNamedValueObservable = <T>(observable: NamedObservable<T>) => {
    return observable.observable.pipe(
        map((value) => ({
            name: observable.name,
            value,
        }))
    );
};
