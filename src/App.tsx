import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {Shape} from 'bpmn-js/lib/model/Types.ts'
import {useEffect, useMemo, useRef, useState} from "react";
import {ModelerContext, ModelerRefContext} from "./ModelerContext.ts";

import MenuBar from "./components/MenuBar/MenuBar.tsx";

import customModdleExtension from "./customModel/factoryModel.json"

import bpmnExtension from './BPMNExtensions';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import lintModule from "bpmn-js-bpmnlint";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import bpmnlintConfig from "./linting/.bpmnlintrc";
import "./linting/bpmn-js-bpmnlint.css";
import PropertiesDrawer from "./components/PropertiesDrawer/PropertiesDrawer.tsx";
import {is} from "bpmn-js/lib/util/ModelUtil";
import {ElementRegistry} from "bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation, TransformationIO} from "./Models/Transformation.ts";
import {Moddle} from "bpmn-js/lib/model/Types";
import Compatibility, {AccessoryCompatibility} from "./Models/Compatibility.ts";
import Inventory from "./Models/Inventory.ts";
import ProductRequest from "./Models/ProductRequest.ts";
import axios from "axios";
import {getAllExecutorsId, getExecutorsAvailability, MetricResult} from "./Models/SimulationResult.ts";
import LoadingSimulationModal from "./components/LoadingSimulationModal.tsx";
import MetricsDrawer from "./components/MetricsDrawer/MetricsDrawer.tsx";
import {ActivityElement} from "./Models/ActivityElement.ts";
import {BaseElement} from "./Models/BaseElement.ts";
import {ElementLike} from 'diagram-js/lib/model/Types.ts';
import {getExecutorColorClass} from "./Utils.ts";
import {ExecutorMetricsRanges, getFromLocalStorageOrDefault, TypeOfMetrics} from "./ExecutorsColorRanges.ts";

interface ElementEvent {
    element: Shape,
    stopPropagation: () => void,
}

interface ElementDeleteEvent {
    context: {
        shape: Shape
    }
}

const arms_service = import.meta.env.VITE_ARMS_SIMULATOR_URL;

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [modelerContext, _setModelerContext] = useState<ModelerContext>(new ModelerContext())
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);
    const [singleSelectedElement, setSingleSelectedElement] = useState<Shape | null>(null);

    const [loadingSimulation, setLoadingSimulation] = useState<boolean>(false);
    const [simulationStatus, setSimulationStatus] = useState<"loading" | "error" | "success">("loading");
    const [simulationError, setSimulationError] = useState<string>("");
    const [simulationResult, setSimulationResult] = useState<MetricResult | null>(null);

    const [executorsColorThresholds, setExecutorsColorThreshold] = useState<ExecutorMetricsRanges>(getFromLocalStorageOrDefault());
    const [executorsColorMetricSelected, setExecutorsColorMetricSelected] = useState<TypeOfMetrics>("availability")
    const allExecutorsId = useMemo(() => simulationResult ? getAllExecutorsId(simulationResult) : undefined, [simulationResult]);
    const executorsSimulationValues = useMemo(() => {
        return simulationResult ? {
            availability: getExecutorsAvailability(simulationResult),
        } : undefined
    }, [simulationResult]);

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
            modelerRef.current.on('element.click', 1500, handleSingleSelectionChange);
            modelerRef.current.on('import.done', setupModelData);
            modelerRef.current.on('element.changed', updateModelerContext);
            modelerRef.current.on('commandStack.shape.delete.postExecuted', 1500, updateModelOnElementDelete)
            // console.log(modelerRef.current.get("eventBus"));

            modelerContext.modeler = modelerRef;
            modelerContext.availableAccessories = new Map<string, Accessory>();
            modelerContext.transformations = new Map<string, Transformation>()
            modelerContext.compatibilities = [];
            modelerContext.inventories = new Map<string, Inventory>();
            modelerContext.productRequests = new Map<string, ProductRequest>();
            console.log("Modeler initialized");
        }
    }

    function handleSelectionChange(event: ElementEvent) {
        setSelectedElement(event.element);
        setDrawerOpen(true);
        event.stopPropagation();
    }

    function handleSingleSelectionChange(event: ElementEvent) {
        setSingleSelectedElement(event.element.type === "bpmn:Process" ? null : event.element);
    }

    function updateModelOnElementDelete(event: ElementDeleteEvent) {
        const element: Shape = event.context.shape;
        let compatibilitiesToDelete: Compatibility[] = [];

        if (element.type === "factory:Executor") {
            compatibilitiesToDelete = modelerContext.compatibilities.filter(compatibility => compatibility.idExecutor === element.id);
        } else if (ActivityElement.elementTypes.includes(element.type)) {
            compatibilitiesToDelete = modelerContext.compatibilities.filter(compatibility => compatibility.idActivity === element.id);
        }

        compatibilitiesToDelete.forEach(compatibility => compatibility.delete(modelerRef.current!));
        modelerContext.compatibilities = modelerContext.compatibilities.filter(compatibility => !compatibilitiesToDelete.includes(compatibility));
    }

    function updateModelerContext(event: ElementEvent) {
        const updateActions: Map<string, (element: Shape) => void> = new Map([
            ["factory:Inventory", (element: Shape) => {
                modelerContext.inventories.set(element.id, new Inventory(element));
            }],
        ])
        const functionToApply = updateActions.get(event.element.type);

        if (functionToApply) {
            functionToApply(event.element);
        }
    }

    function setupModelData() {
        const elementRegistry = modelerRef.current?.get("elementRegistry") as ElementRegistry;
        const processElement = elementRegistry.find(element => element.type === "bpmn:Process");
        if (processElement) {
            console.log("Model changed... setting up model's data");

            setupInventories(processElement);
            setupExecutors(processElement);
            setupActivities(processElement);

            const extensionElements = setAndGetExtensionElement(processElement);

            setupAccessories(extensionElements);
            setupProductRequests(extensionElements);
            setupTransformation(extensionElements);
            setupCompatibilities(extensionElements);
        }
    }

    function setupExecutors(process: ElementLike) {
        const executors = process.children
            .filter((element: Shape) => element.type === "factory:Executor")
            .map((element: Shape) => new BaseElement(element))
            .map((executor: BaseElement) => [executor.id, executor])

        modelerContext.executors = new Map(executors);
    }

    function setupActivities(process: ElementLike) {
        const activities = process.children
            .filter((element: Shape) => ActivityElement.elementTypes.includes(element.type))
            .map((element: Shape) => new BaseElement(element))
            .map((activity: BaseElement) => [activity.id, activity])

        modelerContext.activities = new Map(activities);
    }

    function setupInventories(process: ElementLike) {
        const inventories = process.children
            .filter((element: Shape) => element.type === "factory:Inventory")
            .map((element: Shape) => new Inventory(element))
            .map((inventory: Inventory) => [inventory.id, inventory])

        modelerContext.inventories = new Map(inventories);
    }

    function setAndGetExtensionElement(process: ElementLike): Shape[] {
        let extensionElementsElement = process.businessObject.get("extensionElements")

        if (!extensionElementsElement) {
            extensionElementsElement = (modelerContext.modeler.current!.get("moddle") as Moddle).create("bpmn:ExtensionElements");
            process.businessObject.extensionElements = extensionElementsElement;
        }

        return extensionElementsElement.get("values");
    }

    function setupAccessories(extensionElements: Shape[]) {
        const availableAccessories: [string, Accessory][] = extensionElements
            .filter((element: Shape) => is(element, "factory:Accessory"))
            .map((element: Shape) => new Accessory(element.id, element.name, element.quantity))
            .map((accessory: Accessory) => [accessory.id, accessory]);

        modelerContext.availableAccessories = new Map(availableAccessories);
    }

    function setupProductRequests(extensionElements: Shape[]) {
        const productRequests: [string, ProductRequest][] = extensionElements
            .filter((element: Shape) => is(element, "factory:ProductRequest"))
            .map((element: Shape) => {
                const productProperties = new Map<string, string>(element.productProperties?.map((p: Shape) => [p.key, p.value]));
                return new ProductRequest(element.id, productProperties, element.quantity);
            })
            .map((productRequest: ProductRequest) => [productRequest.id, productRequest]);
        modelerContext.productRequests = new Map(productRequests);
    }

    function setupTransformation(extensionElements: Shape[]) {
        const transformations: [string, Transformation][] = extensionElements
            .filter((element: Shape) => is(element, "factory:Transformation"))
            .map((element: Shape) => {
                const productProperties = new Map<string, string>(element.productProperties?.map((p: Shape) => [p.key, p.value]) ?? []);
                const transformationToApply = new Map<string, string>(element.transformationToApply?.map((p: Shape) => [p.key, p.value]) ?? []);
                return new Transformation(element.id, element.activityId, productProperties, transformationToApply)
            })
            .map((transformation: Transformation) => [transformation.id, transformation]);

        modelerContext.transformations = new Map(transformations);

        modelerContext.transformations.forEach((transformation: Transformation) => {
            const inputs = extensionElements
                .filter((element: Shape) => is(element, "factory:Transformation"))
                .filter((element: Shape) => element.id === transformation.id)
                .map((element: Shape) => element.inputs ?? [])
                .flatMap((element: Shape) => element)
                .flatMap((element: Shape) => new TransformationIO(element.id, element.inventoryId, element.quantity));

            const outputs = extensionElements
                .filter((element: Shape) => is(element, "factory:Transformation"))
                .filter((element: Shape) => element.id === transformation.id)
                .map((element: Shape) => element.outputs ?? [])
                .flatMap((element: Shape) => element)
                .flatMap((element: Shape) => new TransformationIO(element.id, element.inventoryId, element.quantity));

            transformation.inputs = inputs;
            transformation.outputs = outputs;
        });
    }

    function setupCompatibilities(extensionElements: Shape[]) {
        modelerContext.compatibilities = extensionElements
            .filter((element: Shape) => is(element, "factory:Compatibility"))
            .map((element: Shape) => {
                const productProperties = new Map<string, string>(element.productProperties?.map((p: Shape) => [p.key, p.value]) ?? []);
                return new Compatibility(element.id, element.time, element.timeUnit, element.idActivity, element.idExecutor, productProperties, [], element.batch)
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

    function setXmlDiagram(fileName: string) {
        setSimulationResult(null);
        fetch(fileName)
            .then(res => res.text())
            .then(data => modelerRef.current?.importXML(data))
            .catch(err => console.error(err));
    }

    useEffect(() => {
        initializeModeler();
        setXmlDiagram("/ARMS-Editor/empty_diagram.bpmn");
    }, []);

    useEffect(applyStyleToExecutors, [simulationResult, executorsColorThresholds])

    function applyStyleToExecutors() {
        if (simulationResult) {
            const executorsId = allExecutorsId!
            const elements = document.querySelectorAll('[data-element-id]')
            const executorsValue = executorsSimulationValues!.availability;
            elements.forEach(element => {
                const elementId = element.getAttribute("data-element-id")! as string;
                if (executorsId.includes(elementId)) {
                    applyStyleToExecutor(element, getExecutorColorClass(executorsValue.get(elementId)!, executorsColorMetricSelected, executorsColorThresholds), "0.3")
                }
            })
        }
    }

    function applyStyleToExecutor(element: Element, fill: string, fillOpacity: string) {
        const polygon = element.querySelector("polygon")!;
        polygon.style.fill = fill;
        polygon.style.fillOpacity = fillOpacity;
    }

    function runSimulation() {
        setSimulationStatus("loading");
        setLoadingSimulation(true);

        modelerRef.current?.saveXML({format: true})
            .then(async res => {
                const file = new Blob([res.xml ?? ""], {type: 'text/xml'});

                const formData = new FormData();
                formData.append('file', file);

                axios.post(`${arms_service}/simulate`, formData)
                    .then(async res => {
                        const simulationResultReceived: MetricResult = res.data;
                        setSimulationStatus("success");
                        setLoadingSimulation(false);
                        setSimulationResult(simulationResultReceived);
                    })
                    .catch(err => {
                        setSimulationStatus("error");
                        setSimulationError(err.response.data.message);
                    });
            });

    }

    return (
        <div className="App">
            <ModelerRefContext.Provider value={modelerContext}>
                <MenuBar setXmlDiagram={setXmlDiagram}
                         runSimulation={runSimulation}
                         executorsColorThresholds={executorsColorThresholds}
                         setExecutorsColorThresholds={setExecutorsColorThreshold}
                         selectedMetric={executorsColorMetricSelected}
                         setSelectedMetric={setExecutorsColorMetricSelected}/>
                <div id="diagramContainer" className="diagramContainer"/>
                <PropertiesDrawer shape={selectedElement} isOpen={isDrawerOpen} setIsOpen={setDrawerOpen}/>
                {simulationStatus === "success" && simulationResult &&
                    <MetricsDrawer simulationResult={simulationResult as MetricResult} shape={singleSelectedElement}/>}
                <LoadingSimulationModal isOpen={loadingSimulation} setIsOpen={setLoadingSimulation}
                                        status={simulationStatus} errorMessage={simulationError}/>
            </ModelerRefContext.Provider>
        </div>
    )
}

export default App
