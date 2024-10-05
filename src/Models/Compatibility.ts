import {ItemDataType} from "rsuite/CascadeTree";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import Product from "./Product.ts";
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
    product: Product;
    accessories: Array<AccessoryCompatibility>;


    constructor(id: string, time: number, timeUnit: AcceptedTimeUnit, batchQuantity: number, idActivity: string, idExecutor: string, product: Product, accessories: Array<AccessoryCompatibility>) {
        super(id);
        this.time = time;
        this.timeUnit = timeUnit;
        this.batchQuantity = batchQuantity;
        this.idActivity = idActivity;
        this.idExecutor = idExecutor;
        this.product = product;
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
            idProduct: this.product.id,
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
        oldElement.idProduct = this.product.id;
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

}