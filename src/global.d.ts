import type { ColumnDef, Row, SortingState } from "@tanstack/react-table";

declare global {
    type DeepPartial<T> = {
        [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
    };
    type ClassName =
        | undefined
        | string
        | ClassName[]
        | { [key: string]: boolean };
    type Action = { type: string; payload?: unknown };
    type ContextStoreOption<T> = {
        reducer?: (state: T, action: Action) => void;
        persistKey?: string;
        persistFields?: (keyof T)[];
    };
    type UseDebouncedStateOptions<T> = {
        delay?: number;
        onDebounce?: DebounceCallback<T>;
        leadingCall?: boolean;
    };
    type UseThrottledStateOptions<T> = {
        delay?: number;
        onThrottle?: ThrottledCallback<T>;
        leadingCall?: boolean;
    };
    type PopoverBox = {
        width: number;
        height: number;
        top: number | null;
        left: number | null;
        bottom: number | null;
        right: number | null;
    };
    type UsePopoverReturn = {
        expand: boolean;
        popoverBox: PopoverBox;
        setExpand: (expand: boolean) => void;
        togglePopover: () => void;
        isClickedOutside: boolean;
        setIsClickedOutside: (clicked: boolean) => void;
    };
    type CheckboxProps = {
        checked?: boolean;
        checkboxType?: "default" | "indeterminate" | "checked";
        checkboxSize?: "base" | "xs" | "sm" | "md" | "lg";
        className?: string;
        value?: string | number | readonly string[];
        onChange?: React.ChangeEventHandler<HTMLInputElement>;
        id?: string;
        readOnly?: boolean;
        disabled?: boolean;
        checkboxColor?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>;
    type ChipProps = {
        className?: string;
        variant?: "neutral" | "info" | "success" | "error" | "warning";
        onRemove?: (option: T) => void;
        label?: string;
    } & React.HTMLAttributes<HTMLDivElement>;
    type EmptyDataProps = {
        placeholder?: string;
        className?: string;
        icon?: React.ReactHTMLElement;
        useDefaultIcon?: boolean;
        defaultIconClassName?: string;
    };
    interface PageData<T> {
        data: T[];
        meta: {
            totalRowCount: number;
        };
    }

    interface VirtualizedTableProps<T> {
        columns: ColumnDef<T>[];
        queryKey: string | (string | unknown)[];
        fetchFn: (
            start: number,
            size: number,
            sorting: SortingState
        ) => Promise<PageData<T>>;
        fetchSize?: number;
        containerHeight?: string | number;
        estimatedRowHeight?: number;
        scrollThreshold?: number;
        overscan?: number;
        enableSorting?: boolean;
        enableColumnResizing?: boolean;
        initialSorting?: SortingState;
        onSortingChange?: (sorting: SortingState) => void;
        rowClassName?: (row: Row<T>) => string;
        containerClassName?: string;
        loadingComponent?: React.ReactNode;
        fetchingComponent?: React.ReactNode;
        enableRowSelection?: boolean;
        rowKey?: string;
        onRowSelectionChange?: (row: onRowSelectionChange) => void;
        enableColumnToggling?: boolean;
        initColumnVisibility?: VisibilityState;
        onColumnVisibilityChange?: (visibility: VisibilityState) => void;
    }
}

export {};
