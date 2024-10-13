import Modeler from "bpmn-js/lib/Modeler";
import {Moddle, Shape} from "bpmn-js/lib/model/Types.ts";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";

export default abstract class ExtensionElement {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    save(modeler: Modeler) {
        const moddle = modeler.get("moddle") as Moddle
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements");

        const oldElement = extensionElements.get("values")
            .find((element: Shape) => element.id === this.id);

        if (oldElement) {
            // Overwrite old element
            const modeling = modeler.get('modeling') as Modeling;
            const newElement = this.overwrite(oldElement, moddle);
            extensionElements.values = extensionElements.get("values").map((element: Shape) => element.id === this.id ? newElement : element);
            modeling.updateProperties(processElement, {extensionElements});
        } else {
            // Create new element
            const newElement = this.newElement(moddle);
            extensionElements.get("values").push(newElement);
        }
    }

    abstract overwrite(oldElement: Shape, moddle: Moddle): Shape;

    abstract newElement(moddle: Moddle): Shape;

    abstract deleteFromExtensionElements(oldValues: Array<Shape>): Array<Shape>;

    delete(modeler: Modeler) {
        const modeling = modeler.get('modeling') as Modeling;
        const elementRegistry = modeler.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process") as Shape;
        const extensionElements = processElement.businessObject.get("extensionElements");

        extensionElements.values = this.deleteFromExtensionElements(extensionElements.get("values"));

        modeling.updateProperties(processElement, {extensionElements});
    }
}