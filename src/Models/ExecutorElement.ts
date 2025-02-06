import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {ButtonTreeNode} from "../components/ButtonTreeNode.ts";
import Compatibility from "./Compatibility.ts";

export class ExecutorElement extends BaseElement {

    associatedCompatibilities: Array<Compatibility>;
    quantity: number;

    constructor(shape: Shape | null, associatedCompatibilities: Array<Compatibility>) {
        super(shape);
        this.associatedCompatibilities = associatedCompatibilities;
        this.quantity = shape?.quantity ?? 1;
    }

    toTreeNodeWithAssociatedProducts(): TreeNode {
        const children = this.associatedCompatibilities.map(product => product.toTreeNode());
        children.push(ButtonTreeNode(this.id));

        return {
            value: this.id,
            label: this.name ? this.name : this.id,
            children: children
        }
    }

    additionalInfo(): Array<string> {
        return ["quantity"];
    }
}