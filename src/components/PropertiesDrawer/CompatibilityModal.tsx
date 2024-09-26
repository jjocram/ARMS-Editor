import {Button, Divider, Input, InputGroup, InputNumber, InputPicker, Modal, Stack} from "rsuite";
import ProductExecutor, {AcceptedTimeUnit} from "../../Models/ProductExecutor.ts";
import Product from "../../Models/Product.ts";
import {useEffect, useState} from "react";
import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import {generateId} from "../../Utils.ts";


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
            setProduct(new Product(productExecutor?.id!, productExecutor?.name!));
            setTime(productExecutor?.time);
            setTimeUnit(productExecutor?.timeUnit);
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
        if (!product || !time) {
            return false;
        }

        return true
    }

    function handleNewProductCreation(value: string) {
        const newProduct = new Product(generateId("Product"), value as string);
        newProduct.createInModel(modelContext.modeler.current!);
        modelContext.finalProducts.set(newProduct.id, newProduct);
        setProduct(newProduct);
    }

    function handleProductChange(value: string) {
        const newProduct = modelContext.finalProducts.get(value)
        if (newProduct) {
            setProduct(newProduct);
        }
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
                    <InputPicker style={{width: "100%"}} creatable data={[...modelContext.finalProducts.values()].map(p => p.toItemDataType())} onCreate={handleNewProductCreation} value={product?.id} onChange={handleProductChange}/>
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