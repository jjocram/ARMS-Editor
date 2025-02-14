import {BaseElement} from "../../Models/BaseElement.ts";
import {Accordion, Input, InputGroup, Stack} from "rsuite";

interface BaseInfoProps {
    element: BaseElement
    handleElementNameChange: (newValue: string) => void
}

export default function BaseInfo({element, handleElementNameChange}: BaseInfoProps) {

    return (<Accordion.Panel header="Base info">
        <Stack spacing={10} direction="column" alignItems="flex-start">
            <InputGroup>
                <InputGroup.Addon>Id</InputGroup.Addon>
                <Input value={element.id} readOnly/>
            </InputGroup>
            <InputGroup>
                <InputGroup.Addon>Type</InputGroup.Addon>
                <Input value={element.getDisplayType()} readOnly/>
            </InputGroup>
            <InputGroup>
                <InputGroup.Addon>Name</InputGroup.Addon>
                <Input value={element.name} onChange={handleElementNameChange}
                       placeholder="Element name"/>
            </InputGroup>
        </Stack>
    </Accordion.Panel>);
}