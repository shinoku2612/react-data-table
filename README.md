## React Data Table

A high-performance React component for rendering large datasets with virtualized scrolling, infinite loading, and comprehensive table management features.
Includes Tailwind CSS, context providers (custom state management) and TanStack integration.

## Features

-   **Virtual Scrolling** - Renders only visible rows for optimal performance
-   **Infinite Scrolling** - Automatically loads more data as you scroll
-   **Sorting** - Column-based sorting with visual indicators
-   **Row Selection** - Multi-select with keyboard support
-   **Column Management** - Show/hide, resize, and reorder columns
-   **State Persistence** - Remembers user preferences across sessions
-   **Accessibility** - Full ARIA support and keyboard navigation
-   **Customizable** - Flexible styling and behavior options

### Tech stack

-   React 19
-   Vite 7
-   Tailwind CSS 4
-   ESLint + Prettier
-   TanStack Query, TanStack Table, TanStack Virtual

### Requirements

-   Node >= 22.13.0
-   npm >= 10.0.0

### Getting started

```bash
git clone https://github.com/shinoku2612/react-data-table.git
cd react-data-table
npm install

npm run dev
```

App runs on the host shown by Vite (default http://localhost:5173).

### Build & preview

```bash
npm run build
npm run preview
```

Output is emitted to `dist/`.

## State Management Integration

The component integrates with a custom context-based state management system using useSyncExternalStore hook.
You can see more detail about the state management inside `context.provider.ts` file from `src/providers/`.

```tsx
// global.store.ts
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

// Persisted to localStorage with key: "VDwqVtPbjI8v/jWe+XIbWA=="
// User preferences survive page refreshes
```

## Trade-offs & Considerations

### Strengths

-   **Performance**: Handles 100k+ rows smoothly by rendering a slice of rows
-   **Memory Efficient**: Virtual scrolling keeps memory usage constant
-   **User Experience**: Smooth infinite scroll, no pagination clicks
-   **Accessibility**: Full ARIA support, keyboard navigation
-   **Persistent State**: User preferences saved across sessions

### Limitations

1. **Client-Side Sorting**: Current implementation sorts in-memory only

    - **Impact**: Large datasets (10k+ rows) may have slow sort operations
    - **Solution**: Implement server-side sorting

2. **Memory Growth**: Infinite scroll accumulates all fetched data

    - **Impact**: Very long scrolling sessions may consume significant memory
    - **Solution**: Implement data windowing to discard off-screen data

3. **Initial Load**: Must fetch first page before rendering

    - **Impact**: Blank screen during initial load
    - **Solution**: Customize `loadingComponent` with skeleton screens

4. **Fixed Height Estimation**: Uses estimated row heights for performance

    - **Impact**: Variable content heights may cause minor scroll jumps
    - **Solution**: Set accurate `estimatedRowHeight` or enable measurement

## Performance Optimization

### Best Practices

1. **Set Accurate Row Height**

    ```tsx
    estimatedRowHeight={45} // Match your actual row height
    ```

2. **Adjust Overscan for Complex Rows**

    ```tsx
    overscan={10} // Increase for rows with heavy rendering
    ```

3. **Memoize Cell Renderers**

    ```tsx
    const StatusCell = React.memo(({ value }) => (
        <span className={`status-${value}`}>{value}</span>
    ));
    ```

4. **Use Server-Side Operations**

    - Sorting: Send sort params to API
    - Filtering: Filter on backend
    - Searching: Use database full-text search

5. **Optimize Column Definitions**
    ```tsx
    const columns = useMemo(() => [...], []); // Prevent recreation
    ```

## Future Enhancements

### Planned Features

-   **Inline Editing**: Edit cell values directly in the table with validation and auto-save
-   **Bulk Actions**: Action bar for selected rows
-   **Export**: CSV/Excel export functionality
-   **Advanced Filtering & Searching**: Filter & Search builder UI
-   **Column Grouping**: Multi-level headers
-   **Expandable Rows**: Row detail expansion
-   **Drag & Drop**: Reorder rows and columns

## Troubleshooting

### Rows not loading

**Problem**: Table shows "0 of 0 rows"  
**Solution**: Verify `fetchFn` returns `{ data: T[], meta: { totalRowCount: number } }`

### Jerky scrolling

**Problem**: Scroll feels jumpy or laggy  
**Solution**: Adjust `estimatedRowHeight` to match actual row height more closely

### Column visibility not persisting

**Problem**: Hidden columns reappear on refresh  
**Solution**: Check that `persistKey` in `global.store.ts` is correctly configured

### Memory issues

**Problem**: Browser slows down after scrolling  
**Solution**: Implement data windowing or reduce `fetchSize`

### Sorting is slow

**Problem**: Sorting large datasets freezes UI  
**Solution**: Implement server-side sorting instead of client-side

## Support

For issues and questions:

-   📧 Email: thongdv2612@gmail.com
