import {BaseElement} from "./BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import Product from "./Product.ts";
import ProductExecutor from "./ProductExecutor.ts";
import Modeler from "bpmn-js/lib/Modeler";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {ExecutorAccessory} from "./Accessory.ts";
import {ButtonTreeNode} from "../components/ButtonTreeNode.ts";
import {Moddle} from "bpmn-js/lib/model/Types";

export class ExecutorElement extends BaseElement {
    associatedProducts: Array<ProductExecutor>;
    neededAccessories: Array<ExecutorAccessory>

    constructor(shape: Shape | null, finalProducts: Map<string, Product>, associatedActivityId: string | null) {
        super(shape);
        if (shape === null) {
            this.associatedProducts = [];
        }

        this.associatedProducts = shape?.businessObject.product?.map((product: Shape) => new ProductExecutor(product.id, finalProducts.get(product.id)!.name, product.time, product.timeUnit, product.idActivity, this.id)) ?? [];
        if (associatedActivityId) {
            // refine with selected activity products
            this.associatedProducts = this.associatedProducts.filter(product => product.idActivity === associatedActivityId);
        }

        this.neededAccessories = shape?.businessObject.accessories?.map((accessory: Shape) => new ExecutorAccessory(accessory.id, accessory.name, accessory.quantity, this.id)) ?? [];
    }

    toTreeNodeWithAssociatedProducts(): TreeNode {
        const children = this.associatedProducts.map(product => product.toTreeNode());
        children.push(ButtonTreeNode(this.id));

        return {
            value: this.id,
            label: this.name,
            children: children
        }
    }

    override save(modeler: Modeler) {
        const moddle = modeler.get("moddle") as Moddle;
        const modeling = modeler.get('modeling') as Modeling;
        const elementInModel = (modeler.get('elementRegistry') as ElementRegistry).get(this.id) as Shape;

        const products = this.associatedProducts.map(product => {
            const productToChange = elementInModel.businessObject.product?.find((p: Shape) => p.id === product.id);
            if (productToChange) {
                productToChange.time = product.time;
                productToChange.timeUnit = product.timeUnit;
                productToChange.batch = product.batchQuantity;
                return productToChange;
            } else {
                const newProduct = moddle.create("factory:Product");
                newProduct.id = product.id;
                newProduct.name = product.name;
                newProduct.time = product.time;
                newProduct.batch = product.batchQuantity;
                newProduct.timeUnit = product.timeUnit;
                newProduct.idActivity = product.idActivity;
                return newProduct;
            }
        });

        const accessories = this.neededAccessories.map(accessory => {
           const accessoryToChange = elementInModel.businessObject.accessories?.find((a: Shape) => a.id === accessory.id);
           if (accessoryToChange) {
               accessoryToChange.id = accessory.id;
               accessoryToChange.name = accessory.name;
               accessoryToChange.quantity = accessory.quantity;
               return accessoryToChange
           } else {
               const newAccessory = moddle.create("factory:Accessory");
               newAccessory.id = accessory.id;
               newAccessory.name = accessory.name;
               newAccessory.quantity = accessory.quantity;
               return newAccessory;
           }
        });

        modeling.updateProperties(elementInModel, {name: this.name, product: products, accessories: accessories});
    }

    override needAccessories(): boolean {
        return true;
    }
}