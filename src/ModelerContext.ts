import {createContext, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import Product from "./Models/Product.ts";



export class ModelerContext {
    modeler!: React.MutableRefObject<Modeler | null>
    products!: Array<Product>
}

export const ModelerRefContext = createContext<ModelerContext>(new ModelerContext())

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

