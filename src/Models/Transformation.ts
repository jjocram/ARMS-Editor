import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {Moddle} from "bpmn-js/lib/model/Types";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import ExtensionElement from "./ExtensionElement.ts";

export class TransformationIO {
    id: string;
    inventoryId: string;
    quantity: number;

    constructor(id: string, inventoryId: string, quantity: number) {
        this.id = id;
        this.inventoryId = inventoryId;
        this.quantity = quantity;
    }
}

export class Transformation extends ExtensionElement {
    activityId: string;
    productProperties: Map<string, string>;
    transformationToApply: Map<string, string>;
    inputs: Array<TransformationIO>
    outputs: Array<TransformationIO>


    constructor(id: string, activityId: string, productProperties: Map<string, string>, transformationToApply: Map<string, string>) {
        super(id);
        this.activityId = activityId;
        this.productProperties = productProperties;
        this.transformationToApply = transformationToApply;
        this.inputs = [];
        this.outputs = [];
    }

    toTreeNode(): TreeNode {
        return {
            value: this.id,
            label: this.id,
        }
    }

    deleteFromExtensionElements(oldValues: Array<Shape>): Array<Shape> {
        return oldValues.filter(e => e.id !== this.id);
    }

    newElement(moddle: Moddle): Shape {
        return moddle.create("factory:Transformation", {
            id: this.id,
            activityId: this.activityId,
            productProperties: Array.from(this.productProperties, ([key, value]) => {
                return moddle.create("factory:TransformationProductProperty", {
                    key: key,
                    value: value
                })
            }),
            transformationToApply: Array.from(this.productProperties, ([key, value]) => {
                return moddle.create("factory:TransformationProductPropertyToApply", {
                    key: key,
                    value: value
                })
            }),
            inputs: this.inputs.map(input => {
                const newTransformationInput = moddle.create("factory:TransformationInput");
                newTransformationInput.id = input.id;
                newTransformationInput.invetoryId = input.inventoryId;
                newTransformationInput.quantity = input.quantity;
                return newTransformationInput;
            }),
            outputs: this.outputs.map(output => {
                const newTransformationOutput = moddle.create("factory:TransformationOutput");
                newTransformationOutput.id = output.id;
                newTransformationOutput.inventoryId = output.inventoryId;
                newTransformationOutput.quantity = output.quantity;
                return newTransformationOutput;
            })
        });
    }

    overwrite(oldElement: Shape, moddle: Moddle): Shape {
        oldElement.productProperties = [...this.productProperties.entries()].map(([key, value]) => {
            const propertyToChange = oldElement.productProperties?.find((p: Shape) => p.key === key);
            if (propertyToChange) {
                propertyToChange.value = value;
                return propertyToChange;
            } else {
                return moddle.create("factory:TransformationProductProperty", {
                    key: key,
                    value: value
                })
            }
        });
        oldElement.transformationToApply = [...this.productProperties.entries()].map(([key, value]) => {
            const propertyToChange = oldElement.productProperties?.find((p: Shape) => p.key === key);
            if (propertyToChange) {
                propertyToChange.value = value;
                return propertyToChange;
            } else {
                return moddle.create("factory:TransformationProductPropertyToApply", {
                    key: key,
                    value: value
                })
            }
        });

        oldElement.inputs = this.inputs.map(input => {
            const inputToChange = oldElement.inputs?.find((i: Shape) => i.id === input.id);
            if (inputToChange) {
                inputToChange.inventoryId = input.inventoryId;
                inputToChange.quantity = input.quantity;
                return inputToChange;
            } else {
                const newTransformationInput = moddle.create("factory:TransformationInput");
                newTransformationInput.id = input.id;
                newTransformationInput.inventoryId = input.inventoryId;
                newTransformationInput.quantity = input.quantity;
                return newTransformationInput;
            }
        });
        oldElement.outputs = this.outputs.map(output => {
            const outputToChange = oldElement.outputs?.find((o: Shape) => o.id === output.id);
            if (outputToChange) {
                outputToChange.inventoryId = output.inventoryId;
                outputToChange.quantity = output.quantity;
                return outputToChange;
            } else {
                const newTransformationOutput = moddle.create("factory:TransformationOutput");
                newTransformationOutput.id = output.id;
                newTransformationOutput.inventoryId = output.inventoryId;
                newTransformationOutput.quantity = output.quantity;
                return newTransformationOutput;
            }
        });
        return oldElement;
    }
}