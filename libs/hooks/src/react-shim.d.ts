declare module 'react' {
    export type Dispatch<A> = (value: A) => void
    export type SetStateAction<S> = S | ((prevState: S) => S)

    export function useState<S>(
        initialState: S | (() => S),
    ): [S, Dispatch<SetStateAction<S>>]

    export function useEffect(effect: () => unknown, deps?: readonly unknown[]): void

    export function useCallback<T>(callback: T, deps: readonly unknown[]): T
}

