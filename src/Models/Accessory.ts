import {ItemDataType} from "rsuite/CascadeTree";
import {Moddle} from "bpmn-js/lib/model/Types";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import ExtensionElement from "./ExtensionElement.ts";

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
}