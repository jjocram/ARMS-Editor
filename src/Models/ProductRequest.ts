import ExtensionElement from "./ExtensionElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {Moddle} from "bpmn-js/lib/model/Types";

export default class ProductRequest extends ExtensionElement {
    productProperties: Map<string, string>;
    quantity: number;

    constructor(id: string, productProperties: Map<string, string>, quantity: number) {
        super(id);
        this.productProperties = productProperties;
        this.quantity = quantity;
    }

    deleteFromExtensionElements(oldValues: Array<Shape>): Array<Shape> {
        return oldValues.filter(element => element.id !== this.id);
    }

    newElement(moddle: Moddle): Shape {
        return moddle.create("factory:ProductRequest", {
            id: this.id,
            productProperties: Array.from(this.productProperties, ([key, value]) => {
                return moddle.create("factory:ProductProperty", {
                    key: key,
                    value: value
                })
            }),
            quantity: this.quantity
        });
    }

    overwrite(oldElement: Shape, moddle: Moddle): Shape {
        oldElement.quantity = this.quantity;
        oldElement.productProperties = [...this.productProperties.entries()].map(([key, value]) => {
            const propertyToChange = oldElement.productProperties?.find((p: Shape) => p.key === key);
            if (propertyToChange) {
                propertyToChange.value = value;
                return propertyToChange;
            } else {
                return moddle.create("factory:ProductProperty", {
                    key: key,
                    value: value
                })
            }
        });

        return oldElement;
    }

}