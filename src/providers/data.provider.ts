import { useRef, useSyncExternalStore } from "react";

import { deepClone, deepEqual, deepMerge } from "@/utils/object.util";

export default function createDataStore<T>(initialState: T) {
    let store = deepClone(initialState);
    const subscribers = new Set<() => void>();

    const MAX_HISTORY = 100;
    const history: T[] = [deepClone(store)];
    let currentIndex = 0;
    let pushHistoryDebouncedTimeout: ReturnType<typeof setTimeout> | null =
        null;

    function getStore(): T {
        return store;
    }

    function notifySubscribers() {
        requestAnimationFrame(() => {
            subscribers.forEach((callback) => callback());
        });
    }

    function setStore(update: DeepPartial<T> | T | ((state: T) => void | T)) {
        let nextState: T;

        if (typeof update === "function") {
            // update function
            if (typeof store !== "object") {
                // Override if store is not primitive value
                nextState = (update as (state: T) => T)(store);
            } else {
                nextState = deepClone(store);
                // Mutate object
                const result = (update as (state: T) => void | T)(nextState);
                if (result !== undefined) nextState = result;
            }
        } else if (
            // update is in object shape: => write util function to check object type
            update &&
            typeof update === "object" &&
            !Array.isArray(update) &&
            store &&
            typeof store === "object" &&
            !Array.isArray(store)
        ) {
            // Merge update object with store
            nextState = deepMerge(store, update);
        } else {
            // update is primitive value
            nextState = update as T;
        }

        // Deeply compare the previous store and updated clone store
        // If changes, update store, save history
        // => Notify subscribers update changes
        if (!deepEqual(store, nextState)) {
            store = nextState;
            const latestVersion = deepClone(nextState);

            if (pushHistoryDebouncedTimeout)
                clearTimeout(pushHistoryDebouncedTimeout);

            pushHistoryDebouncedTimeout = setTimeout(() => {
                history.splice(currentIndex + 1);
                history.push(latestVersion);
                currentIndex = history.length - 1;

                // Enforce history limit
                if (history.length > MAX_HISTORY) {
                    history.shift();
                    currentIndex--;
                }
            }, 200);

            notifySubscribers();
        }
    }

    // Rollback data to a specific version
    function rollbackTo(versionIndex: number) {
        if (versionIndex >= 0 && versionIndex < history.length) {
            currentIndex = versionIndex;
            store = deepClone(history[currentIndex]);
            notifySubscribers();
        }
    }

    // Undo updating data
    function undo() {
        if (currentIndex > 0) {
            currentIndex--;
            store = deepClone(history[currentIndex]);
            notifySubscribers();
        }
    }

    // Redo "undo" action
    function redo() {
        if (currentIndex < history.length - 1) {
            currentIndex++;
            store = deepClone(history[currentIndex]);
            notifySubscribers();
        }
    }

    // Reset store to initial state
    function resetStore() {
        store = deepClone(initialState);
        history.splice(0, history.length, deepClone(initialState));
        currentIndex = 0;
        notifySubscribers();
    }

    // Get all data versions
    function getHistory(): T[] {
        return history.map((h) => deepClone(h));
    }

    // Get current store version
    function getCurrentVersion(): number {
        return currentIndex;
    }

    function subscribe(callback: () => void) {
        subscribers.add(callback);
        return () => {
            subscribers.delete(callback);
        };
    }

    // Custom hook to get data store
    function useDataStore<SelectorOutput>(
        selector: (store: T) => SelectorOutput
    ) {
        const lastSelectedRef = useRef(selector(getStore()));

        return useSyncExternalStore(
            subscribe,
            () => {
                const selected = selector(getStore());
                if (!deepEqual(lastSelectedRef.current, selected)) {
                    lastSelectedRef.current = selected;
                }
                return lastSelectedRef.current;
            },
            () => selector(initialState)
        );
    }

    function registerShortcuts() {
        if (typeof window === "undefined") return;

        const handler = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();

            const isUndo =
                (event.ctrlKey || event.metaKey) &&
                key === "z" &&
                !event.shiftKey;

            const isRedo =
                (event.ctrlKey || event.metaKey) &&
                ((key === "z" && event.shiftKey) || key === "y");

            if (isUndo) {
                event.preventDefault();
                undo();
            }

            if (isRedo) {
                event.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handler);

        return () => {
            window.removeEventListener("keydown", handler);
        };
    }

    return {
        useDataStore,
        setStore,
        resetStore,
        rollbackTo,
        undo,
        redo,
        registerShortcuts,
        getHistory,
        getCurrentVersion,
    };
}
