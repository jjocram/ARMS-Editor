import {Accordion, Drawer, Input, InputGroup, Stack} from "rsuite";
import {useEffect, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import {BaseElement} from "../../Models/BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";

interface PropertiesDrawerProps {
    shape: Shape | null,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
}

function PropertiesDrawer({shape, isOpen, setIsOpen}: PropertiesDrawerProps) {
    const [element, setElement] = useState<BaseElement>(new BaseElement(null));
    const modelerRef = useModelerRef();

    useEffect(() => {
        if (shape !== null) {
            setElement(new BaseElement(shape));
        }
    }, [shape])

    function handleElementNameChange(newValue: string) {
        setElement((prevElement) => {
            return Object.assign(
                Object.create(Object.getPrototypeOf(prevElement)),
                prevElement,
                {name: newValue}
            );
        });
    }

    function handleSaveElement() {
        console.log(modelerRef.modeler)
        element.save(modelerRef.modeler.current!);
        setIsOpen(false);
    }

    function renderCompatibilities() {
        if (element.needCompatibilities()) {
            return (
                <>
                    <Accordion.Panel header="Compatibilities">
                        <p>Text</p>
                    </Accordion.Panel>
                </>
            );
        } else {
            return null
        }
    }

    function renderTransformations() {
        if (element.needTransformations()) {
            return (
                <>
                    <Accordion.Panel header="Transformations">
                        <p>Text</p>
                    </Accordion.Panel>
                </>
            );
        } else {
            return null
        }
    }

    function renderBaseInfo() {
        return (
            <>
                <Accordion.Panel header="Base info">
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
                </Accordion.Panel>
            </>
        )
    }

    return (
        <Drawer enforceFocus={false} open={isOpen} onClose={handleSaveElement}>
            <Drawer.Header>
                <Drawer.Title>{element.getDisplayName()}</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
                <Accordion>
                    {renderBaseInfo()}
                    {renderCompatibilities()}
                    {renderTransformations()}
                </Accordion>
            </Drawer.Body>
        </Drawer>
    );
}

export default PropertiesDrawer;