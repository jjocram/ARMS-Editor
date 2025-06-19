import {BaseElement} from "./BaseElement.ts";
import Compatibility from "./Compatibility.ts";

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

export function toDataForSimulationTimeBarChart(metricResult: MetricResult, compatibilities: Compatibility[]) {
    return [
        {
            "name": "Total Time",
            "Simulated": metricResult.simulation.totalTime,
            "Ideal": getIdealTime(metricResult, compatibilities)
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

export function getExecutorsAvailability(metricResult: MetricResult) {
    const executorsAverageAvailability = new Map<string, number>()

    metricResult.executors
        .map((executor) => {
            const totalTime = executor.busy + (executor.sumWaitTimeInQueue || 0);
            const value = totalTime === 0 ? 0 : executor.busy / totalTime;
            return {
                id: getGenericExecutorId(executor.id),
                value: value
            }
        })
        .reduce((previous, currentItem) => {
            const group = currentItem.id;
            if (!previous.has(group)) previous.set(group, []);
            previous.get(group)!.push(currentItem.value);
            return previous;
        }, new Map<string, number[]>())
        .forEach((values, id) => {
            const sum = values.reduce((sum, currentValue) => sum + currentValue, 0);
            const avg = sum / values.length;
            executorsAverageAvailability.set(id, avg);
        });

    return executorsAverageAvailability;
}

export function getIdealTime(metricResult: MetricResult, compatibilities: Compatibility[]): number {
    const timeUnitConverter = {
        "s": 1 / 60,
        "m": 1,
        "h": 60,
        "d": 1440
    }

    return metricResult.executors.reduce((total, executor) => {
        const executorTotal = executor.activities.reduce((sum, activity) => {
            const compatibility = compatibilities.find((comp: Compatibility) => comp.idActivity === activity.id && comp.idExecutor === getGenericExecutorId(executor.id));
            const idealTime = (compatibility && timeUnitConverter[compatibility.timeUnit]) ? Number(compatibility.time) * timeUnitConverter[compatibility.timeUnit] : 0;
            return sum + idealTime;
        }, 0);

        return total + executorTotal;
    }, 0)
}

export function toDataExecutorActivitiesBarChart(metricResult: MetricResult, executor: BaseElement, activities: Map<string, BaseElement>) {
    return metricResult.executors
        .filter((executorResult) => getGenericExecutorId(executorResult.id) === executor.id)
        .map(executorResult => {
            return {
                id: executorResult.id,
                activities: executorResult.activities.map(activityResult => {
                    console.log(activityResult)
                    return {
                        id: activityResult.id,
                        name: activities.get(activityResult.id)?.name ?? "Name not found",
                        busyPerProduct: activityResult.processedItems > 0 ? activityResult.busy / activityResult.processedItems : 0,
                        averageTime: activityResult.processedItems > 0 ? (activityResult.busy + activityResult.sumWaitTimeInQueue) / activityResult.processedItems : 0,
                        worstTime: activityResult.processedItems > 0 ? (activityResult.busy / activityResult.processedItems) + activityResult.maxWaitTimeInQueue : 0
                    }
                })
            }
        });
}

export function toDataActivityExecutorsTimePieChart(metricResult: MetricResult, activity: BaseElement, executors: Map<string, BaseElement>) {
    return getExecutorsOfActivity(metricResult, activity)
        .map((executor) => {
            const execActivity = executor.activities.find((a) => a.id === activity.id)
            return {
                id: executor.id,
                name: executors.get(getGenericExecutorId(executor.id))?.name ?? "Name not found",
                value: execActivity ? execActivity.busy : 0,
            }
        })
}

export function toDataActivityExecutorsProductsPieChart(metricResult: MetricResult, activity: BaseElement, executors: Map<string, BaseElement>) {
    return getExecutorsOfActivity(metricResult, activity)
        .map((executor) => {
            const execActivity = executor.activities.find((a) => a.id === activity.id)
            return {
                id: executor.id,
                name: executors.get(getGenericExecutorId(executor.id))?.name ?? "Name not found",
                value: execActivity ? execActivity.processedItems : 0,
            }
        })
}

function getExecutorsOfActivity(metricResult: MetricResult, activity: BaseElement) {
    return metricResult.executors
        .filter((executor) => executor.activities.some((a) => a.id === activity.id))
}