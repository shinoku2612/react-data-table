function deepClonePolyfill<T>(source: T): T {
    if (source === null || typeof source !== "object") {
        return source;
    }

    if (Array.isArray(source)) {
        return source.map((item) => deepClonePolyfill(item)) as unknown as T;
    }

    if (typeof source === "function") {
        return source;
    }

    const clonedObject: Record<string, unknown> = {};
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            clonedObject[key] = deepClonePolyfill(
                (source as Record<string, unknown>)[key]
            );
        }
    }
    return clonedObject as T;
}

export function deepClone<T>(source: T): T {
    try {
        if (typeof structuredClone === "function") {
            return structuredClone(source);
        }
        return deepClonePolyfill(source);
    } catch (error) {
        if ((error as Error).name !== "DataCloneError") console.log(error);
        return deepClonePolyfill(source);
    }
}
export function deepEqual(source: unknown, destination: unknown): boolean {
    if (source === destination) return true;

    if (
        source == null ||
        typeof source !== "object" ||
        destination == null ||
        typeof destination !== "object"
    ) {
        return false;
    }

    // Handle array comparison explicitly
    if (Array.isArray(source) && Array.isArray(destination)) {
        if (source.length !== destination.length) return false;
        return source.every((item, index) =>
            deepEqual(item, destination[index])
        );
    }

    const sourceObj = source as Record<string, unknown>;
    const destinationObj = destination as Record<string, unknown>;

    const sourceKeys = Object.keys(sourceObj);
    const destinationKeys = Object.keys(destinationObj);

    if (sourceKeys.length !== destinationKeys.length) return false;

    return sourceKeys.every(
        (key) =>
            destinationKeys.includes(key) &&
            deepEqual(sourceObj[key], destinationObj[key])
    );
}

export function isPlainObject(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) === "[object Object]"
    );
}

export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
    // If source is undefined or null, return target
    if (source === undefined || source === null) {
        return target;
    }

    // Create a deep copy of target to avoid mutating it directly
    const result = deepClone(target) as T;

    // Iterate through source properties
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const targetValue = result[key];
            const sourceValue = source[key];

            // If source value is undefined, skip it
            if (sourceValue === undefined) {
                continue;
            }

            // If both values are plain objects, recursively merge them
            if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
                result[key] = deepMerge(
                    targetValue,
                    sourceValue as DeepPartial<typeof targetValue>
                ) as T[typeof key];
            }
            // Otherwise, use the source value directly
            else {
                result[key] = sourceValue as T[typeof key];
            }
        }
    }

    return result;
}

export function isNil(value: unknown): boolean {
    return value === null || value === undefined;
}

export function createMirrorObject(
    source: Record<string, string | number | boolean>
) {
    if (!isPlainObject(source)) return {};

    const enumObject: Record<string, unknown> = {};
    const sourceObjectEntries = Object.entries(source);
    for (const [key, value] of sourceObjectEntries) {
        enumObject[key] = value;
        enumObject[value.toString()] = key;
    }

    return enumObject;
}
