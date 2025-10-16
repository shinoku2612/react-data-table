import React from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type OnChangeFn,
    type Row,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
    useReactTable,
} from "@tanstack/react-table";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { clsx, pxToRem } from "@/utils/string.util";

export function VirtualizedTable<
    T extends Record<string, string | number | boolean>
>({
    columns,
    queryKey,
    fetchFn,
    fetchSize = 50,
    containerHeight = "45rem",
    estimatedRowHeight = 33,
    scrollThreshold = 500,
    overscan = 5,
    enableSorting = true,
    enableColumnResizing = true,
    enableRowSelection = true,
    enableColumnToggling = true,
    rowKey = "",
    initialSorting = [],
    onSortingChange,
    onRowSelectionChange,
    initColumnVisibility = {},
    onColumnVisibilityChange,
    rowClassName,
    containerClassName = "",
    loadingComponent,
    fetchingComponent,
}: VirtualizedTableProps<T>) {
    const tableContainerRef = React.useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {}
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>(initColumnVisibility);
    const [showColumnToggle, setShowColumnToggle] = React.useState(false);

    // Notify parent of sorting changes
    React.useEffect(() => {
        onSortingChange?.(sorting);
    }, [sorting, onSortingChange]);

    // Notify parent of row selection changes
    React.useEffect(() => {
        onRowSelectionChange?.(rowSelection);
    }, [rowSelection, onRowSelectionChange]);

    // Notify parent of column visibility changes
    React.useEffect(() => {
        onColumnVisibilityChange?.(columnVisibility);
    }, [columnVisibility, onColumnVisibilityChange]);

    // Keyboard navigation handler
    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Escape" && showColumnToggle) {
                setShowColumnToggle(false);
            }
        },
        [showColumnToggle]
    );

    // Close column toggle when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showColumnToggle && !target?.closest("[data-column-toggle]")) {
                setShowColumnToggle(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showColumnToggle]);

    const { data, fetchNextPage, isFetching, isLoading } = useInfiniteQuery<
        PageData<T>
    >({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, sorting],
        queryFn: async ({ pageParam = 0 }) => {
            const start = (pageParam as number) * fetchSize;
            const fetchedData = await fetchFn(start, fetchSize, sorting);
            return fetchedData;
        },
        initialPageParam: 0,
        getNextPageParam: (_lastGroup, groups) => groups.length,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    });

    const flatData = React.useMemo(
        () => data?.pages?.flatMap((page) => page.data) ?? [],
        [data]
    );
    const totalDBRowCount = data?.pages?.[0]?.meta?.totalRowCount ?? 0;
    const totalFetched = flatData.length;

    const fetchMoreOnBottomReached = React.useCallback(
        (containerRefElement?: HTMLDivElement | null) => {
            if (containerRefElement) {
                const { scrollHeight, scrollTop, clientHeight } =
                    containerRefElement;
                if (
                    scrollHeight - scrollTop - clientHeight < scrollThreshold &&
                    !isFetching &&
                    totalFetched < totalDBRowCount
                ) {
                    fetchNextPage();
                }
            }
        },
        [
            fetchNextPage,
            isFetching,
            totalFetched,
            totalDBRowCount,
            scrollThreshold,
        ]
    );

    React.useEffect(() => {
        fetchMoreOnBottomReached(tableContainerRef.current);
    }, [fetchMoreOnBottomReached]);

    const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
        setSorting(updater);
        if (table.getRowModel().rows.length) {
            rowVirtualizer.scrollToIndex?.(0);
        }
    };

    const table = useReactTable({
        data: flatData,
        columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
        },
        onSortingChange: enableSorting ? handleSortingChange : undefined,
        onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
        onColumnVisibilityChange: enableColumnToggling
            ? setColumnVisibility
            : undefined,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: false,
        debugTable: false,
        columnResizeMode: "onChange",
        enableColumnResizing,
        enableRowSelection,
        enableHiding: enableColumnToggling,
        getRowId: (row: T, index: number) =>
            row[rowKey?.toString()]?.toString() ?? index.toString(),
    });

    table.setOptions((prev) => ({
        ...prev,
        onSortingChange: enableSorting ? handleSortingChange : undefined,
        onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
        onColumnVisibilityChange: enableColumnToggling
            ? setColumnVisibility
            : undefined,
    }));

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        estimateSize: () => estimatedRowHeight,
        getScrollElement: () => tableContainerRef.current,
        measureElement:
            typeof window !== "undefined" &&
            navigator.userAgent.indexOf("Firefox") === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
        overscan,
    });

    // Calculate selection stats for accessibility
    const selectedRowCount = Object.keys(rowSelection).length;
    const totalSelectableRows = rows.length;

    if (isLoading) {
        return (
            <div
                className="flex items-center justify-center p-8"
                role="status"
                aria-live="polite"
                aria-label="Loading data table"
            >
                <div className="flex items-center space-x-3">
                    <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
                        aria-hidden="true"
                    ></div>
                    <span className="text-gray-600 font-medium">
                        {loadingComponent || "Loading data..."}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <section
            className="w-full bg-white rounded-lg shadow-sm border border-gray-200 px-4 pb-4 pt-2"
            role="region"
            aria-label="Data table"
            onKeyDown={handleKeyDown}
        >
            {/* Header with row count */}
            <header className="mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Data Table
                        </h2>
                        {enableRowSelection && selectedRowCount > 0 && (
                            <div className="flex items-center space-x-2">
                                <div
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                    role="status"
                                    aria-live="polite"
                                    aria-label={`${selectedRowCount} row${
                                        selectedRowCount === 1 ? "" : "s"
                                    } selected out of ${totalSelectableRows}`}
                                >
                                    {selectedRowCount} selected
                                </div>
                                <button
                                    onClick={() => setRowSelection({})}
                                    className={clsx(
                                        "text-xs text-gray-500 hover:text-gray-700 underline rounded",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                        "cursor-pointer"
                                    )}
                                    aria-label="Clear all row selections"
                                >
                                    Clear selection
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {enableColumnToggling && (
                            <div
                                className="relative"
                                data-column-toggle
                            >
                                <button
                                    onClick={() =>
                                        setShowColumnToggle(!showColumnToggle)
                                    }
                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    aria-expanded={showColumnToggle}
                                    aria-haspopup="true"
                                    aria-label="Toggle column visibility options"
                                >
                                    <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                                        />
                                    </svg>
                                    <div className="flex items-center gap-1">
                                        <span>Columns</span>
                                        <span>
                                            {(() => {
                                                const hiddenColumnsCount = table
                                                    .getAllLeafColumns()
                                                    .filter(
                                                        (column) =>
                                                            column.getCanHide() &&
                                                            !column.getIsVisible()
                                                    ).length;

                                                return hiddenColumnsCount >
                                                    0 ? (
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                                        aria-label={`${hiddenColumnsCount} column${
                                                            hiddenColumnsCount ===
                                                            1
                                                                ? ""
                                                                : "s"
                                                        } hidden`}
                                                    >
                                                        {hiddenColumnsCount}{" "}
                                                        column
                                                        {hiddenColumnsCount ===
                                                        1
                                                            ? ""
                                                            : "s"}{" "}
                                                        hidden
                                                    </span>
                                                ) : null;
                                            })()}
                                        </span>
                                    </div>
                                    <svg
                                        className={clsx(
                                            "w-4 h-4 ml-1 transition-transform duration-250",
                                            {
                                                "-rotate-180": showColumnToggle,
                                            }
                                        )}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {showColumnToggle && (
                                    <div
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                                        role="menu"
                                        aria-label="Column visibility controls"
                                    >
                                        <div className="py-2 max-h-64 overflow-y-auto">
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                Toggle Columns
                                            </div>
                                            {table
                                                .getAllLeafColumns()
                                                .map((column) => {
                                                    if (!column.getCanHide())
                                                        return null;
                                                    const columnName =
                                                        typeof column.columnDef
                                                            .header === "string"
                                                            ? column.columnDef
                                                                  .header
                                                            : column.id;
                                                    return (
                                                        <label
                                                            key={column.id}
                                                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                                            role="menuitemcheckbox"
                                                            aria-checked={column.getIsVisible()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                                                                checked={column.getIsVisible()}
                                                                onChange={column.getToggleVisibilityHandler()}
                                                                aria-label={`Toggle ${columnName} column visibility`}
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {columnName}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            <div
                                                className={clsx(
                                                    "border-t border-gray-100 mt-2 pt-2",
                                                    "flex items-center justify-between"
                                                )}
                                                role="group"
                                                aria-label="Column visibility actions"
                                            >
                                                <button
                                                    onClick={() =>
                                                        table.toggleAllColumnsVisible(
                                                            false
                                                        )
                                                    }
                                                    className={clsx(
                                                        "w-full px-3 py-2 text-xs text-center",
                                                        "text-red-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    )}
                                                    aria-label="Hide all columns"
                                                >
                                                    Hide All
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        table.toggleAllColumnsVisible(
                                                            true
                                                        )
                                                    }
                                                    className={clsx(
                                                        "w-full px-3 py-2 text-xs text-center",
                                                        "text-blue-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    )}
                                                    aria-label="Show all columns"
                                                >
                                                    Show All
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            role="status"
                            aria-live="polite"
                            aria-label={`Showing ${totalFetched.toLocaleString()} of ${totalDBRowCount.toLocaleString()} total rows`}
                        >
                            {totalFetched.toLocaleString()} of{" "}
                            {totalDBRowCount.toLocaleString()} rows
                        </div>
                        {isFetching && (
                            <div
                                className="flex items-center space-x-1"
                                role="status"
                                aria-live="polite"
                                aria-label="Loading more data"
                            >
                                <div
                                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
                                    aria-hidden="true"
                                ></div>
                                <span className="text-sm text-blue-600 font-medium">
                                    {fetchingComponent || "Loading more..."}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Table container */}
            <div
                className={clsx(
                    "relative",
                    containerClassName,
                    "border border-gray-300"
                )}
                onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
                ref={tableContainerRef}
                style={{
                    overflow: "auto",
                    position: "relative",
                    height:
                        typeof containerHeight === "number"
                            ? pxToRem(containerHeight)
                            : containerHeight,
                }}
                role="application"
                aria-label="Scrollable data table"
                tabIndex={0}
            >
                <table
                    style={{ display: "grid" }}
                    className="w-full"
                    role="table"
                    aria-label="Data table with sortable columns"
                    aria-rowcount={totalDBRowCount}
                    aria-colcount={
                        table.getAllLeafColumns().length +
                        (enableRowSelection ? 1 : 0) +
                        1
                    }
                >
                    <thead
                        style={{
                            display: "grid",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                        className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
                        role="rowgroup"
                    >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                style={{ display: "flex", width: "100%" }}
                                role="row"
                            >
                                {enableRowSelection && (
                                    <th
                                        style={{
                                            display: "flex",
                                            width: "48px",
                                            position: "relative",
                                        }}
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider border-r border-gray-200"
                                        role="columnheader"
                                        aria-label="Select all rows"
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                checked={table.getIsAllRowsSelected()}
                                                ref={(el) => {
                                                    if (el)
                                                        el.indeterminate =
                                                            table.getIsSomeRowsSelected();
                                                }}
                                                onChange={table.getToggleAllRowsSelectedHandler()}
                                                aria-label={
                                                    table.getIsAllRowsSelected()
                                                        ? "Deselect all rows"
                                                        : table.getIsSomeRowsSelected()
                                                        ? "Select all rows (some currently selected)"
                                                        : "Select all rows"
                                                }
                                            />
                                        </div>
                                    </th>
                                )}
                                {/* Row Index Column */}
                                <th
                                    style={{
                                        display: "flex",
                                        width: "60px",
                                        position: "relative",
                                    }}
                                    className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider border-r border-gray-200"
                                    role="columnheader"
                                    aria-label="Row number"
                                >
                                    <div className="flex items-center justify-center">
                                        <span>No.</span>
                                    </div>
                                </th>
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const sortDirection =
                                        header.column.getIsSorted();
                                    const columnName =
                                        typeof header.column.columnDef
                                            .header === "string"
                                            ? header.column.columnDef.header
                                            : header.id;

                                    return (
                                        <th
                                            key={header.id}
                                            style={{
                                                display: "flex",
                                                width: pxToRem(
                                                    header.getSize()
                                                ),
                                                position: "relative",
                                            }}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider border-r border-gray-200 last:border-r-0"
                                            role="columnheader"
                                            aria-sort={
                                                !canSort
                                                    ? "none"
                                                    : sortDirection === "asc"
                                                    ? "ascending"
                                                    : sortDirection === "desc"
                                                    ? "descending"
                                                    : "none"
                                            }
                                            aria-label={
                                                canSort
                                                    ? `${columnName}, sortable column, ${
                                                          sortDirection ===
                                                          "asc"
                                                              ? "sorted ascending"
                                                              : sortDirection ===
                                                                "desc"
                                                              ? "sorted descending"
                                                              : "not sorted"
                                                      }`
                                                    : columnName
                                            }
                                        >
                                            <div
                                                {...{
                                                    className:
                                                        header.column.getCanSort()
                                                            ? "cursor-pointer select-none flex items-center space-x-1 hover:text-gray-900 transition-colors duration-150 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                                            : "flex items-center",
                                                    onClick: enableSorting
                                                        ? header.column.getToggleSortingHandler()
                                                        : undefined,
                                                    onKeyDown:
                                                        enableSorting && canSort
                                                            ? (
                                                                  e: React.KeyboardEvent
                                                              ) => {
                                                                  if (
                                                                      e.key ===
                                                                          "Enter" ||
                                                                      e.key ===
                                                                          " "
                                                                  ) {
                                                                      e.preventDefault();
                                                                      header.column.getToggleSortingHandler()?.(
                                                                          e
                                                                      );
                                                                  }
                                                              }
                                                            : undefined,
                                                    tabIndex:
                                                        enableSorting && canSort
                                                            ? 0
                                                            : -1,
                                                    role: canSort
                                                        ? "button"
                                                        : undefined,
                                                }}
                                            >
                                                <span>
                                                    {flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext()
                                                    )}
                                                </span>
                                                {enableSorting &&
                                                    header.column.getCanSort() && (
                                                        <span
                                                            className="ml-1"
                                                            aria-hidden="true"
                                                        >
                                                            {header.column.getIsSorted() ===
                                                            "asc" ? (
                                                                <svg
                                                                    className="w-4 h-4 text-blue-600"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            ) : header.column.getIsSorted() ===
                                                              "desc" ? (
                                                                <svg
                                                                    className="w-4 h-4 text-blue-600"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                    )}
                                            </div>
                                            {enableColumnResizing && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 transition-colors duration-150 ${
                                                        header.column.getIsResizing()
                                                            ? "bg-blue-600"
                                                            : "bg-transparent"
                                                    }`}
                                                    style={{
                                                        userSelect: "none",
                                                        touchAction: "none",
                                                    }}
                                                    role="separator"
                                                    aria-label={`Resize ${columnName} column`}
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === "Enter" ||
                                                            e.key === " "
                                                        ) {
                                                            e.preventDefault();
                                                            // Focus management for keyboard users
                                                            (
                                                                e.target as HTMLElement
                                                            ).focus();
                                                        }
                                                    }}
                                                />
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody
                        style={{
                            display: "grid",
                            height: rowVirtualizer.getTotalSize(),
                            position: "relative",
                        }}
                        role="rowgroup"
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const row = rows[virtualRow.index] as Row<T>;
                            const isEven = virtualRow.index % 2 === 0;
                            const rowNumber = virtualRow.index + 1;

                            return (
                                <tr
                                    data-index={virtualRow.index}
                                    ref={(node) =>
                                        rowVirtualizer.measureElement(node)
                                    }
                                    key={row.id}
                                    className={clsx(
                                        rowClassName?.(row),
                                        isEven ? "bg-white" : "bg-gray-50/30",
                                        "hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100"
                                    )}
                                    style={{
                                        display: "flex",
                                        position: "absolute",
                                        transform: `translateY(${virtualRow.start}px)`,
                                        width: "100%",
                                    }}
                                    role="row"
                                    aria-rowindex={rowNumber}
                                    aria-selected={
                                        enableRowSelection
                                            ? row.getIsSelected()
                                            : undefined
                                    }
                                >
                                    {enableRowSelection && (
                                        <td
                                            style={{
                                                display: "flex",
                                                width: "48px",
                                                position: "relative",
                                            }}
                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 tracking-wider border-r border-gray-200"
                                            role="cell"
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    checked={row.getIsSelected()}
                                                    onChange={row.getToggleSelectedHandler()}
                                                    aria-label={`Select row ${rowNumber}`}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {/* Row Index Cell */}
                                    <td
                                        style={{
                                            display: "flex",
                                            width: "60px",
                                            position: "relative",
                                        }}
                                        className="px-4 py-3 text-center text-xs font-semibold text-gray-700 tracking-wider border-r border-gray-200"
                                        role="cell"
                                        aria-label={`Row ${rowNumber}`}
                                    >
                                        <div className="flex items-center justify-center w-full">
                                            <span>{rowNumber}</span>
                                        </div>
                                    </td>
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            style={{
                                                display: "flex",
                                                width: pxToRem(
                                                    cell.column.getSize()
                                                ),
                                            }}
                                            className="px-4 py-3 text-xs text-gray-900 border-r border-gray-100 last:border-r-0 items-center"
                                            role="cell"
                                            aria-describedby={`column-${cell.column.id}`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
