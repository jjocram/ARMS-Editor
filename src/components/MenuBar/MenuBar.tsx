import {ButtonToolbar, Dropdown} from "rsuite";
import DropdownItem from "rsuite/DropdownItem";
import {useRef} from "react";
import {useModelerRef} from "../../ModelerContext.ts";

// @ts-ignore
function MenuBar({setXmlDiagramToEmpty}) {
    const modelerRef = useModelerRef();

    function downloadDiagram() {
        modelerRef?.current?.saveXML({format: true})
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
            modelerRef?.current?.importXML(reader.result as string)
        }
        reader.onerror = () => {
            console.log(reader.error)
        }

        reader.readAsText(file);
    }

    return (
        <ButtonToolbar>
            <Dropdown title="File">
                <DropdownItem onSelect={() => setXmlDiagramToEmpty()}>New diagram</DropdownItem>
                <DropdownItem onSelect={() => fileInputRef.current?.click()}>Upload diagram <input
                    ref={fileInputRef}
                    type="file" hidden
                    onChange={handleFileInput}/></DropdownItem>
                <DropdownItem onSelect={() => downloadDiagram()}>Download diagram</DropdownItem>
            </Dropdown>
            <Dropdown title="View">
                <DropdownItem>Show/Hide Executors</DropdownItem>
                <DropdownItem>Show/Hide Warnings</DropdownItem>
            </Dropdown>
        </ButtonToolbar>
    )
}

export default MenuBar;