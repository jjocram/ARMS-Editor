import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import Modeler from "bpmn-js/lib/Modeler";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {ExecutorElement} from "./ExecutorElement.ts";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import Compatibility from "./Compatibility.ts";
import {Connection} from "bpmn-js/lib/model/Types";
import {Element} from "diagram-js/lib/model/Types"


export class ActivityElement extends BaseElement {
    static elementTypes: Array<string> = ["bpmn:Task", "factory:Batch"];

    connectedExecutors: Array<ExecutorElement>;
    affinity: string | null = null;
    priority: string = "0";

    constructor(shape: Shape | null, modeler: Modeler, compatibilities: Array<Compatibility>) {
        super(shape);
        if (shape === null) {
            this.connectedExecutors = [];
        }

        this.connectedExecutors = (modeler.get("elementRegistry") as ElementRegistry) // From whole element registry
            .filter(element => is(element, "factory:Connection")) // take only the factory:Connection which connects activities to executors
            .filter(connection => connection.source.id === this.id || connection.target.id === this.id) // take only the connections which have this activity as source or target
            .map(connection => connection.source.id === this.id ? connection.target : connection.source) // pick the element which is not this activity
            .filter(element => is(element, "factory:Executor")) // take only the factory:Executors elements (maybe for future extensions)
            .map(element => {
                const executorCompatibilities = compatibilities.filter(compatibility => compatibility.idActivity === this.id && compatibility.idExecutor === element.id);
                return new ExecutorElement(element, executorCompatibilities);
            }); // transform into ExecutorElement
    }

    override needCompatibilities(): boolean {
        return true;
    }

    override needTransformations(): boolean {
        return true;
    }

    override needAffinity(): boolean {
        return true;
    }

    override needPriority(): boolean {
        return true;
    }

    previousActivities(modeler: Modeler): Array<{label: string, value: string}> {
        const elementRegistry: ElementRegistry = modeler.get("elementRegistry");

        const precedingActivities: Set<Element> = new Set();
        const visitedIds = new Set();

        const traverseUpstream = (currentId: string) => {
            if (visitedIds.has(currentId)) {
                return;
            }

            visitedIds.add(currentId);

            const element = elementRegistry.get(currentId);

            if (!element || !element.incoming || element.incoming.length === 0) {
                return;
            }

            element.incoming.forEach((flow: Connection) => {
                const predecessor = flow.source;
                if (predecessor) {
                    if (is(predecessor, "bpmn:Task") && predecessor.id !== this.id) {
                        precedingActivities.add(predecessor);
                    }

                    traverseUpstream(predecessor.id);
                }
            });
        }

        traverseUpstream(this.id);

        return Array.from(precedingActivities).map((element: Element) => {return {label: element.businessObject.name ?? `Name undefined (${element.id})`, value: element.id}});
    }
}