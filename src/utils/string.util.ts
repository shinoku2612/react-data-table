export function getType(value: unknown) {
    const typeString = Object.prototype.toString.call(value).slice(8, -1);
    return typeString.toLowerCase();
}

export function clsx(...classList: ClassName[]): string {
    const classListSet = new Set<string>();
    for (const className of classList) {
        if (typeof className === "string") {
            classListSet.add(className);
        } else if (Array.isArray(className)) {
            classListSet.add(clsx(...className));
        } else if (className && typeof className === "object") {
            for (const [classKey, classValue] of Object.entries(className)) {
                if (typeof classValue !== "boolean") break;
                if (classValue) {
                    classListSet.add(classKey);
                } else {
                    classListSet.delete(classKey);
                }
            }
        }
    }
    return Array.from(classListSet).join(" ").trim();
}

export function camelToKebabCase(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // insert hyphen between lowercase/number and uppercase
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2") // handle consecutive uppercase (e.g. "HTMLParser")
        .toLowerCase();
}
export function normalizeText(text: string) {
    if (typeof text !== "string") return "";
    const normalizedText = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Đ/g, "D")
        .replace(/đ/g, "d");

    return normalizedText;
}
export function pxToRem(pxValue: number): string {
    if (pxValue === undefined) return "";
    if (getType(pxValue) !== "number" || isNaN(pxValue))
        return pxValue.toString();
    const EXCHANGE_COST = 16;
    const remValue = pxValue / EXCHANGE_COST;

    return `${remValue}rem`;
}
