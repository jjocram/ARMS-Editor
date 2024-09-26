import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import {Accessory, ExecutorAccessory} from "../../Models/Accessory.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import {useEffect, useState} from "react";
import {Button, Divider, Input, InputGroup, InputNumber, InputPicker, Modal, Stack} from "rsuite";
import {generateId} from "../../Utils.ts";

interface AccessoryModalProps {
    showModal: boolean;
    setShowModal: (show: boolean) => void;
    executor?: ExecutorElement;
    executorAccessory?: ExecutorAccessory
}

export default function AccessoryModal({showModal, setShowModal, executor, executorAccessory}: AccessoryModalProps) {
    const modelContext = useModelerRef();

    const [accessory, setAccessory] = useState<Accessory | undefined>()
    const [requiredQuantity, setRequiredQuantity] = useState<number | undefined | null>(undefined)

    useEffect(() => {
        if (executorAccessory) {
            setAccessory(modelContext.availableAccessories.get(executorAccessory.id));
            setRequiredQuantity(executorAccessory.quantity);
        }
    }, [executorAccessory]);

    function closeModal(withSave: boolean) {
        if (withSave) {
            // Pre-condition: accessory and quantity are ready to be saved thanks to canSave()
            const oldAccessoryExecutorIndex = executor?.neededAccessories.findIndex(ae => ae.id === executorAccessory?.id)!;
            const newExecutorAccessory = new ExecutorAccessory(accessory?.id!, accessory?.name!, requiredQuantity!, executor?.id!);
            if (oldAccessoryExecutorIndex >= 0) {
                // Update
                // @ts-ignore
                executor.neededAccessories[oldAccessoryExecutorIndex] = newExecutorAccessory;
            } else {
                executor?.neededAccessories.push(newExecutorAccessory);
            }

            executor?.save(modelContext.modeler.current!);
        }

        setShowModal(false);
    }

    function canSave() {
        if (!accessory || !requiredQuantity) {
            return false
        }

        return true;
    }

    function handleAccessoryCreation(value: String) {
        const newAccessory = new Accessory(generateId("Accessory"), value as string, 1); // TODO: input quantity
        newAccessory.createInModel(modelContext.modeler.current!);
        modelContext.availableAccessories.set(newAccessory.id, newAccessory);
        setAccessory(newAccessory);
    }

    function handleAccessoryChange(value: string) {
        const newAccessory = modelContext.availableAccessories.get(value);
        if (newAccessory) {
            setAccessory(newAccessory);
        }
    }

    return (
        <Modal backdrop="static" keyboard={false} open={showModal} onClose={() => closeModal(false)}>
            <Modal.Header>{executorAccessory ? "Editing accessory" : "New accessory"} for {executor?.name}</Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                <InputGroup>
                    <InputGroup.Addon>Executor</InputGroup.Addon>
                    <Input value={executor?.name} readOnly/>
                </InputGroup>

                <Divider />

                <InputGroup>
                    <InputGroup.Addon>Product</InputGroup.Addon>
                    <InputPicker style={{width: "100%"}} creatable data={[...modelContext.availableAccessories.values()].map(a => a.toItemDataType())} onCreate={handleAccessoryCreation} value={accessory?.id} onChange={handleAccessoryChange}/>
                </InputGroup>

                <InputGroup>
                    <InputGroup.Addon>Required quantity</InputGroup.Addon>
                    <InputNumber value={requiredQuantity} min={1} onChange={value => setRequiredQuantity(value as number)}/>
                </InputGroup>
            </Stack>

            <Modal.Footer>
                <Button onClick={() => closeModal(true)} disabled={!canSave()} appearance="primary">Save</Button>
                <Button onClick={() => closeModal(false)} appearance="subtle">Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}