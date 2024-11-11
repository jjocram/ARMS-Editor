import {HStack, IconButton, Input, InputGroup, Stack} from "rsuite";
import AddOutlineIcon from "@rsuite/icons/AddOutline";
import TrashIcon from "@rsuite/icons/Trash";

interface ProductPropertiesModifierProps {
    productProperties: Array<[string, string]>,
    setProductProperties: (value: Array<[string, string]> | ((prevState: Array<[string, string]>) => Array<[string, string]>)) => void,
}

export default function ProductPropertiesModifier({
                                                      productProperties,
                                                      setProductProperties
                                                  }: ProductPropertiesModifierProps) {
    function addNewProductProperty() {
        setProductProperties(prevState => [...prevState, ["", ""]]);
    }

    function removeProductProperty(index: number) {
        setProductProperties(prevState => prevState.filter((_item, i) => i !== index));
    }

    function updateKeyProductProperty(index: number, newKey: string) {
        setProductProperties(prevState => prevState.map((item, i) => i === index ? [newKey, item[1]] : item))
    }

    function updateValueProductProperty(index: number, newValue: string) {
        setProductProperties(prevState => prevState.map((item, i) => i === index ? [item[0], newValue] : item))
    }

    return (
        <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
            {productProperties.map(([key, value], index) => (
                <HStack key={index}>
                    <InputGroup>
                        <Input placeholder="Key" value={key}
                               onChange={newKey => updateKeyProductProperty(index, newKey)}/>
                        <Input placeholder="Value" value={value}
                               onChange={newValue => updateValueProductProperty(index, newValue
                               )}/>
                    </InputGroup>
                    <IconButton icon={<TrashIcon/>} appearance="subtle" color="red" onClick={() => removeProductProperty(index)}/>
                </HStack>
            ))}
            <IconButton icon={<AddOutlineIcon/>} onClick={addNewProductProperty}/>
        </Stack>
    );
}