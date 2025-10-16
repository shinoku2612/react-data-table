import { VirtualizedTable } from "@/components/ui/table";
import useViewportScale from "@/hooks/useViewportScale";
import { fetchData } from "@/services/data.service";
import { useGlobalStore, userGlobalDispatch } from "@/stores/global.store";
import type { User } from "@/type/user";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

const App = () => {
    // [SETUPS]
    useViewportScale(1280, 0.75, 7.5);

    // [STATES]
    const columnVisibility = useGlobalStore((store) => store.columnVisibility);
    const globalDispatch = userGlobalDispatch();
    const userColumns = useMemo<ColumnDef<User>[]>(
        () => [
            { accessorKey: "id", header: "ID", sortingFn: "text", size: 180 },
            {
                accessorKey: "bio",
                header: "Bio",
                size: 320,
            },
            { accessorKey: "name", header: "Name" },
            { accessorKey: "language", header: "Language" },
            { accessorKey: "version", header: "Version", size: 100 },
            {
                accessorKey: "state",
                header: "State",
                cell: () => <span>Los Angeles</span>,
            },
            {
                accessorKey: "createdDate",
                header: "Created Date",
                sortingFn: "datetime",
                cell: () => (
                    <span className="text-nowrap">
                        {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </span>
                ),
            },
        ],
        []
    );

    // [RENDERS]
    return (
        <div className="container p-2.5">
            <VirtualizedTable<User>
                columns={userColumns}
                queryKey={["users"]}
                fetchFn={fetchData}
                containerHeight={560}
                initColumnVisibility={columnVisibility}
                onColumnVisibilityChange={(visibility) => {
                    globalDispatch(
                        (store) => (store.columnVisibility = visibility)
                    );
                }}
            />
        </div>
    );
};

export default App;
