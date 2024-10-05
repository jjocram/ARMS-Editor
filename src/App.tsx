import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {Shape} from 'bpmn-js/lib/model/Types.ts'
import {useEffect, useRef, useState} from "react";
import {ModelerContext, ModelerRefContext} from "./ModelerContext.ts";

import MenuBar from "./components/MenuBar/MenuBar.tsx";

import customModdleExtension from "./customModel/factoryModel.json"

import bpmnExtension from './BPMNExtensions';

// @ts-ignore
import lintModule from "bpmn-js-bpmnlint";
// @ts-ignore
import bpmnlintConfig from "./linting/.bpmnlintrc";
import "./linting/bpmn-js-bpmnlint.css";
import PropertiesDrawer from "./components/PropertiesDrawer/PropertiesDrawer.tsx";
import {is} from "bpmn-js/lib/util/ModelUtil";
import Product from "./Models/Product.ts";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation, TransformationIO} from "./Models/Transformation.ts";
import {Moddle} from "bpmn-js/lib/model/Types";
import Compatibility, {AccessoryCompatibility} from "./Models/Compatibility.ts";

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    const [modelerContext, _] = useState<ModelerContext>(new ModelerContext())
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);

    function initializeModeler() {
        const container = document.getElementById('diagramContainer') as HTMLElement;
        if (!modelerRef.current && container) {
            modelerRef.current = new Modeler({
                container: container,
                keyboard: {bindTo: document.body},
                moddleExtensions: {
                    factory: customModdleExtension
                },
                linting: {
                    bpmnlint: bpmnlintConfig,
                    active: true,
                },
                additionalModules: [
                    bpmnExtension,
                    lintModule
                ]
            })
            modelerRef.current.on('element.dblclick', 1500, handleSelectionChange);
            modelerRef.current.on('import.done', setupModelData)

            modelerContext.modeler = modelerRef;
            modelerContext.products = new Map<string, Product>();
            modelerContext.availableAccessories = new Map<string, Accessory>();
            modelerContext.transformations = new Map<string, Transformation>()
            modelerContext.compatibilities = [];
            console.log("Modeler initialized")
        }
    }

    function handleSelectionChange(event: any) {
        setSelectedElement(event.element);
        setDrawerOpen(true);
        event.stopPropagation();
    }

    function setupModelData() {
        const elementRegistry = modelerRef.current?.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process");
        if (processElement) {
            console.log("Model changed... setting up model's data");
            let extensionElementsElement = processElement.businessObject.get("extensionElements")

            if (!extensionElementsElement) {
                extensionElementsElement =( modelerContext.modeler.current!.get("moddle") as Moddle).create("bpmn:ExtensionElements");
                processElement.businessObject.extensionElements = extensionElementsElement;
            }

            const extensionElements = extensionElementsElement.get("values");

            const products = extensionElements
                .filter((element: Shape) => is(element, "factory:Product"))
                .map((element: Shape) => {
                    const product = new Product(element.id, element.name)
                    product.finalQuantity = element.quantity ?? undefined;
                    return product
                })
                .map((product: Product) => [product.id, product]);
            modelerContext.products = new Map(products);

            const availableAccessories = extensionElements
                .filter((element: Shape) => is(element, "factory:Accessory"))
                .map((element: Shape) => new Accessory(element.id, element.name, element.quantity))
                .map((accessory: Accessory) => [accessory.id, accessory]);
            modelerContext.availableAccessories = new Map(availableAccessories);

            const transformations = extensionElements
                .filter((element: Shape) => is(element, "factory:Transformation"))
                .map((element: Shape) => new Transformation(element.id, element.activityId, modelerContext.products.get(element.productId)!))
                .map((transformation: Transformation) => [transformation.id, transformation]);
            modelerContext.transformations = new Map(transformations);
            modelerContext.transformations.forEach((transformation: Transformation) => {
                const inputs = extensionElements
                    .filter((element: Shape) => is(element, "factory:Transformation"))
                    .filter((element: Shape) => element.id === transformation.id)
                    .map((element: Shape) => element.inputs ?? [])
                    .flatMap((element: Shape) => element)
                    .flatMap((element: Shape) => new TransformationIO(element.id, element.productType, element.quantity));

                const outputs = extensionElements
                    .filter((element: Shape) => is(element, "factory:Transformation"))
                    .filter((element: Shape) => element.id === transformation.id)
                    .map((element: Shape) => element.outputs ?? [])
                    .flatMap((element: Shape) => element)
                    .flatMap((element: Shape) => new TransformationIO(element.id, element.productType, element.quantity));

                transformation.inputs = inputs;
                transformation.outputs = outputs;
            });

            modelerContext.compatibilities = extensionElements
                .filter((element: Shape) => is(element, "factory:Compatibility"))
                .map((element: Shape) => {
                    const product = modelerContext.products.get(element.idProduct)!;
                    return new Compatibility(element.id, element.time, element.timeUnit, element.batch, element.idActivity, element.idExecutor, product, [])
                });
            modelerContext.compatibilities.forEach((compatibility: Compatibility) => {
                compatibility.accessories = extensionElements
                    .filter((element: Shape) => is(element, "factory:Compatibility"))
                    .filter((element: Shape) => element.id === compatibility.id)
                    .map((element: Shape) => element.accessories ?? [])
                    .flatMap((element: Shape) => element)
                    .flatMap((element: Shape) => new AccessoryCompatibility(element.id, element.quantity));
            })
        }
    }

    function setXmlDiagramToEmpty() {
        fetch("/empty_diagram.bpmn")
            .then(res => res.text())
            .then(data => modelerRef.current?.importXML(data))
            .catch(err => console.error(err));
    }

    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    return (
        <div className="App">
            <ModelerRefContext.Provider value={modelerContext}>
                <MenuBar setXmlDiagramToEmpty={setXmlDiagramToEmpty}></MenuBar>
                <div id="diagramContainer" className="diagramContainer"></div>
                <PropertiesDrawer shape={selectedElement} isOpen={isDrawerOpen} setIsOpen={setDrawerOpen}/>
            </ModelerRefContext.Provider>
        </div>
    )
}

export default App
