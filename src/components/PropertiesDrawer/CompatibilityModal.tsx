import {Button, Divider, Heading, IconButton, Input, InputGroup, InputNumber, InputPicker, Modal, Stack} from "rsuite";
import Product from "../../Models/Product.ts";
import {useEffect, useState} from "react";
import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import ProductPicker from "../ProductPicker.tsx";
import Compatibility, {AcceptedTimeUnit, AccessoryCompatibility} from "../../Models/Compatibility.ts";
import {generateId} from "../../Utils.ts";
import {Accessory} from "../../Models/Accessory.ts";
import AccessoryPicker from "../AccessoryPicker.tsx";
import AddOutlineIcon from "@rsuite/icons/AddOutline";


interface CompatibilityModalProps {
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    executor?: ExecutorElement;
    compatibility?: Compatibility,
    activity: ActivityElement
}

interface AccessoryInput {
    id: string;
    accessory?: Accessory;
    quantity?: number;
}

export default function CompatibilityModal({showModal, setShowModal, executor, compatibility, activity}: CompatibilityModalProps) {
    const [product, setProduct] = useState<Product | undefined>(undefined);
    const [time, setTime] = useState<number | undefined | null>(undefined);
    const [timeUnit, setTimeUnit] = useState< AcceptedTimeUnit | undefined | null>(undefined);
    const [batch, setBatch] = useState<number | undefined | null>(undefined);
    const [accessories, setAccessories] = useState<Array<AccessoryInput>>([]);

    const modelContext = useModelerRef();

    useEffect(() => {
        if (compatibility) {
            setProduct(compatibility?.product);
            setTime(compatibility?.time);
            setTimeUnit(compatibility?.timeUnit);
            setBatch(compatibility?.batchQuantity);
            setAccessories(compatibility?.accessories.map(accessory => {
                const accessoryInput: AccessoryInput =  {
                    id: accessory.id,
                    accessory: modelContext.availableAccessories.get(accessory.id),
                    quantity: accessory.quantity
                }
                return accessoryInput;
            }));
        } else {
            setProduct(undefined);
            setTime(undefined);
            setTimeUnit(undefined);
        }
    }, [compatibility]);

    function closeModal(withSave: boolean): void {
        if (withSave) {
            // Pre-condition: product, time, timeUnit, batch, and accessories are ready to be saved thanks to canSave()
            if (compatibility) {
                compatibility.time = time!;
                compatibility.timeUnit = timeUnit!;
                compatibility.batchQuantity = batch!;
                compatibility.product = product!;
                compatibility.accessories = accessories.map(accessoryInput => new AccessoryCompatibility(accessoryInput.id, accessoryInput.quantity!));
                compatibility.save(modelContext.modeler.current!);
            } else {
                const newCompatibility = new Compatibility(
                    generateId("Compatibility"),
                    time!,
                    timeUnit!,
                    batch!,
                    activity.id,
                    executor!.id,
                    product!,
                    accessories.map(accessoryInput => new AccessoryCompatibility(accessoryInput.id, accessoryInput.quantity!))
                );
                newCompatibility.save(modelContext.modeler.current!);
                executor?.associatedCompatibilities.push(newCompatibility);
                modelContext.compatibilities.push(newCompatibility);
            }
        }

        setShowModal(false);
    }

    function canSave(): boolean {
        if (!product || !time || !timeUnit || !batch || !executor) {
            return false;
        }

        return true
    }

    function setSpecificAccessory(accessoryInput: AccessoryInput) {
        return (accessory: Accessory) => {
            setAccessories(prevState => prevState.map(prevIO => prevIO.id === accessoryInput.id ? {
                ...prevIO,
                id: accessory.id,
                accessory: accessory
            } : prevIO));
        }
    }

    function addNewAccessory() {
        const newInput: AccessoryInput = {
            id: generateId("CompatibilityAccessory"),
            accessory: undefined,
            quantity: undefined
        };
        setAccessories(prevState => [...prevState, newInput]);
    }

    function setAccessoryQuantity(accessoryInput: AccessoryInput, newQuantity: number) {
        setAccessories(prevState => prevState.map(prevIO => prevIO.id === accessoryInput.id ? {...prevIO, quantity: newQuantity} : prevIO));
    }

    return (
        <Modal backdrop="static" keyboard={false} open={showModal} onClose={() => closeModal(false)}>
            <Modal.Header>
                <Modal.Title>{compatibility ? "Editing compatibility" : "New compatibility"} for {executor?.name}</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                <InputGroup>
                    <InputGroup.Addon>Activity</InputGroup.Addon>
                    <Input value={activity.name} readOnly/>
                </InputGroup>
                <InputGroup>
                    <InputGroup.Addon>Executor</InputGroup.Addon>
                    <Input value={executor?.name} readOnly/>
                </InputGroup>

                <Divider />

                <InputGroup>
                    <InputGroup.Addon>Product</InputGroup.Addon>
                    <ProductPicker product={product!} setProduct={setProduct} whichTypes="final"/>
                </InputGroup>

                <InputGroup>
                    <InputGroup.Addon>Time</InputGroup.Addon>
                    <InputNumber value={time} min={0} onChange={value => setTime(value as number)}/>
                    <InputPicker data={Compatibility.acceptedTimeUnitsToItemDataType} value={timeUnit} onChange={value => setTimeUnit(value as AcceptedTimeUnit)}/>
                </InputGroup>

                <InputGroup>
                    <InputGroup.Addon>Batch size</InputGroup.Addon>
                    <InputNumber value={batch} min={1} onChange={value => setBatch(value as number)}/>
                </InputGroup>

                <Divider />

                <Heading>Accessories</Heading>

                {accessories.map(accessoryInput => (
                    <InputGroup key={accessoryInput.id}>
                        <AccessoryPicker accessory={accessoryInput.accessory!} setAccessory={setSpecificAccessory(accessoryInput)}/>
                        <InputNumber placeholder="Quantity" value={accessoryInput.quantity} min={1} onChange={value => setAccessoryQuantity(accessoryInput, value as number)} />
                    </InputGroup>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewAccessory}/>
            </Stack>

            <Modal.Footer>
                <Button onClick={() => closeModal(true) } disabled={!canSave()} appearance="primary">Save</Button>
                <Button onClick={() => closeModal(false)} appearance="subtle">Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}