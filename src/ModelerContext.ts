import {createContext, useContext} from "react";
import Modeler from "bpmn-js/lib/Modeler";

export const ModelerRefContext = createContext<React.MutableRefObject<Modeler<null> | null> | null>(null)

export const useModelerRef = () => {
    return useContext(ModelerRefContext);
}

