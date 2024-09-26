import {createContext, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import Product from "./Models/Product.ts";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation} from "./Models/Transformation.ts";


export class ModelerContext {
    modeler!: React.MutableRefObject<Modeler | null>
    finalProducts!: Map<string, Product>
    availableAccessories!: Map<string, Accessory>
    transformationProducts!: Map<string, Product>
    transformations!: Map<string, Transformation>

    get allProducts(): Map<string, Product> {
        return new Map<string, Product>([...Array.from(this.finalProducts.entries()), ...Array.from(this.transformationProducts.entries())]);
    }
}

export const ModelerRefContext = createContext<ModelerContext>(new ModelerContext())

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

