import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {Shape} from 'bpmn-js/lib/model/Types.ts'
import {useEffect, useRef, useState} from "react";
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
import Compatibility, {AccessoryCompatibility} from './Models/Compatibility.ts';
import Inventory from './Models/Inventory.ts';
import ProductRequest from './Models/ProductRequest.ts';

interface ElementEvent {
    element: Shape,
    stopPropagation: () => void,
}

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [modelerContext, _setModelerContext] = useState<ModelerContext>(new ModelerContext());
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);
    
    const [jsonData, setJsonData] = useState<any | null>(null); // Dati JSON caricati

    const [selectedMetric, setSelectedMetric] = useState<'busy' | 'idle'>('busy');  // Stato per tenere traccia della selezione

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
            modelerRef.current.on('import.done', setupModelData);
            modelerRef.current.on('element.changed', updateModelerContext);
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

    const handleSelectionChange = (event: any) => {
        setSelectedElement(event.element);
        setDrawerOpen(true);
        event.stopPropagation();
    };

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
            const inventories = processElement.children
                .filter((element: Shape) => element.type === "factory:Inventory")
                .map((element: Shape) => new Inventory(element))
                .map((inventory: Inventory) => [inventory.id, inventory])
            modelerContext.inventories = new Map(inventories);

            let extensionElementsElement = processElement.businessObject.get("extensionElements")

            if (!extensionElementsElement) {
                extensionElementsElement = (modelerContext.modeler.current!.get("moddle") as Moddle).create("bpmn:ExtensionElements");
                processElement.businessObject.extensionElements = extensionElementsElement;
            }

            const extensionElements = extensionElementsElement.get("values");

            const availableAccessories = extensionElements
                .filter((element: Shape) => is(element, "factory:Accessory"))
                .map((element: Shape) => new Accessory(element.id, element.name, element.quantity))
                .map((accessory: Accessory) => [accessory.id, accessory]);
            modelerContext.availableAccessories = new Map(availableAccessories);

            const productRequests = extensionElements
                .filter((element: Shape) => is(element, "factory:ProductRequest"))
                .map((element: Shape) => {
                    const productProperties = new Map<string, string>(element.productProperties?.map((p: Shape) => [p.key, p.value]));
                    return new ProductRequest(element.id, productProperties, element.quantity);
                })
                .map((productRequest: ProductRequest) => [productRequest.id, productRequest]);
            modelerContext.productRequests = new Map(productRequests);

            const transformations = extensionElements
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

            modelerContext.compatibilities = extensionElements
                .filter((element: Shape) => is(element, "factory:Compatibility"))
                .map((element: Shape) => {
                    const productProperties = new Map<string, string>(element.productProperties?.map((p: Shape) => [p.key, p.value]) ?? []);
                    return new Compatibility(element.id, element.time, element.timeUnit, element.idActivity, element.idExecutor, productProperties, [])
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

    // Caricamento del file JSON
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            console.log("JSON caricato:", data);
            setJsonData(data); 
        } catch (error) {
            console.error("Errore durante la lettura del JSON:", error);
            alert("Il file selezionato non è un JSON valido.");
        }
        };
        reader.readAsText(file);
    };

    interface Executor {
        id: string;
        maxQueueLength: number;
        busy: number;
        idle: number;
    }

    const startSimulation = () => {
        if (jsonData) {
            console.log("Simulazione avviata con dati:", jsonData);

            const executors: Executor[] = jsonData.executors;  // Usa il tipo Executor

            // Calcolare la percentuale di utilizzo in base alla selezione
            executors.forEach((executor: Executor) => {  // Usa il tipo Executor anche qui
                let percentage;
                if (selectedMetric === 'busy') {
                    percentage = (executor.busy / jsonData.simulation.totalTime) * 100;  // Calcola la percentuale di busy
                } else {
                    percentage = (executor.idle / jsonData.simulation.totalTime) * 100;  // Calcola la percentuale di idle
                }

                const colorClass = getColorClass(percentage);  // Ottieni il colore in base alla percentuale
                changeElementClass(executor.id, colorClass);  // Applica la classe CSS per cambiare il colore
            });
        } else {
            alert("Carica un file JSON prima di avviare la simulazione.");
        }
    };

    const getColorClass = (busyPercentage: number) => {
        if (busyPercentage <= 33) {
        return 'bpmn-element-green';  
        } else if (busyPercentage <= 66) {
        return 'bpmn-element-yellow';  
        } else {
        return 'bpmn-element-red';  
        }
    };
    
    // Funzione per cambiare la classe CSS di un elemento nel diagramma utilizzando l'ID
    const changeElementClass = (elementId: string, colorClass: string) => {
        const elementRegistry = modelerRef.current?.get("elementRegistry");
        const element = elementRegistry?.get(elementId);

        if (element) {
            const gfx = modelerRef.current?.get("canvas").getGraphics(element);

            if (gfx) {
                // Rimuovi qualsiasi classe precedente
                gfx.classList.remove('bpmn-element-green', 'bpmn-element-yellow', 'bpmn-element-red');
                
                // Aggiungi la classe CSS appropriata
                gfx.classList.add(colorClass);
            }
        } else {
            console.error("Elemento non trovato nel elementRegistry per ID:", elementId);
        }
    };

    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    return (
        <div className="App">
        <ModelerRefContext.Provider value={modelerContext}>
            <MenuBar setXmlDiagramToEmpty={() => {}} setSelectedMetric={setSelectedMetric} />
            <div className="simulationControls">
                <input type="file" accept=".json" onChange={handleFileChange} className="fileInput"/>
                <button onClick={startSimulation} className="startSimulationButton">Avvia Simulazione</button>
            </div>
            <div id="diagramContainer" className="diagramContainer"></div>
            <PropertiesDrawer shape={selectedElement} isOpen={isDrawerOpen} setIsOpen={setDrawerOpen} />
        </ModelerRefContext.Provider>
        </div>
    );
    }

    export default App;
