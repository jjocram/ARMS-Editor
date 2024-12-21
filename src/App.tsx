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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";

import ColorRangeSlider from './components/ElementList/ColorRangeSlider.tsx';

Modal.setAppElement("#root");
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
    
    const [jsonData, setJsonData] = useState<any | null>(null); 

    const [selectedMetric, setSelectedMetric] = useState<'busy' | 'idle'>('busy');  

    const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null); // Esecutore selezionato
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null); // Attività selezionata
    //const [pieChartData, setPieChartData] = useState<{ id: string; value: number }[]>([]); // Dati per grafico a torta
    const [activeChart, setActiveChart] = useState<'pie' | 'd3'>('d3'); // Tipo di grafico attivo

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
        busy: number;
        busyUnit: TimeUnit;  
        maxWaitTimeInQueue: number;
        avgWaitTimeInQueue: number;
        sumWaitTimeInQueue: number;
        processedItems: number;
    }

    interface Executor {
        id: string;
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

    const [simulationPercentages, setSimulationPercentages] = useState<Map<string, { busy: number, idle: number }>>(new Map());
    const [simulationStarted, setSimulationStarted] = useState(false);
    
    const calculateBusyValueForExecutor = (executor: Executor): number => {
        const totalBusyTime = executor.busy; // Tempo totale busy fornito
        const totalQueueTime = executor.sumWaitTimeInQueue || 0; // Tempo totale in coda fornito
    
        const totalTime = totalBusyTime + totalQueueTime;
    
        if (totalTime === 0) {
            console.warn(`Total time (busy + queue) for Executor ${executor.id} is zero.`);
            return 0;
        }
    
        // Formula per il calcolo del valore busy
        const value = totalBusyTime / totalTime;
        console.log(`Executor ${executor.id}: busy value = ${value}`);
        return value; // Valore tra 0 e 1
    };
    
    const getColorClass = (value: number, selectedMetric: string) => {
        if (value === 0) {
            return ''; // Nessuna classe
        }
        if (selectedMetric === 'busy') {
            if (value > 0.75) {
                return 'bpmn-element-green'; // Verde
            } else if (value >= 0.51 && value <= 0.74) {
                return 'bpmn-element-yellow'; // Giallo
            } else {
                return 'bpmn-element-red'; // Rosso
            }
        } else { // Metrica 'idle'
            if (value <= 0.05) {
                return 'bpmn-element-green'; // Verde
            } else if (value <= 0.25) {
                return 'bpmn-element-yellow'; // Giallo
            } else {
                return 'bpmn-element-red'; // Rosso
            }
        }
    };
    
    const startSimulation = () => {
        if (jsonData) {
            console.log("Simulazione avviata con dati:", jsonData);
    
            const executors: Executor[] = jsonData.executors;
    
            const updatedPercentages: Map<string, { busy: number; idle: number }> = new Map();
    
            executors.forEach((executor: Executor) => {
                let busyValue = 0;
                let idleValue = 0;
    
                if (selectedMetric === 'busy') {
                    // Calcola il valore di busy con la nuova formula
                    busyValue = calculateBusyValueForExecutor(executor);
                } else {
                    // Calcola il valore di idle
                    const simulationTotalTime = jsonData.simulation.totalTime || 1;
                    idleValue = executor.idle / simulationTotalTime;
                }
    
                // Aggiungi i valori alla mappa mantenendo entrambe le proprietà
                updatedPercentages.set(executor.id, {
                    busy: busyValue,
                    idle: idleValue,
                });
    
                // Determina la classe del colore in base alla metrica selezionata
                const value = selectedMetric === 'busy' ? busyValue : idleValue;
                const colorClass = getColorClass(value, selectedMetric);
                changeElementClass(executor.id, colorClass);
            });
    
            // Aggiorna lo stato con i nuovi valori
            setSimulationPercentages(updatedPercentages);
            setRealTime(jsonData.simulation.totalTime);
            setIdealTime(calculateIdealTime(jsonData.executors));
            setSimulationStarted(true);
        } else {
            alert("Carica un file JSON prima di avviare la simulazione.");
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


    useEffect(() => {
        if (!simulationStarted || !jsonData || !modelerRef.current) {
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
        
            // Controlla se l'elemento ha un ID valido
            if (!element || !element.id) {
                console.log("Nessun elemento trovato o l'elemento non ha un ID.");
                setActiveChart('d3'); // Torna al grafico D3 di default
                setSelectedExecutor(null);
                setSelectedActivity(null);
                return;
            }
        
            console.log("Elemento selezionato con ID:", element.id);
        
            // Cerca se l'elemento è un esecutore
            const executor = jsonData.executors.find((exec: Executor) => exec.id === element.id);
        
            // Cerca se l'elemento è un'attività (analizza tutte le attività degli esecutori)
            const activity = jsonData.executors
                .flatMap((exec: Executor) => exec.activities) // Estrae tutte le attività
                .find((act: Activity) => act.id === element.id); // Cerca quella selezionata
        
            // Se è un esecutore
            if (executor) {
                console.log("Esecutore trovato:", executor.id);
                setSelectedExecutor(executor);
        
                // Prepara i dati per il grafico delle attività svolte dall'esecutore
                setExecutorChartData(executor.activities.map( (activity:Activity) => ({
                    id: activity.id,
                    value: activity.busy
                })));
        
                setActiveChart('pie'); // Mostra grafico a torta
                setSelectedActivity(null); // Resetta attività
            } 
            // Se è un'attività
            else if (activity) {
                console.log("Attività trovata:", activity.id);
                setSelectedActivity(activity);
        
                // Prepara i dati per il grafico degli esecutori coinvolti in quell'attività
                const executors = jsonData.executors.filter((exec: Executor) =>
                    exec.activities.some((act: Activity) => act.id === activity.id)
                );
        
                const activityChartData = executors.map((exec: Executor) => {
                    const execActivity = exec.activities.find((act: Activity) => act.id === activity.id);
                    return {
                        id: exec.id, // ID dell'esecutore
                        value: execActivity ? execActivity.busy : 0 // Tempo occupato
                    };
                });
        
                setActivityChartData(activityChartData);
                setActiveChart('pie'); // Mostra grafico a torta
                setSelectedExecutor(null); // Resetta esecutore
            } 
            // Se non è né un esecutore né un'attività
            else {
                console.log("Nessuna corrispondenza trovata.");
                setActiveChart('d3'); // Torna al grafico D3 di default
                setSelectedExecutor(null);
                setSelectedActivity(null);
            }
        };
    
        // Ascolta gli eventi di clic sugli elementi BPMN
        eventBus.on("element.click", handleElementClick);
    
        return () => {
            console.log("Removing BPMN.js click event listener.");
            eventBus.off("element.click", handleElementClick);
        };
    }, [simulationStarted, jsonData, modelerRef]);

    useEffect(() => {
        console.log("jsonData attuale:", jsonData);
    }, [jsonData]);
          
    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    // Funzione helper per convertire il tempo in minuti
    const convertToMinutes = (time: number, unit: TimeUnit): number => {
        switch (unit) {
            case 's': return time / 60;   // Converti secondi in minuti
            case 'm': return time;        // Minuti sono già minuti
            case 'h': return time * 60;   // Converti ore in minuti
            case 'd': return time * 1440; // Converti giorni in minuti
            default: return time;         // Gestire il caso di default come non necessario
        }
    };

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
            busyPerProduct: busyPerProduct,  // Nuovo dato
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

    const [colorRanges] = useState({
        green: 0.75, // Valore iniziale per il verde
        yellow: 0.5, // Valore iniziale per il giallo
    });

    const handleRangeChange = (ranges: { green: number; yellow: number; red: number }) => {
        console.log("Nuovi range:", ranges);
    };

    return (
        <div className="App">
        <ModelerRefContext.Provider value={modelerContext}>
            <MenuBar setXmlDiagramToEmpty={() => {}} setSelectedMetric={setSelectedMetric} />
                <div style={{ position: 'absolute', top: 10, right: '20px', zIndex: 10 }}>
                    {simulationStarted && (
                        <button onClick={openModal} className="editButton" title="Modifica Simulazione" style={{ position: 'absolute', top: '50px', right: '350px', zIndex: 10, }}>
                            <FontAwesomeIcon icon={faPencilAlt} />
                        </button>
                    )}
                </div>
            <div className="simulationControls">
                <input type="file" accept=".json" onChange={handleFileChange} className="fileInput"/>
                <button onClick={startSimulation} className="startSimulationButton">Avvia Simulazione</button>
                
            </div>
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                contentLabel="Modifica Simulazione"
                style={{overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                    content: {width: "400px", height: "300px", margin: "auto", padding: "20px", borderRadius: "10px",},
                }}
            >
                <h4>Modifica Parametri della Simulazione</h4>
                <ColorRangeSlider initialValues={colorRanges} onChange={handleRangeChange} />
                <div className="modalFooter">
                    <button onClick={closeModal} className="closeButton">
                        Chiudi
                    </button>
                    <button className="saveButton">Salva Modifiche</button>
                </div>
            </Modal>
            <div className="layoutContainer">
            <div id="diagramContainer" className="diagramContainer"></div>
            {simulationStarted && (
                <div className="sidePanel">
                    {activeChart === 'pie' && selectedActivity && (
                        <PieChart activities={activityChartData.map(item => ({
                            id: item.id,
                            busy: item.value
                        }))} />
                    )}
                    {/* Grafico a Torta per l'Esecutore Selezionato */}
                    {activeChart === 'pie' && selectedExecutor && (
                        <>
                            <PieChart activities={selectedExecutor.activities} />
                            {selectedExecutor.activities.map(activity => {
                                const chartData = getBarChartDataForActivity(activity);
                                const executorMax = getExecutorMax(selectedExecutor);

                                return chartData ? (
                                    <BarChart key={activity.id} title={`Activity ${activity.id}`} data={[chartData]} globalMax={executorMax}/>
                                ) : null;
                            })}
                        </>
                    )}

                    {/* Grafico D3 Generale */}
                    {activeChart === 'd3' && (
                        <D3Chart idealTime={idealTime} realTime={realTime} title="Confronto tempo Ideale e Reale"/>
                    )}

                    {/* Applica le classi CSS dinamiche agli esecutori nel diagramma */}
                    {jsonData.executors.forEach((executor: Executor) => {
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