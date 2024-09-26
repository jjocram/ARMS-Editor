import {ItemDataType} from "rsuite/CascadeTree";
import Modeler from "bpmn-js/lib/Modeler";
import {Moddle} from "bpmn-js/lib/model/Types";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Shape} from "bpmn-js/lib/model/Types.ts";

export default class Product {
    id: string;
    name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    toItemDataType(): ItemDataType {
        return {
            value: this.id,
            label: this.name,
        }
    }

    createInModel(modeler: Modeler) {
        const moddle = modeler.get("moddle") as Moddle;
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements")

        const newProduct = moddle.create("factory:Product");
        newProduct.id = this.id;
        newProduct.name = this.name;

        extensionElements.get("values").push(newProduct);
    }
}