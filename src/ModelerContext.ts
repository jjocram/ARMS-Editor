import {createContext, MutableRefObject, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import Product from "./Models/Product.ts";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation} from "./Models/Transformation.ts";
import Compatibility from "./Models/Compatibility.ts";
import Inventory from "./Models/Inventory.ts";


export class ModelerContext {
    modeler!: MutableRefObject<Modeler | null>
    products!: Map<string, Product>
    inventories!: Map<string, Inventory>
    availableAccessories!: Map<string, Accessory>
    transformations!: Map<string, Transformation>
    compatibilities!: Array<Compatibility>

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

