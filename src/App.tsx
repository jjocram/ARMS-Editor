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
interface Activity {
    id: string;
    name: string;
    busy: number;
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
    busy: number; 
    maxWaitTimeInQueue: number;
    avgWaitTimeInQueue: number;
    processedItems: number;
    activities: Activity[];
}
interface BPMNEventBus {
    on: (event: string, callback: (event: any) => void) => void;
    off: (event: string, callback: (event: any) => void) => void;
}

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [modelerContext, _setModelerContext] = useState<ModelerContext>(new ModelerContext());
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);

    const [data, setData] = useState<any | null>(null); 
    const [selectedMetric, setSelectedMetric] = useState<'Availability' | 'QueueLength'>('Availability');  

    const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null); // Esecutore selezionato
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null); // Attività selezionata
    const [activeChart, setActiveChart] = useState<'pie' | 'd3'>('d3'); // Tipo di grafico attivo
    const [elementNames, setElementNames] = useState<Map<string, string>>(new Map());

    const [isModalOpen, setModalOpen] = useState(false);
    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    const [simulationPercentages, setSimulationPercentages] = useState<Map<string, { Availability: number, QueueLength: number }>>(new Map());
    const [simulationStarted, setSimulationStarted] = useState(false);
    
    const [, setExecutorChartData] = useState<{ id: string; value: number }[]>([]);
    const [activityChartData, setActivityChartData] = useState<{ id: string; value: number }[]>([]);
    const [, setProducedItemsChartData] = useState<{ id: string; value: number }[]>([]);

    const [idealTime, setIdealTime] = useState(0);
    const [realTime, setRealTime] = useState(0);

    const [colorRanges, setColorRanges] = useState<{
        availability: [number, number];
        queueLength: [number, number];
    }>({
        availability: [0.5, 0.75],  
        queueLength: [0.3, 0.6],    
    });
    

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

            // Extract names from all BPMN elements
            const allElements = elementRegistry.getAll();
            allElements.forEach(element => {
                if (element.businessObject && element.businessObject.name) {
                    namesMap.set(element.id, element.businessObject.name);
                }
            });

            setElementNames(namesMap);
        }

    }

    function setXmlDiagramToEmpty() {
        fetch("/empty_diagram.bpmn")
            .then(res => res.text())
            .then(data => modelerRef.current?.importXML(data))
            .catch(err => console.error(err));
    }

    const calculateBusyValueForExecutor = (executor: Executor): number => {
        const totalBusyTime = executor.busy;
        const totalQueueTime = executor.sumWaitTimeInQueue || 0;
    
        const totalTime = totalBusyTime + totalQueueTime;
    
        if (totalTime === 0) {
            //console.warn(`Total time (busy + queue) for Executor ${executor.id} is zero.`);
            return 0;
        }
    
        const value = totalBusyTime / totalTime;
        //console.log(`Executor ${executor.id}: busy value = ${value}`);
        return value; 
    };
    
    const getColorClass = (value: number, selectedMetric: string): string => {
        // Retrieves the thresholds from localStorage, with a fallback to default values
        const storedThresholds = localStorage.getItem('colorThresholds');
        let thresholds: { availability: [number, number]; queueLength: [number, number] };
    
        try {
            const parsedThresholds = storedThresholds ? JSON.parse(storedThresholds) : {};
    
            // Forzare come tuple `[number, number]`
            const availability: [number, number] = Array.isArray(parsedThresholds.availability) && parsedThresholds.availability.length === 2
                ? [parsedThresholds.availability[0], parsedThresholds.availability[1]] as [number, number]
                : [0.5, 0.75];
    
            const queueLength: [number, number] = Array.isArray(parsedThresholds.queueLength) && parsedThresholds.queueLength.length === 2
                ? [parsedThresholds.queueLength[0], parsedThresholds.queueLength[1]] as [number, number]
                : [0.3, 0.6];
    
            thresholds = { availability, queueLength };
        } catch (error) {
            //console.error("Errore nel parsing del localStorage:", error);
            thresholds = { availability: [0.5, 0.75], queueLength: [0.3, 0.6] };
        }
    
        //console.log("Using thresholds:", thresholds);
    
        if (value === 0) {
            return '';
        }
    
        // Determines the ranges based on the selected metric
        const [yellowThreshold, greenThreshold] = selectedMetric === 'Availability' 
            ? thresholds.availability 
            : thresholds.queueLength;
    
        // Apply colors based on values
        if (value > greenThreshold) {
            return 'bpmn-element-green';
        } else if (value >= yellowThreshold) {
            return 'bpmn-element-yellow';
        } else {
            return 'bpmn-element-red';
        }
    };        

    // Change the CSS class of an element in the diagram using the ID
    const changeElementClass = (elementId: string, colorClass: string) => {
        const elementRegistry = modelerRef.current?.get("elementRegistry") as ElementRegistry | undefined;
        const element = elementRegistry?.get(elementId) as Shape | undefined;

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
                //console.log(modelerRef.current?.saveXML().then(response => console.log(response)));
                //console.log("Simulazione avviata con dati:", newData);
        
                const executors: Executor[] = newData.executors;
        
                const updatedPercentages: Map<string, { Availability: number; QueueLength: number }> = new Map();
        
                executors.forEach((executor: Executor) => {
                    let busyValue = 0;
                    let idleValue = 0;
        
                    if (selectedMetric === 'Availability') {
                        busyValue = calculateBusyValueForExecutor(executor);
                    } else {
                        const simulationTotalTime = newData.simulation.totalTime || 1;
                        idleValue = executor.idle / simulationTotalTime;
                    }
        
                    updatedPercentages.set(executor.id, {
                        Availability: busyValue,
                        QueueLength: idleValue,
                    });
        
                    // Determines the color class based on the selected metric
                    const value = selectedMetric === 'Availability' ? busyValue : idleValue;
                    const colorClass = getColorClass(value, selectedMetric);
                    changeElementClass(executor.id, colorClass);
                });
        
                // Update status with new values
                setSimulationPercentages(updatedPercentages);
                setRealTime(newData.simulation.totalTime);
                setIdealTime(calculateIdealTime(newData.executors));
                setSimulationStarted(true);
            } else {
                alert("No data available ");
            }
        }catch{
            //console.log("errore nella simulazione")
            alert("Error! The simulation cannot be completed.")
        }
    };

    const calculateIdealTime = (executors: Executor[]): number => {
        if (!modelerContext.compatibilities) {
            console.error("Compatibilities data is missing.");
            return 0;
        }
    
        const timeUnitToMinutes = {
            s: 1 / 60,
            m: 1, 
            h: 60, 
            d: 1440, 
        };
    
        return executors.reduce((total, executor) => {
            const executorTotal = executor.activities.reduce((sum, activity) => {
                // Find the compatibility between task and performer
                const compatibility = modelerContext.compatibilities.find(
                    (comp: Compatibility) =>
                        comp.idActivity === activity.id && comp.idExecutor === executor.id
                );
    
                // Conversion of ideal time in minutes
                const idealTime =
                    compatibility && timeUnitToMinutes[compatibility.timeUnit]
                        ? Number(compatibility.time) * timeUnitToMinutes[compatibility.timeUnit]
                        : 0;
    
                return sum + idealTime;
            }, 0);
    
            return total + executorTotal;
        }, 0);
    };

    useEffect(() => {
        if (!simulationStarted || !data || !modelerRef.current) {
            //console.log("Simulation not started or data not available.");
            return;
        }
    
        //console.log("Adding event listener for clicks, simulation is started:", simulationStarted);
    
        const elementRegistry = modelerRef.current.get("elementRegistry");
        const eventBus = modelerRef.current.get("eventBus") as BPMNEventBus;;
    
        if (!elementRegistry || !eventBus) {
            console.error("ElementRegistry or EventBus not found in modeler.");
            return;
        }
    
        //click elements detector
        const handleElementClick = (event: any) => {
            const element = event.element;
        
            if (!element || !element.id) {
                setActiveChart('d3');
                setSelectedExecutor(null);
                setSelectedActivity(null);
                setProducedItemsChartData([]);
                return;
            }
        
            //console.log("Elemento selezionato con ID:", element.id);
        
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
        
                // First graph: executors involved with busy time
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
        
                // Second graph: number of items produced for each activity for each executor
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
        
        eventBus.on("element.click", handleElementClick);
    
        return () => {
            //console.log("Removing BPMN.js click event listener.");
            eventBus.off("element.click", handleElementClick);
        };
    }, [simulationStarted, data, modelerRef]);
          
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

    // Obtain combined data for a single activity
    const getBarChartDataForActivity = (activity: Activity): { 
        id: string, 
        busyPerProduct: number, 
        average: number, 
        max: number 
    } | null => {
        if (!selectedExecutor) {
            return null;
        }
    
        // busy for each product
        const busyPerProduct = activity.processedItems > 0
            ? activity.busy / activity.processedItems
            : 0; 
    
        // avg time
        const averageTime = activity.processedItems > 0
            ? (activity.busy + activity.sumWaitTimeInQueue) / activity.processedItems
            : 0;
    
        // worst
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
        return Math.max(
            ...executor.activities.flatMap(activity => [
                activity.busy,
                activity.processedItems > 0 ? (activity.busy + activity.sumWaitTimeInQueue) / activity.processedItems : 0, 
                (activity.busy/activity.processedItems) + activity.maxWaitTimeInQueue,
            ])
        );
    };

    const getProcessedItemsByExecutors = (activityId: string) => {
        if (!data || !data.executors) return [];
    
        return data.executors
            .map((exec: Executor) => {
                const activity = exec.activities.find(act => act.id === activityId);
                return activity
                    ? { 
                        id: exec.id, 
                        name: elementNames.get(exec.id) || `Executor ${exec.id}`, 
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
            >   <h4>Change visualization parameters</h4>

                <ColorRangeSlider 
                    initialValues={colorRanges} 
                    selectedMetric={selectedMetric}
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
                        {/*PieChart involved executors in activity*/}
                        <PieChart 
                            activities={activityChartData.map(item => ({
                                id: item.id,
                                name: elementNames.get(item.id) || `Esecutore ${item.id}`,
                                busy: item.value 
                            }))} 
                            chartType="activity" 
                        />
                        {/*Pie chart for objects processed by each executor */}
                        <PieChart 
                            activities={getProcessedItemsByExecutors(selectedActivity.id)}
                            chartType="processedItems"
                        />
                    </>
                )}


                    {/* Pie Chart for the Selected Executor */}
                    {activeChart === 'pie' && selectedExecutor && (
                    <>
                        <PieChart 
                            activities={selectedExecutor.activities.map(activity => ({
                                id: activity.id,
                                name: elementNames.get(activity.id) || `Activity ${activity.id}`,
                                busy: activity.busy
                            }))} 
                            chartType="executor" 
                        />

                        {/*BarChart for each activity*/}
                        {selectedExecutor.activities.map(activity => {
                            const chartData = getBarChartDataForActivity(activity);
                            const executorMax = getExecutorMax(selectedExecutor);

                            return chartData ? (
                                <BarChart 
                                    key={activity.id} 
                                    title={`Activity ${elementNames.get(activity.id) || activity.id}`} 
                                    data={[chartData]} 
                                    globalMax={executorMax}
                                />
                            ) : null;
                        })}
                    </>
                )}


                    {/* Ideal vs Real time */}
                    {activeChart === 'd3' && (
                        <D3Chart idealTime={idealTime} realTime={realTime} title="Ideal time vs Real time "/>
                    )}

                    {/* Apply dynamic CSS classes to executors in the diagram */}
                    {data.executors.forEach((executor: Executor) => {
                        
                        const elementRegistry = modelerRef.current?.get("elementRegistry") as ElementRegistry | undefined;
                        const element = elementRegistry?.get(executor.id) as Shape | undefined;
                                            
                        if (element) {
                            const gfx = modelerRef.current?.get("canvas").getGraphics(element) as HTMLElement | undefined;

                            if (gfx) {
                                gfx.classList.remove('executor-highlight', 'executor-dimmed');

                                if (selectedExecutor?.id === executor.id || !selectedExecutor) {
                                    gfx.classList.add('executor-highlight'); 
                                } else {
                                    gfx.classList.add('executor-dimmed'); 
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