import {Editor} from "@monaco-editor/react";
import {useRef} from "react";
import * as monaco from "monaco-editor";
import {Button, Modal} from "rsuite";
import {BaseElement} from "../../Models/BaseElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";

interface ScriptEditorModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    element: BaseElement
}

export default function ScriptEditorModal({show, setShow, element}: ScriptEditorModalProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor|null>(null);
    const modelContext = useModelerRef();

    function handleEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor) {
        editorRef.current = editor;
        if (element.script !== undefined) {
            editor.setValue(element.script);
        }
    }

    function close() {
        element.script = editorRef.current!.getValue();
        element.save(modelContext.modeler.current!);
        setShow(false);
    }

    return (
        <Modal open={show} onClose={close} size="lg">
            <Modal.Header>
                <Modal.Title>Script for {element.name}</Modal.Title>
            </Modal.Header>

            <Editor height="80vh" defaultLanguage="kotlin" defaultValue="// some comment" onMount={handleEditorDidMount}/>

            <Modal.Footer>
                <Button onClick={close}>Save</Button>
            </Modal.Footer>
        </Modal>

    );
}