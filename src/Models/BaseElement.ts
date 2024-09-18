import Modeler from "bpmn-js/lib/Modeler";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";
import {Shape} from "bpmn-js/lib/model/Types.ts";

export class BaseElement {
    id: string;
    type: string;
    name: string;

    constructor(shape: Shape | null) {
        if (shape === null) {
            this.id = "";
            this.type = "";
            this.name = ""
            return;
        }

        this.id = shape.id;
        this.type = shape.type;
        this.name = shape.name ?? "";
    }

    save(modeler: Modeler): void {
        const modeling = modeler.get('modeling') as Modeling;
        const elementInModel = modeler.get('elementRegistry').get(this.id) as Shape;
        modeling.updateProperties(elementInModel, {...this});
    }

    getDisplayName() {
        return this.name.length > 0 ? this.name : this.id;
    }

    getDisplayType() {
        return this.type.split(":")[1] ?? this.type;
    }

    needCompatibilities(): boolean {
        const compatibilityTypes: Array<string> = ["bpmn:Task", "factory:batch"]
        return compatibilityTypes.includes(this.type);
    }

    needTransformations(): boolean {
        const transformationTypes: Array<string> = ["bpmn:Task", "factory:batch"]
        return transformationTypes.includes(this.type);
    }
}