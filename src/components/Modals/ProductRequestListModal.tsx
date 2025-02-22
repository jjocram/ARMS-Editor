import {useModelerRef} from "../../ModelerContext.ts";
import {useEffect, useState} from "react";
import ProductRequest from "../../Models/ProductRequest.ts";
import {Divider, Heading, HStack, IconButton, InputGroup, InputNumber, Modal, Stack} from "rsuite";
import ProductPropertiesModifier from "../ProductPropertiesModifier.tsx";
import TrashIcon from "@rsuite/icons/Trash";
import {generateId} from "../../Utils.ts";
import AddOutlineIcon from "@rsuite/icons/AddOutline";

interface ProductRequestListModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

interface ProductRequestInput {
    id: string;
    productProperties: Array<[string, string]>;
    quantity?: number;
}

export default function ProductRequestListModal({show, setShow}: ProductRequestListModalProps) {
    const modelContext = useModelerRef();

    const [productRequests, setProductRequests] = useState<Array<ProductRequestInput>>([]);

    useEffect(() => {
        if (show) {
            setProductRequests([...modelContext.productRequests.values()].map(productRequest => {
                return {
                    id: productRequest.id,
                    productProperties: [...productRequest.productProperties.entries()],
                    quantity: productRequest.quantity
                }
            }));
        }
    }, [show]);

    function close() {
        const updatedProductRequests = productRequests.map(productRequest => new ProductRequest(productRequest.id, new Map(productRequest.productProperties), productRequest.quantity ?? 0));

        updatedProductRequests.forEach(productRequest => productRequest.save(modelContext.modeler.current!));
        modelContext.productRequests = new Map<string, ProductRequest>(updatedProductRequests.map(pr => [pr.id, pr]));

        setShow(false);
    }

    function handleQuantityChange(newQuantity: number, productRequest: ProductRequestInput) {
        setProductRequests(prevState => prevState.map(prevProductRequest => prevProductRequest.id === productRequest.id ? {
            ...prevProductRequest,
            quantity: newQuantity
        } : prevProductRequest))
    }

    function getHandlerSetProductProperties(productRequest: ProductRequestInput) {
        return function (value: [string, string][] | ((_prevState: [string, string][]) => [string, string][])) {
            if (typeof value === "function") {
                setProductRequests(prevState => prevState.map(prevProductRequest => prevProductRequest.id === productRequest.id ? {
                    ...prevProductRequest,
                    productProperties: value(productRequest.productProperties) // This will work
                } : prevProductRequest));
            }
        }
    }

    function removeProductRequest(productRequest: ProductRequestInput) {
        setProductRequests(prevState => prevState.filter(prevProductRequest => prevProductRequest.id !== productRequest.id));
    }

    function addProductRequest() {
        setProductRequests(prevState => [...prevState, {
            id: generateId("ProductRequest"),
            productProperties: [],
            quantity: undefined,
        }]);
    }

    return (
        <Modal open={show} onClose={close}>
            <Modal.Header>
                <Modal.Title>Product requests</Modal.Title>
            </Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}} divider={<Divider/>}>
                {productRequests.map((productRequest, index) => (
                    <Stack key={productRequest.id} spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                        <HStack>
                            <Heading level={3}>Product request {index + 1}</Heading>
                            <IconButton icon={<TrashIcon/>} appearance="subtle" color="red" onClick={() => removeProductRequest(productRequest)}/>
                        </HStack>
                        <InputGroup>
                            <InputGroup.Addon>Quantity</InputGroup.Addon>
                            <InputNumber value={productRequest.quantity} onChange={newValue => handleQuantityChange(newValue as number, productRequest)}/>
                        </InputGroup>
                        <Heading level={4}>Product properties</Heading>
                        <ProductPropertiesModifier productProperties={productRequest.productProperties} setProductProperties={getHandlerSetProductProperties(productRequest)}/>
                    </Stack>
                ))}
                <IconButton icon={<AddOutlineIcon/>} onClick={addProductRequest}/>
            </Stack>
        </Modal>
    );
}