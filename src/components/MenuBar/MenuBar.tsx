import {ButtonToolbar, Dropdown} from "rsuite";
import DropdownItem from "rsuite/DropdownItem";
import {useRef, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import AccessoryListModal from "../ElementList/AccessoryListModal.tsx";
import InventoryListModal from "../ElementList/InventoryListModal.tsx";
import ProductRequestListModal from "../ElementList/ProductRequestListModal.tsx";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPencilAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";

import "./MenuBar.css";

interface MenuBarProps {
    setXmlDiagramToEmpty: () => void;
    setSelectedMetric: React.Dispatch<React.SetStateAction<'Availability' | 'QueueLength'>>; 
    startSimulation: () => Promise<void>;
    simulationStarted: boolean; 
    openModal: () => void;
}

export default function MenuBar({setXmlDiagramToEmpty, setSelectedMetric, startSimulation, simulationStarted, openModal} : MenuBarProps) {
    const modelerRef = useModelerRef();

    const [showInventoriesModal, setShowInventoriesModal] = useState(false);
    const [showAccessoryModal, setShowAccessoryModal] = useState(false);
    const [showProductRequestModal, setShowProductRequestModal] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);

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

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
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
        console.log(fileInputRef);
    }

    const handleSelectMetric = (metric: 'Availability' | 'QueueLength') => {
        setSelectedMetric(metric);  
    };

    const handleStartSimulation = async () => {
        setLoading(true);  
        await startSimulation();  
        setLoading(false); 
        setShowConfirmModal(false);
    };

    return (
        <>
            <ButtonToolbar>
                <Dropdown title="File">
                    <DropdownItem onSelect={() => setXmlDiagramToEmpty()}>New diagram</DropdownItem>
                    <DropdownItem onSelect={() => fileInputRef.current?.click()}>Upload diagram <input
                        ref={fileInputRef}
                        type="file" hidden
                        onChange={handleFileInput}/></DropdownItem>
                    <DropdownItem onSelect={() => downloadDiagram()}>Download diagram</DropdownItem>
                </Dropdown>
                <Dropdown title="View">
                    <DropdownItem>Show/Hide Executors</DropdownItem>
                    <DropdownItem>Show/Hide Warnings</DropdownItem>
                </Dropdown>
                <Dropdown title="Simulation">
                    <DropdownItem onSelect={() => setShowInventoriesModal(true)}>Inventories</DropdownItem>
                    <DropdownItem onSelect={() => setShowAccessoryModal(true)}>Accessories</DropdownItem>
                    <DropdownItem onSelect={() => setShowProductRequestModal(true)}>Product requests</DropdownItem>
                </Dropdown>
                <Dropdown title="Metrics">
                    <DropdownItem onSelect={() => handleSelectMetric('Availability')}>Availability</DropdownItem>
                    <DropdownItem onSelect={() => handleSelectMetric('QueueLength')}>Queue length</DropdownItem>
                </Dropdown>
                
                <button className="editButton" onClick={() => setShowConfirmModal(true)} title="Start Simulation">
                    <FontAwesomeIcon icon={faPlay} />
                </button>
                    
                {simulationStarted && (
                    <button onClick={openModal} className="editButton" title="Modifica Simulazione">
                        <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                )}
            </ButtonToolbar>

            <Modal
                isOpen={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
                contentLabel="Conferma Avvio Simulazione"
                style={{
                    overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                    content: { width: "30%", height: "160px", margin: "auto", padding: "20px", borderRadius: "10px", textAlign: "center" },
                }}
            >
                <h4>Start simulation with current parameters</h4>
                <p>To change them go to menu <b>"Simulation"</b></p>

                {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ margin: "20px 0" }} />
                ) : (
                    <div className="modalFooter">
                        <button onClick={() => setShowConfirmModal(false)} className="cancelButton">Cancel</button>
                        <button onClick={handleStartSimulation} className="okButton">OK</button>
                    </div>
                )}
            </Modal>
                
            <InventoryListModal show={showInventoriesModal} setShow={setShowInventoriesModal}/>
            <AccessoryListModal show={showAccessoryModal} setShow={setShowAccessoryModal}/>
            <ProductRequestListModal show={showProductRequestModal} setShow={setShowProductRequestModal}/>
            
        </>
    )
}