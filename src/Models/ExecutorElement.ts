import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {ButtonTreeNode} from "../components/ButtonTreeNode.ts";
import Compatibility from "./Compatibility.ts";

export class ExecutorElement extends BaseElement {

    associatedCompatibilities: Array<Compatibility>;

    constructor(shape: Shape | null, associatedCompatibilities: Array<Compatibility>) {
        super(shape);
        this.associatedCompatibilities = associatedCompatibilities;
    }

    toTreeNodeWithAssociatedProducts(): TreeNode {
        const children = this.associatedCompatibilities.map(product => product.toTreeNode());
        children.push(ButtonTreeNode(this.id));

        return {
            value: this.id,
            label: this.name,
            children: children
        }
    }
}