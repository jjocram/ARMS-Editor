import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import Product from "./Product.ts";

class ProductExecutor {
    id: string;
    name: string;
    time: number
    timeUnit: "s" | "m" | "h" | "d";
    idActivity: string;
    idExecutor: string

    constructor(id: string, name: string, time: number, timeUnit: "s" | "m" | "h" | "d", idActivity: string, idExecutor: string) {
        this.id = id;
        this.name = name;
        this.time = time;
        this.timeUnit = timeUnit;
        this.idActivity = idActivity;
        this.idExecutor = idExecutor;
    }

    toTreeNode(): TreeNode {
        return {
            value: `${this.id}${this.idExecutor}${this.idActivity}`,
            label: this.name,
        }
    }
}

export class ExecutorElement extends BaseElement {
    associatedProducts: Array<ProductExecutor>;

    constructor(shape: Shape | null, finalProducts: Map<string, Product>) {
        super(shape);

        if (shape === null) {
            this.associatedProducts = [];
        }
        this.associatedProducts = shape?.businessObject.product.map((product: Shape )=> new ProductExecutor(product.id, finalProducts.get(product.id)!.name, product.time, product.timeUnit, product.idActivit, this.id));
    }

    toTreeNode(): TreeNode {
        return {
            value: this.id,
            label: this.name,
            children: this.associatedProducts.map(product => product.toTreeNode())
        }
    }
}