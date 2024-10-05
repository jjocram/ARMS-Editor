import {IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import {useModelerRef} from "../ModelerContext.ts";
import {useEffect, useState} from "react";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import {generateId} from "../Utils.ts";
import {Accessory} from "../Models/Accessory.ts";

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
        const updatedAccessories = accessoryInputs.map(accessory => new Accessory(accessory.id, accessory.name!, accessory.quantity!));

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

    return (
        <Modal open={show} onClose={close}>
            <Modal.Header>
                <Modal.Title>Accessories in process</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                {accessoryInputs.map(accessoryInput => (
                    <InputGroup key={accessoryInput.id}>
                        <Input value={accessoryInput.name ?? ""} placeholder="Accessory name" onChange={value => onNameChange(value, accessoryInput)} />
                        <InputNumber value={accessoryInput.quantity ?? ""} placeholder="Available quantity" min={1} onChange={value => onQuantityChange(value as number, accessoryInput)} />
                    </InputGroup>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewAccessory}/>
            </Stack>
        </Modal>
    );
}