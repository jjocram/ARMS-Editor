import {useModelerRef} from "../ModelerContext.ts";
import {useEffect, useState} from "react";
import {generateId} from "../Utils.ts";
import {IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";

interface InventoryListModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

interface InventoryInput {
    id: string;
    name?: string;
    quantity?: number;
}

export default function InventoryListModal({show, setShow}: InventoryListModalProps) {
    const modelContext = useModelerRef();

    const [inventoryInputs, setInventoryInputs] = useState<InventoryInput[]>([]);

    useEffect(() => {
        if (show) {
            setInventoryInputs([...modelContext.inventories.values()].map(inventory => {
                return {
                    id: inventory.id,
                    name: inventory.name,
                    quantity: inventory.startQuantity
                }
            }));
        }
    }, [show]);

    function close() {

        setShow(false);
    }

    function onNameChange(value: string, inventory: InventoryInput) {
        setInventoryInputs(prevState => prevState.map(prevInventory => prevInventory.id == inventory.id ? {
            ...prevInventory,
            name: value
        } : prevInventory));
    }

    function onQuantityChange(value: number, inventory: InventoryInput) {
        setInventoryInputs(prevState => prevState.map(prevInventory => prevInventory.id == inventory.id ? {
            ...prevInventory,
            quantity: value
        } : prevInventory));
    }

    function addNewInventory() {
        setInventoryInputs(prevState => [...prevState, {
            id: generateId("Inventory"),
            name: undefined,
            quantity: undefined
        }])
    }

    return (
        <Modal open={show} onClose={close}>
            <Modal.Header>Inventory in process</Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                {inventoryInputs.map(inventoryInput => (
                    <InputGroup key={inventoryInput.id}>
                        <Input value={inventoryInput.name ?? ""} placeholder="Inventory name"
                               onChange={(value) => onNameChange(value, inventoryInput)}/>
                        <InputNumber value={inventoryInput.quantity ?? ""} placeholder={"Start quantity"} min={0}
                                     onChange={(value) => onQuantityChange(value as number, inventoryInput)}/>
                    </InputGroup>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewInventory} />
            </Stack>
        </Modal>
    )
}