import {BaseElement} from "../../Models/BaseElement.ts";
import {Button} from "rsuite";
import ScriptEditorModal from "../Scripting/ScriptEditorModal.tsx";

interface ButtonOpenEditorProps {
    element: BaseElement;
    show: boolean;
    setShow: (value: boolean) => void;
}

export default function ButtonOpenEditor({element, show, setShow}: ButtonOpenEditorProps) {
    const compatiblesTypes = ["bpmn:SequenceFlow", "factory:Connection"];

    if (!compatiblesTypes.includes(element.type)) {
        return null;
    }

    return (
        <>
            <Button size="lg" onClick={() => setShow(true)}>Open editor</Button>
            <ScriptEditorModal show={show} setShow={setShow} element={element}/>
        </>
    );
}