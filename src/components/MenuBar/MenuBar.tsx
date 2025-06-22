import {ButtonToolbar, Dropdown} from "rsuite";
import DropdownItem from "rsuite/DropdownItem";
import {ChangeEvent, useRef, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import AccessoryListModal from "../Modals/AccessoryListModal.tsx";
import InventoryListModal from "../Modals/InventoryListModal.tsx";
import ProductRequestListModal from "../Modals/ProductRequestListModal.tsx";
import {MetricsOptionsModal} from "../Modals/MetricsOptionModal/MetricsOptionsModal.tsx";
import {ExecutorMetricsRanges, TypeOfMetrics} from "../../ExecutorsColorRanges.ts";

interface MenuBarProps {
    setXmlDiagram: (fileName: string) => void
    runSimulation: () => void
    loadSimulationResult: (resultFile: string) => void
    executorsColorThresholds: ExecutorMetricsRanges
    setExecutorsColorThresholds: (executorsColorThresholds: ExecutorMetricsRanges) => void
    selectedMetric: TypeOfMetrics
    setSelectedMetric: (metric: TypeOfMetrics) => void
}

export default function MenuBar(props: MenuBarProps) {
    const dropDownStyle = {
        zIndex: 999
    }

    const modelerRef = useModelerRef();

    const [showInventoriesModal, setShowInventoriesModal] = useState(false);

    const [showAccessoryModal, setShowAccessoryModal] = useState(false);

    const [showProductRequestModal, setShowProductRequestModal] = useState(false);

    const [showMetricsOptionsModal, setShowMetricsOptionsModal] = useState(false);

    function fakeRunExample(modelName: string) {
        props.setXmlDiagram(`/ARMS-Editor/${modelName}.bpmn`)
        props.loadSimulationResult(`${modelName}_result.json`)
    }

    function downloadDiagram() {
        modelerRef.modeler.current?.saveXML({format: true})
            .then(res => {
                const a = document.createElement('a');
                const file = new Blob([res.xml ?? ""], {type: 'application/xml'});
                a.href = URL.createObjectURL(file);
                a.download = "diagram.bpmn";
                a.click();
                URL.revokeObjectURL(a.href);
            })
    }

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.item(0);
        if (!file) {
            return
        }

        const reader = new FileReader();
        reader.onload = () => {
            modelerRef.modeler.current?.importXML(reader.result as string)
        }
        reader.onerror = () => {
            console.error(reader.error)
        }

        reader.readAsText(file);
    }

    return (
        <>
            <ButtonToolbar>
                <Dropdown title="File" style={dropDownStyle}>
                    <DropdownItem onSelect={() => props.setXmlDiagram("/ARMS-Editor/empty_diagram.bpmn")}>New diagram</DropdownItem>
                    <DropdownItem onSelect={() => fileInputRef.current?.click()}>Upload diagram <input
                        ref={fileInputRef}
                        type="file" hidden
                        onChange={handleFileInput}/></DropdownItem>
                    <DropdownItem onSelect={() => downloadDiagram()}>Download diagram</DropdownItem>
                </Dropdown>
                <Dropdown title="View" style={dropDownStyle}>
                    <DropdownItem>Show/Hide Executors</DropdownItem>
                    <DropdownItem>Show/Hide Warnings</DropdownItem>
                </Dropdown>
                <Dropdown title="Simulation" style={dropDownStyle}>
                    <DropdownItem onSelect={() => setShowInventoriesModal(true)}>Inventories</DropdownItem>
                    <DropdownItem onSelect={() => setShowAccessoryModal(true)}>Accessories</DropdownItem>
                    <DropdownItem onSelect={() => setShowProductRequestModal(true)}>Product requests</DropdownItem>
                    <Dropdown.Separator/>
                    <DropdownItem onSelect={props.runSimulation}>Run simulation</DropdownItem>
                </Dropdown>
                <Dropdown title="Metrics" style={dropDownStyle}>
                    <DropdownItem onSelect={() => props.setSelectedMetric("availability")}>Availability</DropdownItem>
                    <DropdownItem onSelect={() => props.setSelectedMetric("queueLength")}>Queue length</DropdownItem>
                    <Dropdown.Separator/>
                    <DropdownItem onSelect={() => setShowMetricsOptionsModal(true)}>Options</DropdownItem>
                </Dropdown>
                <Dropdown title="Examples" style={dropDownStyle}>
                    <DropdownItem onSelect={() => fakeRunExample("eyeglasses")}>Eyeglasses</DropdownItem>
                    <DropdownItem onSelect={() => fakeRunExample("eyeglasses_less_resource")}>Eyeglasses with less resources</DropdownItem>
                    <DropdownItem onSelect={() => fakeRunExample("woodBooklets")}>Wood booklets</DropdownItem>
                </Dropdown>
            </ButtonToolbar>

            <InventoryListModal show={showInventoriesModal} setShow={setShowInventoriesModal}/>
            <AccessoryListModal show={showAccessoryModal} setShow={setShowAccessoryModal}/>
            <ProductRequestListModal show={showProductRequestModal} setShow={setShowProductRequestModal}/>
            <MetricsOptionsModal show={showMetricsOptionsModal}
                                 setShow={setShowMetricsOptionsModal}
                                 executorsColorThresholds={props.executorsColorThresholds}
                                 setExecutorsColorThresholds={props.setExecutorsColorThresholds}
                                 selectedMetric={props.selectedMetric}/>
        </>
    )
}