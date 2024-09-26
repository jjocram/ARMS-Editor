import {Accordion, Button, Col, Drawer, Grid, Input, InputGroup, Row, Stack, Tree} from "rsuite";
import {useEffect, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import {BaseElement} from "../../Models/BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import ProductExecutor from "../../Models/ProductExecutor.ts";
import CompatibilityModal from "./CompatibilityModal.tsx";
import {ButtonTreeNode} from "../ButtonTreeNode.ts";
import {ExecutorAccessory} from "../../Models/Accessory.ts";
import AccessoryModal from "./AccessoryModal.tsx";

interface PropertiesDrawerProps {
    shape: Shape | null,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
}

function PropertiesDrawer({shape, isOpen, setIsOpen}: PropertiesDrawerProps) {
    const [element, setElement] = useState<BaseElement>(new BaseElement(null));
    const modelerRef = useModelerRef();

    const [showCompatibilityModal, setShowCompatibilityModal] = useState<boolean>(false);
    const [selectedExecutor, setSelectedExecutor] = useState<ExecutorElement | null>(null);
    const [selectedCompatibility, setSelectedCompatibility] = useState<ProductExecutor | undefined>(undefined);

    const [showAccessoryModal, setShowAccessoryModal] = useState<boolean>(false);
    const [selectedAccessory, setSelectedAccessory] = useState<ExecutorAccessory | undefined>(undefined);

    useEffect(() => {
        if (shape !== null) {
            if (ActivityElement.elementTypes.includes(shape.type)) {
                setElement(new ActivityElement(shape, modelerRef.modeler.current!, modelerRef.finalProducts));
            } else if (shape.type === "factory:Executor") {
                setElement(new ExecutorElement(shape, modelerRef.finalProducts, null));
            } else {
                setElement(new BaseElement(shape));
            }
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
        element.save(modelerRef.modeler.current!);
        setIsOpen(false);
    }


    function renderLabelForProductExecutor(productExecutorString: string) {
        if (productExecutorString.startsWith("button")) {
            const executorId = productExecutorString.split("@")[1]
            const executor = (element as ActivityElement).connectedExecutors.find((e) => e.id === executorId)!;
            return (
                <Button onClick={() => {
                    setSelectedExecutor(executor)
                    setSelectedCompatibility(undefined);
                    setShowCompatibilityModal(true)
                }}>New compatibility</Button>

            );
        } else {
            const productExecutorJSON = JSON.parse(productExecutorString);
            const productExecutor = new ProductExecutor(
                productExecutorJSON["id"],
                productExecutorJSON["name"],
                productExecutorJSON["time"],
                productExecutorJSON["timeUnit"],
                productExecutorJSON["idActivity"],
                productExecutorJSON["idExecutor"]
            );
            const executor = (element as ActivityElement).connectedExecutors.find(executor => executor.id === productExecutor.idExecutor)!;
            return (
                <Grid fluid>
                    <Row className="show-grid, disable-double-click" onDoubleClick={() => {
                        setSelectedExecutor(executor)
                        setSelectedCompatibility(productExecutor);
                        setShowCompatibilityModal(true)
                    }}>
                        <Col>{productExecutor.name}</Col>
                        <Col>{productExecutor.time}{productExecutor.timeUnit}</Col>
                    </Row>
                </Grid>
            );
        }
    }

    function renderCompatibilities() {
        if (element.needCompatibilities()) {
            const activityElement = element as ActivityElement;
            const executors = activityElement.connectedExecutors
                .map(executor => executor.toTreeNodeWithAssociatedProducts());
            return (
                <>
                    <Accordion.Panel header="Compatibilities">
                        <Tree data={executors}
                              renderTreeNode={treeNode => {
                                  return (
                                      <>
                                          {treeNode.children ? treeNode.label : renderLabelForProductExecutor(treeNode.label as string)}
                                      </>
                                  );
                              }}/>
                        <CompatibilityModal showModal={showCompatibilityModal} setShowModal={setShowCompatibilityModal}
                                            executor={selectedExecutor!} activity={activityElement} productExecutor={selectedCompatibility}/>
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

    function renderLabelForExecutorAccessory(valueString: string) {
        if (valueString.startsWith("button")) {
            return (
                <Button onClick={() => {
                    setSelectedAccessory(undefined)
                    setShowAccessoryModal(true);
                }}>New accessory</Button>
            );
        } else {
            const executorAccesoryJSON = JSON.parse(valueString);
            const executorAccessory = new ExecutorAccessory(
                executorAccesoryJSON["id"],
                executorAccesoryJSON["name"],
                executorAccesoryJSON["quantity"],
                executorAccesoryJSON["idExecutor"],
            );
            return (
                <Grid fluid>
                    <Row className="show-grid, disable-double-click" onDoubleClick={() => {
                        setSelectedAccessory(executorAccessory);
                        setShowAccessoryModal(true);
                    }}>
                        <Col>{executorAccessory.name}</Col>
                        <Col>{executorAccessory.quantity}</Col>
                    </Row>
                </Grid>
            )
        }
    }

    function renderAccessories() {
        if (element.needAccessories()) {
            const executorElement = element as ExecutorElement;
            const accessories = executorElement.neededAccessories.map(accessory => accessory.toTreeNode())
            accessories.push(ButtonTreeNode(executorElement.id))
            return (
                <>
                    <Accordion.Panel header="Accessories">
                        <Tree data={accessories}
                        renderTreeNode={treeNode => {return (renderLabelForExecutorAccessory(treeNode.label as string))}}/>

                        <AccessoryModal showModal={showAccessoryModal} setShowModal={setShowAccessoryModal} executor={executorElement} executorAccessory={selectedAccessory}/>
                    </Accordion.Panel>
                </>
            );
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
                    {renderAccessories()}
                </Accordion>
            </Drawer.Body>
        </Drawer>
    );
}

export default PropertiesDrawer;