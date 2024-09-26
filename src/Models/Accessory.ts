import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {ItemDataType} from "rsuite/CascadeTree";
import Modeler from "bpmn-js/lib/Modeler";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Moddle} from "bpmn-js/lib/model/Types";
import {Shape} from "bpmn-js/lib/model/Types.ts";

export class Accessory {
    id: string;
    name: string;
    quantity: number;

    constructor(id: string, name: string, quantity: number) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
    }

    toItemDataType(): ItemDataType {
        return {
            value: this.id,
            label: this.name
        }
    }

    createInModel(modeler: Modeler) {
        const moddle = modeler.get("moddle") as Moddle;
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements")

        const newAccessory = moddle.create("factory:Accessory");
        newAccessory.id = this.id;
        newAccessory.name = this.name;
        newAccessory.quantity = this.quantity;

        extensionElements.get("values").push(newAccessory);
    }
}

export class ExecutorAccessory {
    id: string;
    name: string;
    quantity: number;
    idExecutor: string;


    constructor(id: string, name: string, quantity: number, idExecutor: string) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.idExecutor = idExecutor;
    }

    toTreeNode(): TreeNode {
        return {
            value: this.id,
            label: JSON.stringify(this),
        }
    }
}