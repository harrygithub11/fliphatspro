import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const deepMerge = (target: any, source: any) => {
    const output = { ...target };
    if (source && typeof source === 'object' && !Array.isArray(source)) {
        Object.keys(source).forEach(key => {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
                output[key] = deepMerge(targetValue || {}, sourceValue);
            } else if (Array.isArray(sourceValue) && sourceValue.length === 0 && Array.isArray(targetValue) && targetValue.length > 0) {
                // Keep default items if source array is explicitly empty
                output[key] = targetValue;
            } else if ((sourceValue === null || sourceValue === undefined || sourceValue === "") && targetValue !== undefined && targetValue !== null && targetValue !== "") {
                // Prefer non-empty default over empty/null source
                output[key] = targetValue;
            } else {
                output[key] = sourceValue;
            }
        });
    }
    return output;
};
