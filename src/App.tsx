import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {useEffect, useRef} from "react";
import {ModelerRefContext} from "./ModelerContext.ts";
import MenuBar from "./components/MenuBar/MenuBar.tsx";

function App() {
    const modelerRef = useRef<Modeler | null>(null);

    function initializeModeler() {
        const container = document.getElementById('diagramContainer') as HTMLElement;
        if (!modelerRef.current && container) {
            modelerRef.current = new Modeler({
                container: container,
            })
            console.log("Modeler initialized")
        }
    }

    function setXmlDiagramToEmpty() {
        fetch("/empty_diagram.bpmn")
            .then(res => res.text())
            .then(data => modelerRef.current?.importXML(data))
            .catch(err => console.log(err));
    }

    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    return (
        <div className="App">
            <ModelerRefContext.Provider value={modelerRef}>
                <MenuBar setXmlDiagramToEmpty={setXmlDiagramToEmpty}></MenuBar>
                <div id="diagramContainer" className="diagramContainer"></div>
            </ModelerRefContext.Provider>
        </div>
    )
}

export default App
