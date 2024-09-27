import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {ItemDataType} from "rsuite/CascadeTree";


export type AcceptedTimeUnit = "s" | "m" | "h" | "d";

export default class ProductExecutor {
    id: string;
    name: string;
    time: number;
    timeUnit: AcceptedTimeUnit;
    batchQuantity: number
    idActivity: string;
    idExecutor: string;

    constructor(id: string, name: string, time: number, timeUnit: "s" | "m" | "h" | "d", idActivity: string, idExecutor: string) {
        this.id = id;
        this.name = name;
        this.time = time;
        this.timeUnit = timeUnit;
        this.batchQuantity = 1; // TODO: read from constructor
        this.idActivity = idActivity;
        this.idExecutor = idExecutor;
    }

    toTreeNode(): TreeNode {
        return {
            value: `${this.id}${this.idExecutor}${this.idActivity}`,
            label: JSON.stringify(this),
        }
    }

    static acceptedTimeUnitsToItemDataType: Array<ItemDataType> = ["s", "m", "h", "d"].map(s => {
       return {
           value: s,
           label: s,
       }
    });
}