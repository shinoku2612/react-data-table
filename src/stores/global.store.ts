import createContextStore from "@/providers/context.provider";

type GlobalState = {
    columnVisibility: Record<string, boolean>;
};
const initState: GlobalState = {
    columnVisibility: {},
};

export const {
    useContextStore: useGlobalStore,
    useStoreDispatch: userGlobalDispatch,
    ContextStoreProvider: GlobalContextProvider,
} = createContextStore(initState, {
    persistKey: "VDwqVtPbjI8v/jWe+XIbWA==",
    persistFields: ["columnVisibility"],
});
