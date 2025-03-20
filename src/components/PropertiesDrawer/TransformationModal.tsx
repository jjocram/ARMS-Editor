import {Button, Divider, Heading, IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import React, {useEffect, useState} from "react";
import {generateId} from "../../Utils.ts";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import {Transformation, TransformationIO} from "../../Models/Transformation.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import Inventory from "../../Models/Inventory.ts";
import InventoryPicker from "../Picker/InventoryPicker.tsx";
import ProductPropertiesModifier from "../ProductPropertiesModifier.tsx";

interface TransformationModalProps {
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    activity: ActivityElement
    transformation?: Transformation
}

interface InputOutput {
    id: string;
    inventory?: Inventory;
    quantity?: number;
}

export default function TransformationModal({
                                                showModal,
                                                setShowModal,
                                                activity,
                                                transformation
                                            }: TransformationModalProps) {
    const modelerContext = useModelerRef();

    const [productProperties, setProductProperties] = useState<Array<[string, string]>>([]);
    const [transformationToApply, setTransformationToApply] = useState<Array<[string, string]>>([]);

    const [inputs, setInputs] = useState<InputOutput[]>([]);
    const [outputs, setOutputs] = useState<InputOutput[]>([]);

    useEffect(() => {
        if (transformation) {
            setProductProperties([...transformation.productProperties.entries()]);
            setTransformationToApply([...transformation.transformationToApply.entries()]);
            setInputs(transformation.inputs.map(io => {
                const input: InputOutput = {
                    id: io.id,
                    inventory: modelerContext.inventories.get(io.inventoryId),
                    quantity: io.quantity
                }
                return input;
            }))
            setOutputs(transformation.outputs.map(io => {
                const output: InputOutput = {
                    id: io.id,
                    inventory: modelerContext.inventories.get(io.inventoryId),
                    quantity: io.quantity
                }
                return output;
            }))
        } else {
            setProductProperties([]);
            setTransformationToApply([]);
            setInputs([]);
            setOutputs([]);
        }
    }, [transformation]);

    function closeModal(withSave: boolean) {
        if (withSave) {
            // Pre-condition: productProperties, transformationToApply and all inputs and outputs are ready to be saved thanks to canSave()
            const productPropertiesToSave = new Map<string, string>(productProperties);
            const transformationToApplyToSave = new Map<string, string>(transformationToApply);

            const transformationToSave = transformation ?? new Transformation(generateId("Transformation"), activity.id, productPropertiesToSave, transformationToApplyToSave);
            transformationToSave.productProperties = productPropertiesToSave;
            transformationToSave.transformationToApply = transformationToApplyToSave;
            transformationToSave.inputs = inputs.map(input => new TransformationIO(input.id, input.inventory!.id, input.quantity!));
            transformationToSave.outputs = outputs.map(output => new TransformationIO(output.id, output.inventory!.id, output.quantity!));
            transformationToSave.save(modelerContext.modeler.current!);

            modelerContext.transformations.set(transformationToSave.id, transformationToSave);
        }

        setShowModal(false);
    }

    function canSave() {
        const allInputsGood = inputs
            .map(input => (input.inventory != undefined && input.quantity != undefined))
            .reduce((a, b) => a && b, true);

        const allOutputsGood = outputs
            .map(output => (output.inventory != undefined && output.quantity != undefined))
            .reduce((a, b) => a && b, true);

        const allProductPropertiesGood = productProperties
            .map(([key, value]) => key.length > 0 && value.length > 0)
            .reduce((a, b) => a && b, true);

        const allTransformationToApplyGood = transformationToApply
            .map(([key, value]) => key.length > 0 && value.length > 0)
            .reduce((a, b) => a && b, true);

        return (allInputsGood && allOutputsGood && allProductPropertiesGood && allTransformationToApplyGood);
    }

    function setIOQuantity(io: InputOutput, newQuantity: number, set: React.Dispatch<React.SetStateAction<InputOutput[]>>) {
        set(prevState => prevState.map(prevIO => prevIO.id === io.id ? {...prevIO, quantity: newQuantity} : prevIO));
    }

    function setIOInventory(io: InputOutput, set: React.Dispatch<React.SetStateAction<InputOutput[]>>) {
        return (newInventory: Inventory) => {
            set(prevState => prevState.map(prevIO => prevIO.id === io.id ? {
                ...prevIO,
                inventory: newInventory,
                id: newInventory.id
            } : prevIO));
        };
    }

    function addNewInput() {
        const newInput: InputOutput = {
            id: generateId("TransformationInput"),
            inventory: undefined,
            quantity: undefined
        }
        setInputs(prevInputs => [...prevInputs, newInput]);
    }

    function addNewOutput() {
        const newOutput: InputOutput = {
            id: generateId("TransformationOutput"),
            inventory: undefined,
            quantity: undefined,
        }
        setOutputs(prevOutputs => [...prevOutputs, newOutput]);
    }

    return (
        <Modal backdrop="static" keyboard={false} open={showModal} onClose={() => closeModal(false)}>
            <Modal.Header>
                <Modal.Title>New transformation for {activity.name}</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                <InputGroup>
                    <InputGroup.Addon>Activity</InputGroup.Addon>
                    <Input value={activity.name} readOnly/>
                </InputGroup>

                <Divider/>

                <Heading>Product properties</Heading>
                <ProductPropertiesModifier productProperties={productProperties} setProductProperties={setProductProperties}/>

                <Heading>Product transformation</Heading>
                <ProductPropertiesModifier productProperties={transformationToApply} setProductProperties={setTransformationToApply}/>

                <Divider/>

                <Heading>Input inventories</Heading>
                {inputs.map(input => {
                    return (
                        <InputGroup key={input.id}>
                            <InventoryPicker inventory={input.inventory!} setInventory={setIOInventory(input, setInputs)}/>
                            <InputNumber placeholder="Quantity" value={input.quantity} min={1}
                                         onChange={value => setIOQuantity(input, value as number, setInputs)}/>
                        </InputGroup>
                    );
                })}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewInput}/>

                <Heading>Output inventories</Heading>
                {outputs.map(output => {
                    return (
                        <InputGroup key={output.id}>
                            <InventoryPicker inventory={output.inventory!} setInventory={setIOInventory(output, setOutputs)}/>
                            <InputNumber placeholder="Quantity" value={output.quantity} min={1}
                                         onChange={value => setIOQuantity(output, value as number, setOutputs)}/>
                        </InputGroup>
                    );
                })}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewOutput}/>
            </Stack>

            <Modal.Footer>
                <Button onClick={() => closeModal(true)} disabled={!canSave()} appearance="primary">Save</Button>
                <Button onClick={() => closeModal(false)} appearance="subtle">Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}