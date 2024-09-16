import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {useEffect, useRef} from "react";
import {ModelerRefContext} from "./ModelerContext.ts";
import MenuBar from "./components/MenuBar/MenuBar.tsx";
import customModdleExtension from "./customModel/factoryModel.json"
import bpmnExtension from './BPMNExtensions';

import lintModule from "bpmn-js-bpmnlint";
import bpmnlintConfig from "./linting/.bpmnlintrc";
import "./linting/bpmn-js-bpmnlint.css";

function App() {
    const modelerRef = useRef<Modeler | null>(null);

    function initializeModeler() {
        const container = document.getElementById('diagramContainer') as HTMLElement;
        if (!modelerRef.current && container) {
            modelerRef.current = new Modeler({
                container: container,
                keyboard: { bindTo: document.body },
                moddleExtensions: {
                    factory: customModdleExtension
                },
                linting: {
                  bpmnlint: bpmnlintConfig,
                  active: true,
                },
                additionalModules: [
                    bpmnExtension,
                    lintModule
                ]
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
