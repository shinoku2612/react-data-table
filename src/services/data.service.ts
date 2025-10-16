import type { User, UserResponse } from "@/type/user";
import type { ColumnSort, SortingState } from "@tanstack/react-table";

export async function fetchData(
    start: number,
    size: number,
    sorting: SortingState
): Promise<UserResponse> {
    try {
        const res = await fetch(
            "https://microsoftedge.github.io/Demos/json-dummy-data/5MB.json"
        );
        const data = (await res.json()) as User[];

        if (sorting.length) {
            const sort = sorting[0] as ColumnSort;
            const { id, desc } = sort as { id: keyof User; desc: boolean };
            data.sort((a, b) => {
                if (desc) {
                    return a[id]! < b[id]! ? 1 : -1;
                }
                return a[id]! > b[id]! ? 1 : -1;
            });
        }

        return {
            data: data.slice(start, start + size),
            meta: {
                totalRowCount: data.length,
            },
        };
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
}
