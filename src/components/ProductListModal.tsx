import {IconButton, Input, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import {useModelerRef} from "../ModelerContext.ts";
import {useEffect, useState} from "react";
import {generateId} from "../Utils.ts";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import Product from "../Models/Product.ts";

interface ProductListModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

interface ProductInput {
    id: string;
    name?: string;
    finalQuantity?: number;
}

export default function ProductListModal({show, setShow}: ProductListModalProps) {
    const modelContext = useModelerRef();

    const [productInputs, setProductInputs] = useState<ProductInput[]>([]);

    useEffect(() => {
        if (show) {
            setProductInputs([...modelContext.products.values()].map(product => {
                return {
                    id: product.id,
                    name: product.name,
                    finalQuantity: product.finalQuantity,
                }
            }))
        }
    }, [show]);

    function close() {
        const updatedProducts = productInputs.map(product => {
            const updatedProduct = new Product(product.id, product.name!);
            if (product.finalQuantity && product.finalQuantity > 0) {
                updatedProduct.finalQuantity = product.finalQuantity;
            }
            return updatedProduct;
        })

        updatedProducts.forEach(p => p.save(modelContext.modeler.current!));
        modelContext.products = new Map(updatedProducts.map(p => [p.id, p]))

        setShow(false);
    }

    function onNameChange(value: string, product: ProductInput) {
        setProductInputs(prevState => prevState.map(prevProduct => prevProduct.id === product.id ? {
            ...prevProduct,
            name: value
        } : prevProduct));
    }

    function onQuantityChange(value: number, product: ProductInput) {
        setProductInputs(prevState => prevState.map(prevProduct => prevProduct.id === product.id ? {
            ...prevProduct,
            finalQuantity: value
        } : prevProduct));
    }

    function addNewProduct() {
        setProductInputs((prevState) => [...prevState, {
            id: generateId("Product"),
            name: undefined,
            finalQuantity: undefined,
        }]);
    }

    return (
        <Modal open={show} onClose={close}>
            <Modal.Header>
                <Modal.Title>Products in process</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                {productInputs.map((productInput) => (
                    <InputGroup key={productInput.id}>
                        <Input value={productInput.name ?? ""} placeholder="Product name" onChange={(value) => onNameChange(value, productInput)} />
                        <InputNumber value={productInput.finalQuantity ?? ""} placeholder="Quantity" min={1} onChange={(value) => onQuantityChange(value as number, productInput)} />
                    </InputGroup>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addNewProduct}/>
            </Stack>
        </Modal>
    );
}