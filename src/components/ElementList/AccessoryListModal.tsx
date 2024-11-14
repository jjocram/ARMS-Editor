import {Button, HStack, IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import {useModelerRef} from "../../ModelerContext.ts";
import {useEffect, useState} from "react";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import TrashIcon from '@rsuite/icons/Trash';
import {generateId} from "../../Utils.ts";
import {Accessory} from "../../Models/Accessory.ts";

interface AccessoryListModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

interface AccessoryInput {
    id: string;
    name?: string;
    quantity?: number;
}

export default function AccessoryListModal({show, setShow}: AccessoryListModalProps) {
    const modelContext = useModelerRef();

    const [accessoryInputs, setAccessoryInputs] = useState<AccessoryInput[]>([]);
    const [openDeleteAccessory, setOpenDeleteAccessory] = useState(false);

    useEffect(() => {
        if (show) {
            setAccessoryInputs([...modelContext.availableAccessories.values()].map(accessory => {
                return {
                    id: accessory.id,
                    name: accessory.name,
                    quantity: accessory.quantity,
                }
            }));
        }
    }, [show])

    function close() {
        const updatedAccessories = accessoryInputs.map(accessory => new Accessory(accessory.id, accessory.name!, accessory.quantity ?? 0));

        updatedAccessories.forEach(accessory => accessory.save(modelContext.modeler.current!));
        modelContext.availableAccessories = new Map(updatedAccessories.map(a => [a.id, a]));
        setShow(false);
    }

    function onNameChange(newValue: string, accessory: AccessoryInput) {
        setAccessoryInputs(prevState => prevState.map(prevAccessory => prevAccessory.id === accessory.id ? {
            ...prevAccessory,
            name: newValue
        } : prevAccessory));
    }

    function onQuantityChange(newValue: number, accessory: AccessoryInput) {
        setAccessoryInputs(prevState => prevState.map(prevAccessory => prevAccessory.id === accessory.id ? {
            ...prevAccessory,
            quantity: newValue
        } : prevAccessory));
    }

    function addNewAccessory() {
        setAccessoryInputs(prevState => [...prevState, {
            id: generateId("Accessory"),
            name: undefined,
            quantity: undefined,
        }])
    }

    function handleTryDelete(accessory: AccessoryInput) {
        if (modelContext.availableAccessories.has(accessory.id)) {
            setOpenDeleteAccessory(true)
        } else {
            setAccessoryInputs(prevState => prevState.filter(accessoryInput => accessoryInput.id !== accessory.id));
        }
    }

    function handleDeleteAccessory(accessory: AccessoryInput) {
        if (modelContext.availableAccessories.has(accessory.id)) {
            // Accessory already exists.
            // Delete from model
            const accessoryToDelete = modelContext.availableAccessories.get(accessory.id)!;
            accessoryToDelete.delete(modelContext.modeler.current!);

            // Delete from every compatibility instance
            modelContext.compatibilities.forEach(compatibility => {
                const accessoryIndex = compatibility.accessories.findIndex(a => a.id === accessory.id);
                if (accessoryIndex > -1) {
                    compatibility.accessories.splice(accessoryIndex, 1);
                }
            });

            // Delete from the context
            modelContext.availableAccessories.delete(accessory.id);
        }
        setAccessoryInputs(prevState => prevState.filter(accessoryInput => accessoryInput.id !== accessory.id));
    }

    return (
        <Modal open={show} onClose={close}>
            <Modal.Header>
                <Modal.Title>Accessories in process</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                {accessoryInputs.map(accessoryInput => (
                    <HStack key={accessoryInput.id}>
                        <InputGroup>
                            <Input value={accessoryInput.name ?? ""} placeholder="Accessory name"
                                   onChange={value => onNameChange(value, accessoryInput)}/>
                            <InputNumber value={accessoryInput.quantity ?? ""} placeholder="Available quantity"
                                         min={1}
                                         onChange={value => onQuantityChange(value as number, accessoryInput)}/>
                        </InputGroup>
                        <IconButton icon={<TrashIcon/>} color="red" appearance="primary"
                                    onClick={() => handleTryDelete(accessoryInput)}/>
                        <Modal open={openDeleteAccessory} backdrop="static" role="alertdialog" size="xs">
                            <Modal.Body>
                                <TrashIcon color="red" style={{fontSize: 24}}/>
                                This accessory ({accessoryInput.name}) will be deleted from everywhere!
                            </Modal.Body>
                            <Modal.Footer>
                                <Button onClick={() => handleDeleteAccessory(accessoryInput)} appearance="primary">Delete</Button>
                                <Button onClick={() => setOpenDeleteAccessory(false)} appearance="subtle">Keep it</Button>
                            </Modal.Footer>
                        </Modal>
                    </HStack>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewAccessory}/>
            </Stack>
        </Modal>
    );
}