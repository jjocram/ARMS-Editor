import {ItemDataType} from "rsuite/CascadeTree";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import ExtensionElement from "./ExtensionElement.ts";
import {Moddle} from "bpmn-js/lib/model/Types";
import {Shape} from "bpmn-js/lib/model/Types.ts";

export type AcceptedTimeUnit = "s" | "m" | "h" | "d";

export class AccessoryCompatibility {
    id: string;
    quantity: number;

    constructor(id: string, quantity: number) {
        this.id = id;
        this.quantity = quantity;
    }
}

export default class Compatibility extends ExtensionElement {
    time: number;
    timeUnit: AcceptedTimeUnit;
    batchQuantity: number;
    idActivity: string;
    idExecutor: string;
    productProperties: Map<string, string>;
    accessories: Array<AccessoryCompatibility>;


    constructor(id: string, time: number, timeUnit: AcceptedTimeUnit, batchQuantity: number, idActivity: string, idExecutor: string, productProperties: Map<string, string>, accessories: Array<AccessoryCompatibility>) {
        super(id);
        this.time = time;
        this.timeUnit = timeUnit;
        this.batchQuantity = batchQuantity;
        this.idActivity = idActivity;
        this.idExecutor = idExecutor;
        this.productProperties = productProperties;
        this.accessories = accessories;
    }

    toTreeNode(): TreeNode {
        return {
            value: `${this.id}`,
            label: JSON.stringify(this),
        }
    }

    static acceptedTimeUnitsToItemDataType: Array<ItemDataType> = ["s", "m", "h", "d"].map(s => {
        return {
            value: s,
            label: s,
        }
    });

    newElement(moddle: Moddle): Shape {
        return moddle.create("factory:Compatibility", {
            id: this.id,
            time: this.time,
            timeUnit: this.timeUnit,
            batch: this.batchQuantity,
            idActivity: this.idActivity,
            idExecutor: this.idExecutor,
            productProperties: Array.from(this.productProperties, ([key, value]) => {
                return moddle.create("factory:ProductProperty", {
                    key: key,
                    value: value
                })
            }),
            accessories: this.accessories.map(accessory => {
                return moddle.create("factory:AccessoryCompatibility", {
                    id: accessory.id,
                    quantity: accessory.quantity
                });
            })
        });
    }

    overwrite(oldElement: Shape, moddle: Moddle): Shape {
        oldElement.time = this.time;
        oldElement.timeUnit = this.timeUnit;
        oldElement.batch = this.batchQuantity;
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
        oldElement.accessories = this.accessories.map(accessory => {
            const accessoryToChange = oldElement.accessories?.find((a: Shape) => a.id === accessory.id);
            if (accessoryToChange) {
                accessoryToChange.id = accessory.id;
                accessoryToChange.quantity = accessory.quantity;
                return accessoryToChange;
            } else {
                return moddle.create("factory:AccessoryCompatibility", {
                    id: accessory.id,
                    quantity: accessory.quantity
                });
            }
        });

        return oldElement;
    }

    deleteFromExtensionElements(oldValues: Array<Shape>): Array<Shape> {
        return oldValues.filter(element => element.id !== this.id);
    }

}