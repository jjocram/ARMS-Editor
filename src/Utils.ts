import {Shape} from "bpmn-js/lib/model/Types.ts";
import {BaseElement} from "./Models/BaseElement.ts";
import {ActivityElement} from "./Models/ActivityElement.ts";
import {ExecutorElement} from "./Models/ExecutorElement.ts";
import {ModelerContext} from "./ModelerContext.ts";
import {ExecutorMetricsRanges, TypeOfMetrics} from "./ExecutorsColorRanges.ts";

export function generateId(elementType: string) {
    const randomString = Math.random().toString(36).substring(2, 9);
    return `${elementType}_${randomString}`;
}

export function setSpecificElementFromShape(shape: Shape, setElement: (element: BaseElement) => void, modelerRef: ModelerContext) {
    if (ActivityElement.elementTypes.includes(shape.type)) {
        setElement(new ActivityElement(shape, modelerRef.modeler.current!, modelerRef.compatibilities!));
    } else if (shape.type === "factory:Executor") {
        setElement(new ExecutorElement(shape, []));
    } else if (shape.type === "factory:Inventory") {
        setElement(modelerRef.inventories.get(shape.id)!);
    } else {
        setElement(new BaseElement(shape));
    }
}

export function getExecutorColorClass(value: number, selectedMetric: TypeOfMetrics, metricsThresholds: ExecutorMetricsRanges): string {
    const selectedMetricRanges = metricsThresholds[selectedMetric];

    return selectedMetricRanges.find(range => range.min < value && value <= range.max)?.color ?? "white";
}