import {
    Accordion,
    Button,
    Col,
    Drawer,
    Grid,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputNumber,
    Row,
    Stack,
    Tree
} from "rsuite";
import React, {useEffect, useState} from "react";
import {useModelerRef} from "../../ModelerContext.ts";
import {BaseElement} from "../../Models/BaseElement.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {ExecutorElement} from "../../Models/ExecutorElement.ts";
import CompatibilityModal from "./CompatibilityModal.tsx";
import {ButtonTreeNode} from "../ButtonTreeNode.ts";
import {TreeNode} from "rsuite/cjs/internals/Tree/types";
import {Transformation} from "../../Models/Transformation.ts";
import TransformationModal from "./TransformationModal.tsx";
import Compatibility from "../../Models/Compatibility.ts";
import MinusRoundIcon from "@rsuite/icons/MinusRound";
import Inventory from "../../Models/Inventory.ts";

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
    const [selectedCompatibility, setSelectedCompatibility] = useState<Compatibility | undefined>(undefined);

    const [showTransformationModal, setShowTransformationModal] = useState<boolean>(false);
    const [selectedTransformation, setSelectedTransformation] = useState<Transformation | undefined>(undefined);

    useEffect(() => {
        if (shape !== null) {
            if (ActivityElement.elementTypes.includes(shape.type)) {
                setElement(new ActivityElement(shape, modelerRef.modeler.current!, modelerRef.compatibilities!));
            } else if (shape.type === "factory:Executor") {
                setElement(new ExecutorElement(shape, []));
            } else if (shape.type === "factory:Inventory") {
                setElement(modelerRef.inventories.get(shape.id)!);
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


    function handleRemoveCompatibility(compatibility: Compatibility) {
        const activityElement = element as ActivityElement;
        activityElement.connectedExecutors = activityElement.connectedExecutors.map(e => {
            if (e.id === compatibility.idExecutor) {
                e.associatedCompatibilities = e.associatedCompatibilities.filter(c => c.id !== compatibility.id);
            }
            return e
        });
        setElement(activityElement);

        compatibility.delete(modelerRef.modeler.current!);

        modelerRef.compatibilities = modelerRef.compatibilities.filter(c => c.id !== compatibility.id);
    }

    function renderLabelForCompatibility(productExecutorString: string) {
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
            const compatibilityJSON = JSON.parse(productExecutorString);
            const compatibility = modelerRef.compatibilities.find(c => c.id === compatibilityJSON.id);
            if (compatibility) {
                const executor = (element as ActivityElement).connectedExecutors.find(executor => executor.id === compatibility.idExecutor)!;
                return (
                    <HStack>
                        <Grid fluid>
                            <Row className="show-grid, disable-double-click" onDoubleClick={() => {
                                setSelectedExecutor(executor)
                                setSelectedCompatibility(compatibility);
                                setShowCompatibilityModal(true)
                            }}>
                                <Col>{compatibility.id}</Col>
                                <Col>{compatibility.time}{compatibility.timeUnit}</Col>
                            </Row>
                        </Grid>
                        <IconButton icon={<MinusRoundIcon/>} color="red" appearance="subtle"
                                    onClick={() => handleRemoveCompatibility(compatibility)}/>
                    </HStack>
                );
            }
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
                                          {treeNode.children ? treeNode.label : renderLabelForCompatibility(treeNode.label as string)}
                                      </>
                                  );
                              }}/>
                        <CompatibilityModal showModal={showCompatibilityModal} setShowModal={setShowCompatibilityModal}
                                            executor={selectedExecutor!} activity={activityElement}
                                            compatibility={selectedCompatibility}/>
                    </Accordion.Panel>
                </>
            );
        } else {
            return null
        }
    }

    function renderLabelForTransformation(element: TreeNode) {
        const dataLabel = element.label as string;

        if (dataLabel.startsWith("button")) {
            const buttonType = dataLabel.split("@")[1];
            if (buttonType.startsWith("Activity")) {
                // Render button for a new Transformation
                return (<Button onClick={() => {
                    setShowTransformationModal(true);
                    setSelectedTransformation(undefined)
                }}>Add transformation</Button>)
            } else {
                throw new Error(`Type of button ${dataLabel} in transformation not recognized`)
            }
        }

        return (
            <Grid fluid>
                <Row className="show-grid, disable-double-click" onDoubleClick={() => {
                    const transformation = modelerRef.transformations.get(element.value as string);
                    console.log(transformation);
                    setSelectedTransformation(transformation);
                    setShowTransformationModal(true);
                }}>
                    <Col>{dataLabel}</Col>
                </Row>
            </Grid>
        )
    }

    function renderTransformations() {
        if (element.needTransformations()) {
            const activityElement = element as ActivityElement;
            const transformations = [...modelerRef.transformations.values()]
                .filter(transformation => transformation.activityId === activityElement.id)
                .map(transformation => transformation.toTreeNode());
            transformations.push(ButtonTreeNode(activityElement.id))

            return (
                <>
                    <Accordion.Panel header="Transformations">
                        <Tree data={transformations} renderTreeNode={treeNode => {
                            return (renderLabelForTransformation(treeNode))
                        }}/>
                        <TransformationModal showModal={showTransformationModal}
                                             setShowModal={setShowTransformationModal} activity={activityElement}
                                             transformation={selectedTransformation}/>
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

    function renderAdditionalInfo() {
        if (element.additionalInfo().length === 0) {
            return (<></>);
        }

        const additionalInfoMap: Record<string, () => React.ReactElement> = {
            startQuantity:  () => {
                const inventoryElement = element as Inventory;
                return (
                    <InputGroup key="startQuantity">
                        <InputGroup.Addon>Start quantity</InputGroup.Addon>
                        <InputNumber value={inventoryElement.startQuantity} placeholder="Start quantity"
                                     onChange={newValue => setElement((prevElement) => {
                                         return Object.assign(
                                             Object.create(Object.getPrototypeOf(prevElement)),
                                             prevElement,
                                             {startQuantity: newValue}
                                         );
                                     })}/>
                    </InputGroup>
                );
            }
        }

        return (
            <Accordion.Panel header="Additional info">
                <Stack spacing={10} direction="column" alignItems="flex-start">
                    {element.additionalInfo().map(infoKey => {
                        const renderFunction = additionalInfoMap[infoKey];
                        return renderFunction ? renderFunction() : (<p>{infoKey} not found</p>);
                    })}
                </Stack>
            </Accordion.Panel>
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
                    {renderAdditionalInfo()}
                    {renderCompatibilities()}
                    {renderTransformations()}
                </Accordion>
            </Drawer.Body>
        </Drawer>
    );
}

export default PropertiesDrawer;