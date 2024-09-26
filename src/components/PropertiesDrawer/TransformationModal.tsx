import {Button, Divider, Heading, IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import ProductPicker from "../ProductPicker.tsx";
import React, {useEffect, useState} from "react";
import Product from "../../Models/Product.ts";
import {generateId} from "../../Utils.ts";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import {Transformation, TransformationIO} from "../../Models/Transformation.ts";
import {useModelerRef} from "../../ModelerContext.ts";

interface TransformationModalProps {
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    activity: ActivityElement
    transformation?: Transformation
}

interface InputOutput {
    id: string;
    product?: Product;
    quantity?: number;
}

export default function TransformationModal({
                                                showModal,
                                                setShowModal,
                                                activity,
                                                transformation
                                            }: TransformationModalProps) {
    const modelerContext = useModelerRef();

    const [product, setProduct] = useState<Product | undefined>(undefined);

    const [inputs, setInputs] = useState<InputOutput[]>([]);
    const [outputs, setOutputs] = useState<InputOutput[]>([]);

    useEffect(() => {
        if (transformation) {
            setProduct(transformation.product);
            setInputs(transformation.inputs.map(io => {
                const input: InputOutput = {
                    id: io.id,
                    product: modelerContext.allProducts.get(io.id),
                    quantity: io.quantity
                }
                return input;
            }))
            setOutputs(transformation.outputs.map(io => {
                const output: InputOutput = {
                    id: io.id,
                    product: modelerContext.allProducts.get(io.id),
                    quantity: io.quantity
                }
                return output;
            }))
        } else {
            setProduct(undefined);
            setInputs([]);
            setOutputs([]);
        }
    }, [transformation]);

    function closeModal(withSave: boolean) {
        if (withSave) {
            // Pre-condition: product and all inputs and outputs are ready to be saved thanks to canSave()
            if (transformation) {
                // Editing transformation
                transformation.product = product!;
                transformation.inputs = inputs.map(input => new TransformationIO(input.id, input.product?.name!, input.quantity!));
                transformation.outputs = outputs.map(output => new TransformationIO(output.id, output.product?.name!, output.quantity!));
                transformation.save(modelerContext.modeler.current!);

                modelerContext.transformations.set(transformation.id, transformation);
            } else {
                // Creating new transformation
                const newTransformation = new Transformation(generateId("Transformation"), activity.id, product!);
                newTransformation.inputs = inputs.map(input => new TransformationIO(input.id, input.product?.name!, input.quantity!));
                newTransformation.outputs = outputs.map(output => new TransformationIO(output.id, output.product?.name!, output.quantity!));
                newTransformation.save(modelerContext.modeler.current!);

                modelerContext.transformations.set(newTransformation.id, newTransformation);
            }
        }

        setShowModal(false);
    }

    function canSave() {
        const allIOGood = [...inputs, ...outputs]
            .map(input => (input.product != undefined && input.quantity != undefined))
            .reduce((a, b) => a && b, true);
        if (!product || !allIOGood) {
            return false;
        }

        return true;
    }

    function setIOQuantity(io: InputOutput, newQuantity: number, set: React.Dispatch<React.SetStateAction<InputOutput[]>>) {
        set(prevState => prevState.map(prevIO => prevIO.id === io.id ? {...prevIO, quantity: newQuantity} : prevIO));
    }

    function setIOProduct(io: InputOutput, set: React.Dispatch<React.SetStateAction<InputOutput[]>>) {
        return (newProduct: Product) => {
            set(prevState => prevState.map(prevIO => prevIO.id === io.id ? {
                ...prevIO,
                product: newProduct,
                id: newProduct.id
            } : prevIO));
        };
    }

    function addNewInput() {
        const newInput: InputOutput = {
            id: generateId("TransformationInput"),
            product: undefined,
            quantity: undefined
        }
        setInputs(prevInputs => [...prevInputs, newInput]);
    }

    function addNewOutput() {
        const newOutput: InputOutput = {
            id: generateId("TransformationOutput"),
            product: undefined,
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

                <InputGroup>
                    <InputGroup.Addon>Product</InputGroup.Addon>
                    <ProductPicker product={product!} setProduct={setProduct} whichTypes="final"/>
                </InputGroup>

                <Heading>Inputs</Heading>
                {inputs.map(input => {
                    return (
                        <InputGroup key={input.id}>
                            <ProductPicker product={input.product!} setProduct={setIOProduct(input, setInputs)}
                                           whichTypes="all"/>
                            <InputNumber placeholder="Quantity" value={input.quantity} min={1}
                                         onChange={value => setIOQuantity(input, value as number, setInputs)}/>
                        </InputGroup>
                    );
                })}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewInput}/>

                <Heading>Outputs</Heading>
                {outputs.map(output => {
                    return (
                        <InputGroup key={output.id}>
                            <ProductPicker product={output.product!} setProduct={setIOProduct(output, setOutputs)}
                                           whichTypes="all"/>
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