import {InputPicker} from "rsuite";
import {useModelerRef} from "../../ModelerContext.ts";
import {Accessory} from "../../Models/Accessory.ts";
import {generateId} from "../../Utils.ts";

interface AccessoryPickerProps {
    accessory: Accessory;
    setAccessory: (accessories: Accessory) => void;
}

export default function AccessoryPicker({accessory, setAccessory}: AccessoryPickerProps) {
    const modelContext = useModelerRef();

    function handleAccessoryCreation(value: string) {
        const newAccessory = new Accessory(generateId("Accessory"), value as string, 1); // TODO: input quantity
        newAccessory.save(modelContext.modeler.current!);
        modelContext.availableAccessories.set(newAccessory.id, newAccessory);
        setAccessory(newAccessory);
    }

    function handleAccessoryChange(value: string) {
        const newAccessory = modelContext.availableAccessories.get(value);
        if (newAccessory) {
            setAccessory(newAccessory);
        }
    }

    return (
        <InputPicker
            style={{width: "100%"}}
            creatable
            data={[...modelContext.availableAccessories.values()].map(a => a.toItemDataType())}
            onCreate={handleAccessoryCreation}
            value={accessory?.id}
            onSelect={handleAccessoryChange}
        />
    );
}