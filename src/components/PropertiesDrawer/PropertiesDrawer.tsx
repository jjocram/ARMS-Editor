import {
    Accordion,
    Button,
    Col,
    Drawer,
    Grid,
    HStack,
    IconButton,
    Row,
    Tree
} from "rsuite";
import {useEffect, useState} from "react";
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
import BaseInfo from "./BaseInfo.tsx";
import AdditionalInfo from "./AdditionalInfo.tsx";
import ButtonOpenEditor from "./ButtonOpenEditor.tsx";

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

    const [showScriptEditorModal, setShowScriptEditorModal] = useState<boolean>(false);

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

    return (
        <Drawer enforceFocus={false} open={isOpen} onClose={handleSaveElement}>
            <Drawer.Header>
                <Drawer.Title>{element.getDisplayName()}</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
                <Accordion>
                    <BaseInfo element={element} handleElementNameChange={handleElementNameChange}/>
                    <AdditionalInfo element={element} setElement={setElement}/>
                    {renderCompatibilities()}
                    {renderTransformations()}
                    <ButtonOpenEditor element={element} show={showScriptEditorModal}
                                      setShow={setShowScriptEditorModal}/>
                </Accordion>
            </Drawer.Body>
        </Drawer>
    );
}

export default PropertiesDrawer;