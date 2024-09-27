import Product from "./Product.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {ButtonTreeNode} from "../components/ButtonTreeNode.ts";
import Modeler from "bpmn-js/lib/Modeler";
import {Moddle} from "bpmn-js/lib/model/Types";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";

export class TransformationIO {
    id: string;
    productType: string;
    quantity: number;

    constructor(id: string, productType: string, quantity: number) {
        this.id = id;
        this.productType = productType;
        this.quantity = quantity;
    }

    toTreeNode(transformationId: string): TreeNode {
        return {
            value: `${this.id}@${transformationId}`,
            label: JSON.stringify(this)
        }
    }

}

export class Transformation {
    id: string;
    activityId: string;
    product: Product;
    inputs: Array<TransformationIO>
    outputs: Array<TransformationIO>


    constructor(id: string, activityId: string, product: Product) {
        this.id = id;
        this.activityId = activityId;
        this.product = product;
        this.inputs = [];
        this.outputs = [];
    }

    save(modeler: Modeler) {
        const moddle = modeler.get("moddle") as Moddle;
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements");

        const oldTransformation = extensionElements.get("values")
            .find((element: Shape) => element.id === this.id);

        if (oldTransformation) {
            // Overwrite old transformation
            const modeling = modeler.get('modeling') as Modeling;

            const newInputs = this.inputs.map(input => {
                const inputToChange = oldTransformation.inputs?.find((i: Shape) => i.id === input.id);
                if (inputToChange) {
                    inputToChange.productType = input.productType;
                    inputToChange.quantity = input.quantity;
                    return inputToChange;
                } else {
                    const newTransformationInput = moddle.create("factory:TransformationInput");
                    newTransformationInput.id = input.id;
                    newTransformationInput.productType = input.productType;
                    newTransformationInput.quantity = input.quantity;
                    return newTransformationInput;
                }
            });
            const newOutputs = this.outputs.map(output => {
                const outputToChange = oldTransformation.outputs?.find((o: Shape) => o.id === output.id);
                if (outputToChange) {
                    outputToChange.productType = output.productType;
                    outputToChange.quantity = output.quantity;
                    return outputToChange;
                } else {
                    const newTransformationOutput = moddle.create("factory:TransformationOutput");
                    newTransformationOutput.id = output.id;
                    newTransformationOutput.productType = output.productType;
                    newTransformationOutput.quantity = output.quantity;
                    return newTransformationOutput;
                }
            });

            extensionElements.values = extensionElements.get("values")
                .map((element: Shape) => {
                    if (element.id === oldTransformation.id) {
                        element.productId = this.product.id;
                        element.inputs = newInputs;
                        element.outputs = newOutputs;
                    }

                    return element
                });

            modeling.updateProperties(processElement, {extensionElements});

        } else {
            const newTransformation = moddle.create("factory:Transformation", {
                id: this.id,
                activityId: this.activityId,
                productId: this.product.id,
                inputs: this.inputs.map(input => {
                    const newTransformationInput = moddle.create("factory:TransformationInput");
                    newTransformationInput.id = input.id;
                    newTransformationInput.productType = input.productType;
                    newTransformationInput.quantity = input.quantity;
                    return newTransformationInput;
                }),
                outputs: this.outputs.map(output => {
                    const newTransformationOutput = moddle.create("factory:TransformationOutput");
                    newTransformationOutput.id = output.id;
                    newTransformationOutput.productType = output.productType;
                    newTransformationOutput.quantity = output.quantity;
                    return newTransformationOutput;
                })
            });

            extensionElements.get("values").push(newTransformation);
        }

    }

    toTreeNode(): TreeNode {
        return {
            value: this.product.id,
            label: this.product.name,
            children: [this.inputsTreeNode(), this.outputsTreeNode()]
        }
    }

    inputsTreeNode(): TreeNode {
        const inputsTreeNode = this.inputs.map(input => input.toTreeNode(this.id));
        inputsTreeNode.push(ButtonTreeNode(`Inputs@${this.id}`));
        return {
            value: `Inputs@${this.id}`,
            label: `Inputs`,
            children: inputsTreeNode
        }
    }

    outputsTreeNode(): TreeNode {
        const inputsTreeNode = this.outputs.map(output => output.toTreeNode(this.id));
        inputsTreeNode.push(ButtonTreeNode(`Inputs@${this.id}`));
        return {
            value: `Outputs@${this.id}`,
            label: `Outputs`,
            children: inputsTreeNode
        }
    }
}