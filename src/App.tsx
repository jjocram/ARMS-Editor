import './App.css'
import Modeler from "bpmn-js/lib/Modeler";
import {useEffect, useRef} from "react";
import {Dropdown} from "rsuite";
import DropdownItem from "rsuite/DropdownItem";

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

    function downloadDiagram() {
        modelerRef.current?.saveXML({format: true})
            .then(res => {
                const a = document.createElement('a');
                const file = new Blob([res.xml ?? ""], {type: 'application/xml'});
                a.href = URL.createObjectURL(file);
                a.download = "diagram.bpmn";
                a.click();
                URL.revokeObjectURL(a.href);
            })
    }

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.item(0);
        if (!file) {
            return
        }

        const reader = new FileReader();
        reader.onload = () => {
            modelerRef.current?.importXML(reader.result as string)
        }
        reader.onerror = () => {
            console.log(reader.error)
        }

        reader.readAsText(file);
    }

    useEffect(() => {
        initializeModeler();
        setXmlDiagramToEmpty();
    }, []);

    return (
        <div className="App">
            <Dropdown title="File">
                <DropdownItem onSelect={() => setXmlDiagramToEmpty()}>New diagram</DropdownItem>
                <DropdownItem onSelect={() => fileInputRef.current?.click()}>Upload diagram <input ref={fileInputRef}
                                                                                                   type="file" hidden
                                                                                                   onChange={handleFileInput}/></DropdownItem>
                <DropdownItem onSelect={() => downloadDiagram()}>Download diagram</DropdownItem>
            </Dropdown>
            <div id="diagramContainer" className="diagramContainer"></div>
        </div>
    )
}

export default App
