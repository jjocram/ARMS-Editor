import {createContext, MutableRefObject, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import {Accessory} from "./Models/Accessory.ts";
import {Transformation} from "./Models/Transformation.ts";
import Compatibility from "./Models/Compatibility.ts";
import Inventory from "./Models/Inventory.ts";
import ProductRequest from "./Models/ProductRequest.ts";


export class ModelerContext {
    modeler!: MutableRefObject<Modeler | null>
    inventories!: Map<string, Inventory>
    availableAccessories!: Map<string, Accessory>
    transformations!: Map<string, Transformation>
    compatibilities!: Array<Compatibility>
    productRequests!: Map<string, ProductRequest>
}

export const ModelerRefContext = createContext<ModelerContext>(new ModelerContext())

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

