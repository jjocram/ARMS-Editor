import {BaseElement} from "../../Models/BaseElement.ts";
import React, {SetStateAction} from "react";
import AdditionNumberInput from "../AdditionNumberInput.tsx";
import {Accordion, Stack} from "rsuite";

interface AdditionalInfoProps {
    element: BaseElement
    setElement: (value: SetStateAction<BaseElement>) => void
}

export default function AdditionalInfo({element, setElement} : AdditionalInfoProps) {
    if (element.additionalInfo().length === 0) {
        return (<></>);
    }

    const additionalInfoMap: Record<string, () => React.ReactElement> = {
        startQuantity: () => {
            return (
                <AdditionNumberInput key="startQuantity" field="startQuantity" label="Start Quantity"
                                     element={element} placeholder="Start quantity"
                                     setElement={setElement}/>
            );
        },
        quantity: () => {
            return (
                <AdditionNumberInput key="quantity" field="quantity" label="Quantity" element={element}
                                     placeholder="Quantity" setElement={setElement}/>
            )
        },
        cost: () => {
            return (
                <AdditionNumberInput key="cost" field="cost" label="Cost" element={element}
                                     placeholder="Cost per unit of time" setElement={setElement}/>
            )
        },
        energyConsumption: () => {
            return (
                <AdditionNumberInput key="energyConsumption" field="energyConsumption" label={"Energy"}
                                     element={element}
                                     placeholder={"Energy consumption per unit of time"} setElement={setElement}/>
            )
        },
        wasteGeneration: () => {
            return (
                <AdditionNumberInput key="wasteGeneration" field="wasteGeneration" label={"Waste"} element={element}
                                     placeholder={"Waste generation per unit of time"} setElement={setElement}/>
            )
        },
        maintenanceCost: () => {
            return (
                <AdditionNumberInput key="maintenanceCost" field="maintenanceCost" label={"Maintenance"}
                                     element={element}
                                     placeholder={"Maintenance cost per unit of time"} setElement={setElement}/>
            )
        },
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