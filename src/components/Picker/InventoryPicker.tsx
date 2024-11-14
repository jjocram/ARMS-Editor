import {useModelerRef} from "../../ModelerContext.ts";
import Inventory from "../../Models/Inventory.ts";
import {InputPicker} from "rsuite";

interface InventoryPickerProps {
    inventory: Inventory;
    setInventory: (inventory: Inventory) => void;
}

export default function InventoryPicker({inventory, setInventory}: InventoryPickerProps) {
    const modelContext = useModelerRef()

    function handleInventoryCreation(value: string) {
        console.log(value);
    }

    function handleInventoryChange(value: string) {
        const newInventory = modelContext.inventories.get(value);
        if (newInventory) {
            setInventory(newInventory);
        }
    }

    return (
        <InputPicker style={{width: "100%"}}
                     // creatable
                     data={[...modelContext.inventories.values()].map(i => i.toItemData())}
                     onCreate={handleInventoryCreation}
                     value={inventory?.id}
                     onChange={handleInventoryChange}
        />
    )
}