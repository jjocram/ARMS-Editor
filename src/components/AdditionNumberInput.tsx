import {BaseElement} from "../Models/BaseElement.ts";
import {InputGroup, InputNumber} from "rsuite";
import {SetStateAction} from "react";

interface AdditionNumberInputProps {
    field: string,
    label: string,
    element: BaseElement,
    placeholder: string,
    setElement: (value: SetStateAction<BaseElement>) => void
}

export default function AdditionNumberInput({field, label, element, placeholder, setElement}: AdditionNumberInputProps) {
    const objectAttribute = field as keyof BaseElement;

    return (
        <InputGroup>
            <InputGroup.Addon>{label}</InputGroup.Addon>
            <InputNumber value={element[objectAttribute] as string} placeholder={placeholder} onChange={newValue => setElement((prevElement) => {
                return Object.assign(Object.create(Object.getPrototypeOf(prevElement)), prevElement, {[objectAttribute]: newValue})
            })}/>
        </InputGroup>
    );
}