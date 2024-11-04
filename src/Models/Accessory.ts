import {ItemDataType} from "rsuite/CascadeTree";
import {Moddle} from "bpmn-js/lib/model/Types";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import ExtensionElement from "./ExtensionElement.ts";
import {is} from "bpmn-js/lib/util/ModelUtil";

export class Accessory extends ExtensionElement {
    name: string;
    quantity: number;

    constructor(id: string, name: string, quantity: number) {
        super(id);
        this.name = name;
        this.quantity = quantity;
    }

    toItemDataType(): ItemDataType {
        return {
            value: this.id,
            label: this.name
        }
    }

    newElement(moddle: Moddle): Shape {
        return moddle.create("factory:Accessory", {
            id: this.id,
            name: this.name,
            quantity: this.quantity,
        });
    }

    overwrite(oldElement: Shape, _moddle: Moddle): Shape {
        oldElement.name = this.name;
        oldElement.quantity = this.quantity;

        return oldElement;
    }

    deleteFromExtensionElements(oldValues: Array<Shape>): Array<Shape> {
        // Remove factory:accessory in the first level of the array
        let newValues = oldValues.filter(element => element.id !== this.id);

        // Remove factory:compatibilityAccessory with this.id in each compatibility and update each compatibility
        newValues = newValues
            .filter(element => is(element, "factory:Compatibility"))
            .map(compatibility => {
                compatibility.accessories = compatibility.accessories.filter((accessory: Shape) => accessory.id !== this.id)
                return compatibility
            });

        return newValues;
    }
}