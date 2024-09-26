import {Button, Divider, Input, InputGroup, InputNumber, InputPicker, Modal, Stack} from "rsuite";
import ProductExecutor, {AcceptedTimeUnit} from "../../Models/ProductExecutor.ts";
import Product from "../../Models/Product.ts";
import {useEffect, useState} from "react";
import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import ProductPicker from "../ProductPicker.tsx";


interface CompatibilityModalProps {
    showModal: boolean;
    setShowModal: (showModal: boolean) => void;
    executor?: ExecutorElement;
    productExecutor?: ProductExecutor,
    activity: ActivityElement
}
export default function CompatibilityModal({showModal, setShowModal, executor, productExecutor, activity}: CompatibilityModalProps) {
    const [product, setProduct] = useState<Product | undefined>(productExecutor !== undefined ? new Product(productExecutor?.id!, productExecutor?.name!) : undefined);
    const [time, setTime] = useState<number | undefined | null>(productExecutor?.time);
    const [timeUnit, setTimeUnit] = useState< AcceptedTimeUnit | undefined | null>(productExecutor?.timeUnit);

    const modelContext = useModelerRef();

    useEffect(() => {
        if (productExecutor) {
            setProduct(modelContext.finalProducts.get(productExecutor.id));
            setTime(productExecutor?.time);
            setTimeUnit(productExecutor?.timeUnit);
        } else {
            setProduct(undefined);
            setTime(undefined);
            setTimeUnit(undefined);
        }
    }, [productExecutor]);

    function closeModal(withSave: boolean): void {
        if (withSave) {
            // Pre-condition: product, time, and timeUnit are ready to be saved thanks to canSave()
            const oldProductExecutorIndex = executor?.associatedProducts.findIndex(pe => pe.id === productExecutor?.id)!;
            const newProductExecutor = new ProductExecutor(product?.id!, product?.name!, time!, timeUnit!, activity.id, executor?.id!);
            if (oldProductExecutorIndex >= 0) {
                // Update
                // @ts-ignore
                executor.associatedProducts[oldProductExecutorIndex] = newProductExecutor;
            } else {
                // Create
                executor?.associatedProducts.push(newProductExecutor);
            }

            executor?.save(modelContext.modeler.current!);
        }

        setShowModal(false);
    }

    function canSave(): boolean {
        if (!product || !time || !timeUnit) {
            return false;
        }

        return true
    }



    return (
        <Modal backdrop="static" keyboard={false} open={showModal} onClose={() => closeModal(false)}>
            <Modal.Header>
                <Modal.Title>{productExecutor ? "Editing compatibility" : "New compatibility"} for {executor?.name}</Modal.Title>
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
                    <InputPicker data={ProductExecutor.acceptedTimeUnitsToItemDataType} value={timeUnit} onChange={value => setTimeUnit(value as AcceptedTimeUnit)}/>
                </InputGroup>
            </Stack>

            <Modal.Footer>
                <Button onClick={() => closeModal(true) } disabled={!canSave()} appearance="primary">Save</Button>
                <Button onClick={() => closeModal(false)} appearance="subtle">Cancel</Button>
            </Modal.Footer>
        </Modal>
    )
}