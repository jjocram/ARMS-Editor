export interface ColorRange {
    min: number;
    max: number;
    color: string;
}

export type TypeOfMetrics = "availability" | "queueLength"

export interface ExecutorMetricsRanges {
    availability: ColorRange[];
    queueLength: ColorRange[];
}

export function getFromLocalStorageOrDefault(): ExecutorMetricsRanges {
    const defaultRanges: ExecutorMetricsRanges = {
        availability: [
            {
                min: 0,
                max: 0.5,
                color: "#ff1100"
            },
            {
                min: 0.5,
                max: 0.75,
                color: "#ffff00"
            },
            {
                min: 0.75,
                max: 1.0,
                color: "#00ff00"
            }],
        queueLength: [
            {
                min: 0,
                max: 0.5,
                color: "#ff1100"
            },
            {
                min: 0.5,
                max: 0.75,
                color: "#ffff00"
            },
            {
                min: 0.75,
                max: 1.0,
                color: "#00ff00"
            }]
    }

    return localStorage.getItem("executorsColorThresholds") ? JSON.parse(localStorage.getItem("executorsColorThresholds")!) : defaultRanges;
}

export function setToLocalStorage(executorMetricsRanges: ExecutorMetricsRanges) {
    return localStorage.setItem("executorsColorThresholds", JSON.stringify(executorMetricsRanges));
}