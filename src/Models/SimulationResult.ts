import {BaseElement} from "./BaseElement.ts";

interface SimulationResult {
    totalTime: number;
}

interface ExecutorActivityResult {
    id: string;
    maxWaitTimeInQueue: number;
    avgWaitTimeInQueue: number;
    sumWaitTimeInQueue: number;
    busy: number;
    processedItems: number;
}

interface ExecutorResult {
    id: string;
    maxWaitTimeInQueue: number;
    avgWaitTimeInQueue: number;
    sumWaitTimeInQueue: number;
    busy: number;
    idle: number;
    processedItems: number;
    avgQueueLength: number;
    varQueueLength: number;
    stdQueueLength: number;
    maxQueueLength: number;
    activities: ExecutorActivityResult[];
}

export interface MetricResult {
    simulation: SimulationResult
    executors: ExecutorResult[];
}

export function toDataForSimulationTimeBarChart(metricResult: MetricResult) {
    return [
        {
            "name": "Total Time",
            "Simulated": metricResult.simulation.totalTime
        }
    ];
}

function getGenericExecutorId(executorId: string): string {
    return executorId.replace(/-[^-]*/, '')
}

export function getAllExecutorsId(metricResult: MetricResult): string[] {
    return metricResult.executors.map((executorResult) => getGenericExecutorId(executorResult.id));
}

export function getExecutorsBusyTimePerActivity(executorId: string, metricResult: MetricResult, activities: Map<string, BaseElement>) {
    const executorResult = metricResult.executors.filter((executor) => getGenericExecutorId(executor.id) === executorId);
    return executorResult.map(executor => executor.activities.map((activity) => {
        return {
            id: activity.id,
            name: activities.get(activity.id)?.name ?? activity.id,
            value: activity.busy
        }
    }))
}