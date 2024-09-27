import {createContext, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import Product from "./Models/Product.ts";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation} from "./Models/Transformation.ts";


export class ModelerContext {
    modeler!: React.MutableRefObject<Modeler | null>
    products!: Map<string, Product>
    availableAccessories!: Map<string, Accessory>
    transformations!: Map<string, Transformation>

    get finalProducts(){
        return [...this.products.values()].filter(product => product.finalQuantity !== undefined);
    }

    get transformationProducts() {
        return [...this.products.values()].filter(product => product.finalQuantity === undefined);
    }
}

export const ModelerRefContext = createContext<ModelerContext>(new ModelerContext())

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

