import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useSyncExternalStore,
} from "react";

import { deepClone, deepEqual, deepMerge } from "@/utils/object.util";

export default function createContextStore<T>(
    initialState: T,
    { reducer, persistKey, persistFields = [] }: ContextStoreOption<T> = {}
) {
    function loadState(): T {
        if (!persistKey) return initialState;
        try {
            const stored = localStorage.getItem(persistKey);
            if (!stored) return initialState;

            const parsed = JSON.parse(stored);
            const hasPersistFields =
                Array.isArray(persistFields) && persistFields.length > 0;
            if (hasPersistFields) {
                const partialState = persistFields.reduce<Partial<T>>(
                    (acc, key) => {
                        if (key in parsed) acc[key] = parsed[key];
                        return acc;
                    },
                    {}
                );
                return { ...initialState, ...partialState };
            }
            return { ...initialState, ...parsed };
        } catch {
            return initialState;
        }
    }

    function saveState(state: T) {
        if (!persistKey) return;
        try {
            const isObjectState =
                typeof state === "object" && state != undefined;
            if (!isObjectState)
                return localStorage.setItem(persistKey, JSON.stringify(state));

            const hasPersistFields =
                Array.isArray(persistFields) && persistFields.length > 0;
            if (!hasPersistFields)
                return localStorage.setItem(persistKey, JSON.stringify(state));

            const persistObject = persistFields.reduce<Partial<T>>(
                (acc, key) => {
                    if (key in state) acc[key] = state[key];
                    return acc;
                },
                {}
            );

            localStorage.setItem(persistKey, JSON.stringify(persistObject));
        } catch {
            console.warn("Failed to save state.");
        }
    }

    function useContextStoreData() {
        const store = useRef<T>(loadState());
        const subscribers = useRef(new Set<() => void>());

        const get = useCallback(() => store.current, []);

        const set = useCallback(
            (
                update: DeepPartial<T> | T | ((state: T) => void | T) | Action
            ) => {
                let nextState: T;

                if (typeof update === "function") {
                    if (
                        typeof store.current !== "object" ||
                        store.current === null
                    ) {
                        // For primitives, pass the current value and use the return value
                        nextState = (update as (state: T) => T)(store.current);
                    } else {
                        // For objects, clone and modify in-place
                        nextState = deepClone(store.current);
                        (update as (state: T) => T)(nextState);
                    }
                } else if (
                    update &&
                    typeof update === "object" &&
                    "type" in update &&
                    reducer
                ) {
                    // Reducer action
                    nextState = deepClone(store.current);
                    reducer(nextState, update);
                } else if (
                    update &&
                    typeof update === "object" &&
                    !Array.isArray(update) &&
                    store.current &&
                    typeof store.current === "object" &&
                    !Array.isArray(store.current)
                ) {
                    // Deep merge for objects
                    nextState = deepMerge(
                        store.current,
                        update as DeepPartial<T>
                    ) as T;
                } else {
                    // Direct replacement for primitives, arrays, or when store isn't an object
                    nextState = update as T;
                }

                if (!deepEqual(store.current, nextState)) {
                    store.current = nextState;
                    saveState(nextState);
                    subscribers.current.forEach((callback) => callback());
                }
            },
            []
        );

        const subscribe = useCallback((callback: () => void) => {
            subscribers.current.add(callback);
            return () => subscribers.current.delete(callback);
        }, []);

        return { get, set, subscribe };
    }

    type ContextData = ReturnType<typeof useContextStoreData>;
    const ContextStore = createContext<ContextData | null>(null);

    function ContextStoreProvider({ children }: { children: React.ReactNode }) {
        return (
            <ContextStore.Provider value={useContextStoreData()}>
                {children}
            </ContextStore.Provider>
        );
    }

    function useContextStore<SelectorOutput>(
        selector: (store: T) => SelectorOutput
    ): SelectorOutput {
        const contextStore = useContext(ContextStore);
        if (!contextStore) throw new Error("Store not found");

        const lastSelectedRef = useRef<SelectorOutput>(
            selector(contextStore.get())
        );

        return useSyncExternalStore(
            contextStore.subscribe,
            () => {
                const newState = selector(contextStore.get());
                if (!deepEqual(lastSelectedRef.current, newState)) {
                    lastSelectedRef.current = newState;
                }
                return lastSelectedRef.current;
            },
            () => selector(initialState)
        );
    }

    function useStoreDispatch() {
        const contextStore = useContext(ContextStore);
        if (!contextStore) throw new Error("Store not found");

        return contextStore.set;
    }

    return {
        ContextStoreProvider,
        useContextStore,
        useStoreDispatch,
    };
}
