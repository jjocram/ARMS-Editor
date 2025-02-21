import {ButtonToolbar, Dropdown} from "rsuite";
import DropdownItem from "rsuite/DropdownItem";
import {useRef, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import AccessoryListModal from "../ElementList/AccessoryListModal.tsx";
import InventoryListModal from "../ElementList/InventoryListModal.tsx";
import ProductRequestListModal from "../ElementList/ProductRequestListModal.tsx";

interface MenuBarProps {
    setXmlDiagramToEmpty: () => void
    runSimulation: () => void
}

export default function MenuBar({setXmlDiagramToEmpty, runSimulation} : MenuBarProps) {
    const modelerRef = useModelerRef();

    const [showInventoriesModal, setShowInventoriesModal] = useState(false);

    const [showAccessoryModal, setShowAccessoryModal] = useState(false);

    const [showProductRequestModal, setShowProductRequestModal] = useState(false);

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
    }

    return (
        <>
            <ButtonToolbar>
                <Dropdown title="File" style={{zIndex: 999}}>
                    <DropdownItem onSelect={() => setXmlDiagramToEmpty()}>New diagram</DropdownItem>
                    <DropdownItem onSelect={() => fileInputRef.current?.click()}>Upload diagram <input
                        ref={fileInputRef}
                        type="file" hidden
                        onChange={handleFileInput}/></DropdownItem>
                    <DropdownItem onSelect={() => downloadDiagram()}>Download diagram</DropdownItem>
                </Dropdown>
                <Dropdown title="View" style={{zIndex: 999}}>
                    <DropdownItem>Show/Hide Executors</DropdownItem>
                    <DropdownItem>Show/Hide Warnings</DropdownItem>
                </Dropdown>
                <Dropdown title="Simulation" style={{zIndex: 999}}>
                    <DropdownItem onSelect={() => setShowInventoriesModal(true)}>Inventories</DropdownItem>
                    <DropdownItem onSelect={() => setShowAccessoryModal(true)}>Accessories</DropdownItem>
                    <DropdownItem onSelect={() => setShowProductRequestModal(true)}>Product requests</DropdownItem>
                    <Dropdown.Separator />
                    <DropdownItem onSelect={runSimulation}>Run simulation</DropdownItem>
                </Dropdown>
            </ButtonToolbar>

            <InventoryListModal show={showInventoriesModal} setShow={setShowInventoriesModal}/>
            <AccessoryListModal show={showAccessoryModal} setShow={setShowAccessoryModal}/>
            <ProductRequestListModal show={showProductRequestModal} setShow={setShowProductRequestModal}/>
        </>
    )
}