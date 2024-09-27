import {ItemDataType} from "rsuite/CascadeTree";
import Modeler from "bpmn-js/lib/Modeler";
import {Moddle} from "bpmn-js/lib/model/Types";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";

export default class Product {
    id: string;
    name: string;
    finalQuantity?: number;

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
        const extensionElements = processElement.businessObject.get("extensionElements");

        const newProduct = moddle.create("factory:Product", {
            id: this.id,
            name: this.name,
        });

        if (this.finalQuantity) {
            newProduct.quantity = this.finalQuantity;
        }

        extensionElements.get("values").push(newProduct);
    }

    save(modeler: Modeler) {
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements");

        const oldProduct = extensionElements.get("values")
            .find((element: Shape) => element.id === this.id);

        if (oldProduct) {
            // Update old
            const modeling = modeler.get("modeling") as Modeling;

            extensionElements.values = extensionElements.get("values")
                .map((element: Shape) => {
                    if (element.id === oldProduct.id) {
                        element.name = this.name;
                        if (this.finalQuantity) {
                            element.quantity = this.finalQuantity;
                        }
                    }

                    return element;
                })

            modeling.updateProperties(processElement, {extensionElements});
        } else {
            this.createInModel(modeler);
        }
    }
}