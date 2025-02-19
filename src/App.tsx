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

import D3Chart from './components/ElementList/ChartComponent.tsx';
import PieChart from './components/ElementList/PieChart.tsx';
import BarChart from './components/ElementList/BarChart.tsx';

import Modal from "react-modal";
import ColorRangeSlider from './components/ElementList/ColorRangeSlider.tsx';
import { ActivityElement } from './Models/ActivityElement.ts';

Modal.setAppElement("#root");
interface ElementEvent {
    element: Shape,
    stopPropagation: () => void,
}
interface ElementDeleteEvent {
    context: {
        shape: Shape
    }
}

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [modelerContext, _setModelerContext] = useState<ModelerContext>(new ModelerContext());
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);
    
    //const [jsonData, setJsonData] = useState<any | null>(null); 
    const [data, setData] = useState<any | null>(null); 
    const [selectedMetric, setSelectedMetric] = useState<'Availability' | 'QueueLength'>('Availability');  

    const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null); // Esecutore selezionato
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null); // Attività selezionata
    //const [pieChartData, setPieChartData] = useState<{ id: string; value: number }[]>([]); // Dati per grafico a torta
    const [activeChart, setActiveChart] = useState<'pie' | 'd3'>('d3'); // Tipo di grafico attivo
    const [elementNames, setElementNames] = useState<Map<string, string>>(new Map());

    const [isModalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);
    
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
            modelerRef.current.on('commandStack.shape.delete.postExecuted', 1500, updateExtensionElements)

            modelerContext.modeler = modelerRef;
            modelerContext.availableAccessories = new Map<string, Accessory>();
            modelerContext.transformations = new Map<string, Transformation>()
            modelerContext.compatibilities = [];
            modelerContext.inventories = new Map<string, Inventory>();
            modelerContext.productRequests = new Map<string, ProductRequest>();
            console.log("Modeler initialized");
        }
    }

    type TimeUnit = 's' | 'm' | 'h' | 'd';

    interface Activity {
        id: string;
        name: string;
        busy: number;
        busyUnit: TimeUnit;  
        maxWaitTimeInQueue: number;
        avgWaitTimeInQueue: number;
        sumWaitTimeInQueue: number;
        processedItems: number;
    }

    interface Executor {
        id: string;
        name: string;
        idle: number;
        sumWaitTimeInQueue: number;
        busy: number; // Tempo totale di busy dell'esecutore
        maxWaitTimeInQueue: number;
        avgWaitTimeInQueue: number;
        processedItems: number;
        activities: Activity[];
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

    function updateExtensionElements(event: ElementDeleteEvent) {
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

            const namesMap = new Map<string, string>();

            // Estrai nomi da tutti gli elementi BPMN
            const allElements = elementRegistry.getAll();
            allElements.forEach(element => {
                if (element.businessObject && element.businessObject.name) {
                    namesMap.set(element.id, element.businessObject.name);
                }
            });

            // Aggiorna lo stato con la mappa degli ID → Nomi
            setElementNames(namesMap);
        }

    }

    function setXmlDiagramToEmpty() {
        fetch("/empty_diagram.bpmn")
            .then(res => res.text())
            .then(data => modelerRef.current?.importXML(data))
            .catch(err => console.error(err));
    }

    /*Caricamento del file JSON
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            console.log("JSON caricato:", data);
            setData(data);
        } catch (error) {
            console.error("Errore durante la lettura del JSON:", error);
            alert("Il file selezionato non è un JSON valido.");
        }
        };
        reader.readAsText(file);
    };*/

    const [simulationPercentages, setSimulationPercentages] = useState<Map<string, { Availability: number, QueueLength: number }>>(new Map());
    const [simulationStarted, setSimulationStarted] = useState(false);

    const handleRangeChange = (ranges: any) => {
        if (Array.isArray(ranges.availability) && ranges.availability.length === 2 &&
            Array.isArray(ranges.queueLength) && ranges.queueLength.length === 2) {
            
            // Forza come tuple prima di salvare
            const fixedRanges = {
                availability: [ranges.availability[0], ranges.availability[1]] as [number, number],
                queueLength: [ranges.queueLength[0], ranges.queueLength[1]] as [number, number]
            };
    
            localStorage.setItem('colorThresholds', JSON.stringify(fixedRanges));
        } else {
            console.error("Formato errato in handleRangeChange:", ranges);
        }
        updateExecutorColors();
    };
    

    const updateExecutorColors = () => {
        if (data?.executors) {
            data.executors.forEach((executor: Executor) => {
                const busyValue = calculateBusyValueForExecutor(executor);
                const colorClass = getColorClass(busyValue, selectedMetric);
                changeElementClass(executor.id, colorClass);
            });
        }
    };

    const calculateBusyValueForExecutor = (executor: Executor): number => {
        const totalBusyTime = executor.busy;
        const totalQueueTime = executor.sumWaitTimeInQueue || 0;
    
        const totalTime = totalBusyTime + totalQueueTime;
    
        if (totalTime === 0) {
            console.warn(`Total time (busy + queue) for Executor ${executor.id} is zero.`);
            return 0;
        }
    
        //formula calcolo valore di busy
        const value = totalBusyTime / totalTime;
        console.log(`Executor ${executor.id}: busy value = ${value}`);
        return value; // Valore tra 0 e 1
    };
    
    const getColorClass = (value: number, selectedMetric: string): string => {
        // Recupera i threshold dal localStorage, con un fallback ai valori predefiniti
        const storedThresholds = localStorage.getItem('colorThresholds');
        let thresholds: { availability: [number, number]; queueLength: [number, number] };
    
        try {
            const parsedThresholds = storedThresholds ? JSON.parse(storedThresholds) : {};
    
            // Converti e forzare come tuple `[number, number]`
            const availability: [number, number] = Array.isArray(parsedThresholds.availability) && parsedThresholds.availability.length === 2
                ? [parsedThresholds.availability[0], parsedThresholds.availability[1]] as [number, number]
                : [0.5, 0.75];
    
            const queueLength: [number, number] = Array.isArray(parsedThresholds.queueLength) && parsedThresholds.queueLength.length === 2
                ? [parsedThresholds.queueLength[0], parsedThresholds.queueLength[1]] as [number, number]
                : [0.3, 0.6];
    
            thresholds = { availability, queueLength };
        } catch (error) {
            console.error("Errore nel parsing del localStorage:", error);
            thresholds = { availability: [0.5, 0.75], queueLength: [0.3, 0.6] };
        }
    
        console.log("Using thresholds:", thresholds);
    
        if (value === 0) {
            return '';
        }
    
        // Determina i range in base alla metrica selezionata
        const [yellowThreshold, greenThreshold] = selectedMetric === 'Availability' 
            ? thresholds.availability 
            : thresholds.queueLength;
    
        // Applica i colori in base ai valori
        if (value > greenThreshold) {
            return 'bpmn-element-green';
        } else if (value >= yellowThreshold) {
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
                
                if (colorClass) {
                    gfx.classList.add(colorClass);
                }
            }
        } else {
            console.error("Elemento non trovato nel elementRegistry per ID:", elementId);
        }
    }; 
    
    const startSimulation = async () => {
        try{
            setupModelData();
            const diagram = await modelerRef.current?.saveXML();

            const response = await fetch("http://127.0.0.1:8080/simulate", {
            method: "POST",
            body: diagram?.xml,
            });

            const newData = await response.json();
            setData(newData);

            if (newData) {
                console.log(modelerRef.current?.saveXML().then(response => console.log(response)));

                console.log("Simulazione avviata con dati:", newData);
        
                const executors: Executor[] = newData.executors;
        
                const updatedPercentages: Map<string, { Availability: number; QueueLength: number }> = new Map();
        
                executors.forEach((executor: Executor) => {
                    let busyValue = 0;
                    let idleValue = 0;
        
                    if (selectedMetric === 'Availability') {
                        // Calcola il valore di busy
                        busyValue = calculateBusyValueForExecutor(executor);
                    } else {
                        // Calcola il valore di idle
                        const simulationTotalTime = newData.simulation.totalTime || 1;
                        idleValue = executor.idle / simulationTotalTime;
                    }
        
                    // Aggiungi i valori alla mappa mantenendo entrambe le proprietà
                    updatedPercentages.set(executor.id, {
                        Availability: busyValue,
                        QueueLength: idleValue,
                    });
        
                    // Determina la classe del colore in base alla metrica selezionata
                    const value = selectedMetric === 'Availability' ? busyValue : idleValue;
                    const colorClass = getColorClass(value, selectedMetric);
                    changeElementClass(executor.id, colorClass);
                });
        
                // Aggiorna lo stato con i nuovi valori
                setSimulationPercentages(updatedPercentages);
                setRealTime(newData.simulation.totalTime);
                setIdealTime(calculateIdealTime(newData.executors));
                setSimulationStarted(true);
            } else {
                alert("Carica un file JSON prima di avviare la simulazione.");
            }
        }catch{
            console.log("errore nella simulazione")
            alert("Error! The simulation cannot be completed.")
        }
    };
        
    //Grafico generale dei tempi
    const [idealTime, setIdealTime] = useState(0);
    const [realTime, setRealTime] = useState(0);

    const calculateIdealTime = (executors: Executor[]): number => {
        if (!modelerContext.compatibilities) {
            console.error("Compatibilities data is missing.");
            return 0;
        }
    
        // Mappa per la conversione dei formati di tempo in minuti
        const timeUnitToMinutes = {
            s: 1 / 60, // Secondi in minuti
            m: 1, // Minuti
            h: 60, // Ore in minuti
            d: 1440, // Giorni in minuti
        };
    
        return executors.reduce((total, executor) => {
            const executorTotal = executor.activities.reduce((sum, activity) => {
                // Trova la compatibilità corrispondente all'attività e all'esecutore
                const compatibility = modelerContext.compatibilities.find(
                    (comp: Compatibility) =>
                        comp.idActivity === activity.id && comp.idExecutor === executor.id
                );
    
                // Conversione del tempo ideale in minuti
                const idealTime =
                    compatibility && timeUnitToMinutes[compatibility.timeUnit]
                        ? Number(compatibility.time) * timeUnitToMinutes[compatibility.timeUnit]
                        : 0;
    
                return sum + idealTime;
            }, 0);
    
            return total + executorTotal;
        }, 0);
    };
    
    interface BPMNEventBus {
        on: (event: string, callback: (event: any) => void) => void;
        off: (event: string, callback: (event: any) => void) => void;
    }

    const [executorChartData, setExecutorChartData] = useState<{ id: string; value: number }[]>([]);
    const [activityChartData, setActivityChartData] = useState<{ id: string; value: number }[]>([]);
    const [producedItemsChartData, setProducedItemsChartData] = useState<{ id: string; value: number }[]>([]);


    useEffect(() => {
        if (!simulationStarted || !data || !modelerRef.current) {
            console.log("Simulation not started or data not available.");
            return;
        }
    
        console.log("Adding event listener for clicks, simulation is started:", simulationStarted);
    
        // Recupera elementRegistry e eventBus dal modeler
        const elementRegistry = modelerRef.current.get("elementRegistry");
        const eventBus = modelerRef.current.get("eventBus") as BPMNEventBus;;
    
        if (!elementRegistry || !eventBus) {
            console.error("ElementRegistry or EventBus not found in modeler.");
            return;
        }
    
        // Gestore per clic sugli elementi
        const handleElementClick = (event: any) => {
            const element = event.element;
        
            if (!element || !element.id) {
                setActiveChart('d3');
                setSelectedExecutor(null);
                setSelectedActivity(null);
                setProducedItemsChartData([]);
                return;
            }
        
            console.log("Elemento selezionato con ID:", element.id);
        
            const executor = data.executors.find((exec: Executor) => exec.id === element.id);
        
            const activity = data.executors
                .flatMap((exec: Executor) => exec.activities)
                .find((act: Activity) => act.id === element.id);
        
            if (executor) {
                setSelectedExecutor(executor);
        
                setExecutorChartData(executor.activities.map((activity: Activity) => ({
                    id: activity.id,
                    value: activity.busy
                })));
        
                setActiveChart('pie');
                setSelectedActivity(null);
                setProducedItemsChartData([]);
            } else if (activity) {
                setSelectedActivity(activity);
        
                // Primo grafico: esecutori coinvolti con tempo busy
                const executors = data.executors.filter((exec: Executor) =>
                    exec.activities.some((act: Activity) => act.id === activity.id)
                );
        
                const activityChartData = executors.map((exec: Executor) => {
                    const execActivity = exec.activities.find((act: Activity) => act.id === activity.id);
                    return {
                        id: exec.id,
                        value: execActivity ? execActivity.busy : 0
                    };
                });
        
                setActivityChartData(activityChartData);
        
                // Secondo grafico: numero di oggetti prodotti per attività per esecutore
                const producedItemsData = executors.map((exec: Executor) => {
                    const execActivity = exec.activities.find((act: Activity) => act.id === activity.id);
                    return {
                        id: exec.id,
                        value: execActivity ? execActivity.processedItems : 0
                    };
                });
        
                setProducedItemsChartData(producedItemsData);
                setActiveChart('pie');
                setSelectedExecutor(null);
            } else {
                setActiveChart('d3');
                setSelectedExecutor(null);
                setSelectedActivity(null);
                setProducedItemsChartData([]);
            }
        };
        
    
        // Ascolta gli eventi di clic sugli elementi BPMN
        eventBus.on("element.click", handleElementClick);
    
        return () => {
            console.log("Removing BPMN.js click event listener.");
            eventBus.off("element.click", handleElementClick);
        };
    }, [simulationStarted, data, modelerRef]);

    useEffect(() => {
        console.log("jsonData attuale:", data);
    }, [data]);
          
    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    useEffect(() => {
        if (!data || !selectedActivity) {
            setProducedItemsChartData([]);
            return;
        }
    
        const executors = data.executors.filter((exec: Executor) =>
            exec.activities.some((act: Activity) => act.id === selectedActivity.id)
        );
    
        const producedItemsData = executors.map((exec: Executor) => {
            const execActivity = exec.activities.find((act: Activity) => act.id === selectedActivity.id);
            return {
                id: exec.id,
                name: `Executor ${exec.id}`,
                busy: execActivity ? execActivity.processedItems : 0
            };
        });
    
        setProducedItemsChartData(producedItemsData);
    }, [selectedActivity, data]);

    // Funzione per ottenere i dati combinati per una singola attività
    const getBarChartDataForActivity = (activity: Activity): { 
        id: string, 
        busyPerProduct: number, 
        average: number, 
        max: number 
    } | null => {
        if (!selectedExecutor) {
            return null;
        }
    
        // Calcolo di busy per prodotto processato
        const busyPerProduct = activity.processedItems > 0
            ? activity.busy / activity.processedItems
            : 0; // Evita divisioni per 0
    
        // Calcolo del tempo medio
        const averageTime = activity.processedItems > 0
            ? (activity.busy + activity.sumWaitTimeInQueue) / activity.processedItems
            : 0;
    
        // Calcolo del tempo massimo
        const maxTime = activity.processedItems > 0
            ? (activity.busy / activity.processedItems) + activity.maxWaitTimeInQueue
            : 0;
    
        return {
            id: activity.id,
            busyPerProduct: busyPerProduct,  
            average: averageTime,
            max: maxTime
        };
    };
    
    const getExecutorMax = (executor: Executor): number => {
        // Calcolo del valore massimo tra tutte le attività dell'esecutore
        return Math.max(
            ...executor.activities.flatMap(activity => [
                activity.busy,
                activity.processedItems > 0 ? (activity.busy + activity.sumWaitTimeInQueue) / activity.processedItems : 0, // Tempo medio
                (activity.busy/activity.processedItems) + activity.maxWaitTimeInQueue, // Tempo massimo
            ])
        );
    };

    const [colorRanges, setColorRanges] = useState({
        availability: [0.5, 0.75],
        queueLength: [0.3, 0.6],
    });

    const getProcessedItemsByExecutors = (activityId: string) => {
        if (!data || !data.executors) return [];
    
        return data.executors
            .map((exec: Executor) => {
                const activity = exec.activities.find(act => act.id === activityId);
                return activity
                    ? { 
                        id: exec.id, 
                        name: elementNames.get(exec.id) || `Executor ${exec.id}`, // Otteniamo il nome dell'**esecutore**
                        processedItems: activity.processedItems ?? 0 
                    }
                    : null;
            })
            .filter((exec: Executor) => exec !== null && exec.processedItems > 0);
    };
      
    
    
    return (
        <div className="App">
        <ModelerRefContext.Provider value={modelerContext}>
            <MenuBar setXmlDiagramToEmpty={() => {}} setSelectedMetric={setSelectedMetric} startSimulation={startSimulation} simulationStarted={simulationStarted} openModal={openModal} />
            
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Change visualization parameters"
                style={{
                    overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                    content: { width: "35%", height: "180px", margin: "auto", padding: "20px", borderRadius: "10px", textAlign: "center" },
                }}
            >
                <h4>Change visualization parameters</h4>

                {/* Aggiornato per supportare Availability e Queue Length */}
                <ColorRangeSlider 
                    initialValues={colorRanges} 
                    selectedMetric={selectedMetric} // 🔹 Passiamo la metrica attualmente selezionata
                    onChange={(newRanges) => {
                        setColorRanges(newRanges); 
                        localStorage.setItem("colorThresholds", JSON.stringify(newRanges));
                    }} 
                />

                <div className="modalFooter">
                    <button onClick={closeModal} className="closeButton">Cancel</button>
                    <button onClick={() => {startSimulation(); closeModal();}}  className="okButton">OK</button>
                </div>
            </Modal>

            <div className="layoutContainer">
            <div id="diagramContainer" className="diagramContainer"></div>
            {simulationStarted && (
                <div className="sidePanel">
                    {activeChart === 'pie' && selectedActivity && (
                    <>
                        {/* Grafico a torta degli esecutori coinvolti nell'attività*/}
                        <PieChart 
                            activities={activityChartData.map(item => ({
                                id: item.id,
                                name: elementNames.get(item.id) || `Esecutore ${item.id}`,
                                busy: item.value 
                            }))} 
                            chartType="activity" 
                        />
                        {/* Grafico a torta per gli oggetti processati da ogni esecutore */}
                        <PieChart 
                            activities={getProcessedItemsByExecutors(selectedActivity.id)}
                            chartType="processedItems"
                        />
                    </>
                )}


                    {/* Grafico a Torta per l'Esecutore Selezionato */}
                    {activeChart === 'pie' && selectedExecutor && (
                    <>
                        {/* Passiamo i nomi corretti a PieChart */}
                        <PieChart 
                            activities={selectedExecutor.activities.map(activity => ({
                                id: activity.id,
                                name: elementNames.get(activity.id) || `Activity ${activity.id}`, // Recupera il nome o usa un fallback
                                busy: activity.busy
                            }))} 
                            chartType="executor" 
                        />

                        {/* Generiamo il BarChart per ogni attività */}
                        {selectedExecutor.activities.map(activity => {
                            const chartData = getBarChartDataForActivity(activity);
                            const executorMax = getExecutorMax(selectedExecutor);

                            return chartData ? (
                                <BarChart 
                                    key={activity.id} 
                                    title={`Activity ${elementNames.get(activity.id) || activity.id}`} // Mostriamo il nome corretto
                                    data={[chartData]} 
                                    globalMax={executorMax}
                                />
                            ) : null;
                        })}
                    </>
                )}


                    {/* Grafico D3 Generale */}
                    {activeChart === 'd3' && (
                        <D3Chart idealTime={idealTime} realTime={realTime} title="Ideal time vs Real time "/>
                    )}

                    {/* Applica le classi CSS dinamiche agli esecutori nel diagramma */}
                    {data.executors.forEach((executor: Executor) => {
                        const elementRegistry = modelerRef.current?.get("elementRegistry");
                        const element = elementRegistry?.get(executor.id) as Shape | undefined;

                        if (element) {
                            const gfx = modelerRef.current?.get("canvas").getGraphics(element) as HTMLElement | undefined;

                            if (gfx) {
                                // Rimuovi le classi precedenti
                                gfx.classList.remove('executor-highlight', 'executor-dimmed');

                                // Aggiungi le classi appropriate
                                if (selectedExecutor?.id === executor.id || !selectedExecutor) {
                                    gfx.classList.add('executor-highlight'); // Evidenzia l'esecutore selezionato
                                } else {
                                    gfx.classList.add('executor-dimmed'); // Oscura gli esecutori non selezionati
                                }
                            }
                        }
                    })}
                </div>
            )}

            </div>
            <PropertiesDrawer shape={selectedElement} isOpen={isDrawerOpen} setIsOpen={setDrawerOpen} simulationPercentages={simulationPercentages}/>
        </ModelerRefContext.Provider>
        </div>
    );
    }

    export default App;