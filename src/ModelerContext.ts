import {createContext, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import Product from "./Models/Product.ts";
import {Accessory} from "./Models/Accessory.ts";


export class ModelerContext {
    modeler!: React.MutableRefObject<Modeler | null>
    finalProducts!: Map<string, Product>
    availableAccessories!: Map<string, Accessory>
}

export const ModelerRefContext = createContext<ModelerContext>(new ModelerContext())

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

