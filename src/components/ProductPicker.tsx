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
                return [...modelContext.products.values()];
            case "final":
                return modelContext.finalProducts;
            case "transformation":
                return modelContext.transformationProducts;
        }
    }

    function handleNewProductCreation(value: string) {
        const newProduct = new Product(generateId("Product"), value as string);
        if (whichTypes === "final") {
            newProduct.finalQuantity = 1;
        }
        newProduct.createInModel(modelContext.modeler.current!);
        modelContext.products.set(newProduct.id, newProduct);
        setProduct(newProduct);
    }

    function handleProductChange(value: string) {
        const newProduct = modelContext.products.get(value)
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
                     onSelect={handleProductChange}
        />
    )
}