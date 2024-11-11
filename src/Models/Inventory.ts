import {ItemDataType} from "rsuite/CascadeTree";
import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";

export default class Inventory extends BaseElement{
    startQuantity: number;

    constructor(shape: Shape | null, startQuantity: number) {
        super(shape);
        this.startQuantity = startQuantity;
    }

    toItemData(): ItemDataType {
        return {
            value: this.id,
            label: this.name
        };
    }

    additionalInfo(): Array<string> {
        return ["startQuantity"];
    }
};