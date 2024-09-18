import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {Shape} from 'bpmn-js/lib/model/Types.ts'
import {useEffect, useRef, useState} from "react";
import {ModelerContext, ModelerRefContext} from "./ModelerContext.ts";

import MenuBar from "./components/MenuBar/MenuBar.tsx";

import customModdleExtension from "./customModel/factoryModel.json"

import bpmnExtension from './BPMNExtensions';

// @ts-ignore
import lintModule from "bpmn-js-bpmnlint";
// @ts-ignore
import bpmnlintConfig from "./linting/.bpmnlintrc";
import "./linting/bpmn-js-bpmnlint.css";
import PropertiesDrawer from "./components/PropertiesDrawer/PropertiesDrawer.tsx";

function App() {
    const modelerRef = useRef<Modeler | null>(null);
    const [modelerContext, _] = useState<ModelerContext>(new ModelerContext())
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState<Shape | null>(null);

    function initializeModeler() {
        const container = document.getElementById('diagramContainer') as HTMLElement;
        if (!modelerRef.current && container) {
            modelerRef.current = new Modeler({
                container: container,
                keyboard: {bindTo: document.body},
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
            modelerRef.current.on('element.dblclick', 1500, handleSelectionChange);

            modelerContext.modeler = modelerRef;
            modelerContext.products = [] // TODO: read from productList
            console.log("Modeler initialized")
        }
    }

    function handleSelectionChange(event: any) {
        setSelectedElement(event.element);
        setDrawerOpen(true);
        event.stopPropagation();
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
            <ModelerRefContext.Provider value={modelerContext}>
                <MenuBar setXmlDiagramToEmpty={setXmlDiagramToEmpty}></MenuBar>
                <div id="diagramContainer" className="diagramContainer"></div>
                <PropertiesDrawer shape={selectedElement} isOpen={isDrawerOpen} setIsOpen={setDrawerOpen}/>
            </ModelerRefContext.Provider>
        </div>
    )
}

export default App
