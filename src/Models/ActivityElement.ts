import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import Modeler from "bpmn-js/lib/Modeler";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {ExecutorElement} from "./ExecutorElement.ts";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import Product from "./Product.ts";


export class ActivityElement extends BaseElement {
    static elementTypes: Array<string> = ["bpmn:Task", "factory:Batch"];

    connectedExecutors: Array<ExecutorElement>;

    constructor(shape: Shape | null, modeler: Modeler, finalProducts: Map<string, Product>) {
        super(shape);
        if (shape === null) {
            this.connectedExecutors = [];
        }

        this.connectedExecutors = (modeler.get("elementRegistry") as ElementRegistry) // From whole element registry
            .filter(element => is(element, "factory:Connection")) // take only the factory:Connection which connects activities to executors
            .filter(connection => connection.source.id === this.id || connection.target.id === this.id) // take only the connections which have this activity as source or target
            .map(connection => connection.source.id === this.id ? connection.target : connection.source) // pick the element which is not this activity
            .filter(element => is(element, "factory:Executor")) // take only the factory:Executors elements (maybe for future extensions)
            .map(element => new ExecutorElement(element, finalProducts)); // transform into ExecutorElement
    }

    override needCompatibilities(): boolean {
        return true;
    }

    override needTransformations(): boolean {
        return true;
    }
}