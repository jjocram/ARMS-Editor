import {useModelerRef} from "../ModelerContext.ts";
import {InputPicker} from "rsuite";
import Product from "../Models/Product.ts";
import {generateId} from "../Utils.ts";

interface ProductPickerProps {
    product: Product;
    setProduct: (product: Product) => void;
    whichTypes: "all"|"final"|"transformation"
}

export default function ProductPicker({product, setProduct, whichTypes}: ProductPickerProps) {
    const modelContext = useModelerRef()

    function getProducts(): Array<Product> {
        switch (whichTypes) {
            case "all":
                return [...modelContext.allProducts.values()]
            case "final":
                return [...modelContext.finalProducts.values()]
            case "transformation":
                return [...modelContext.transformationProducts.values()]
        }
    }

    function handleNewProductCreation(value: string) {
        const newProduct = new Product(generateId("Product"), value as string); // TODO: generate product with right ID (TransformationIO) and not save it in extensionsElements if is transformations
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
        <InputPicker style={{width: "100%"}}
                     creatable
                     data={getProducts().map(p => p.toItemDataType())}
                     onCreate={handleNewProductCreation}
                     value={product?.id}
                     onChange={handleProductChange}
        />
    )
}