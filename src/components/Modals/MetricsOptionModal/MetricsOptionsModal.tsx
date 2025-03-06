import {Button, Divider, Modal, Stack} from "rsuite";
import {ExecutorMetricsRanges, setToLocalStorage, TypeOfMetrics} from "../../../ExecutorsColorRanges.ts";
import {useState} from "react";
import {ColorRangeSlider} from "./ColorRangeSlider.tsx";

interface MetricsOptionsModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    executorsColorThresholds: ExecutorMetricsRanges
    setExecutorsColorThresholds: (executorsColorThresholds: ExecutorMetricsRanges) => void
    selectedMetric: TypeOfMetrics
}

export function MetricsOptionsModal(props: MetricsOptionsModalProps) {
    const [inEditExecutorColorThreshold, setInEditExecutorColorThreshold] = useState<ExecutorMetricsRanges>(props.executorsColorThresholds);

    function close() {
        setToLocalStorage(inEditExecutorColorThreshold);
        props.setExecutorsColorThresholds(inEditExecutorColorThreshold);
        props.setShow(false);
    }

    function handleOnValueChange(metric: TypeOfMetrics, newRanges: number[], index: number) {
        const editedRanges = inEditExecutorColorThreshold[metric].map((range, i) => {
            const changedValue = newRanges[index];
            if (i === index) {
                return {
                    ...range,
                    max: changedValue
                }
            } else if (i === index + 1) {
                return {
                    ...range,
                    min: changedValue
                }
            } else {
                return range;
            }
        });
        setInEditExecutorColorThreshold({
            ...inEditExecutorColorThreshold,
            [metric]: editedRanges,
        });
    }

    function handleColorChange(metric: TypeOfMetrics, newColor: string, index: number) {
        const editedRanges = inEditExecutorColorThreshold[metric].map((range, i) => {
            if (i === index) {
                return {...range, color: newColor};
            } else {
                return range
            }
        })
        setInEditExecutorColorThreshold({
            ...inEditExecutorColorThreshold,
            [metric]: editedRanges
        });
    }

    return (
        <Modal open={props.show} onClose={close}>
            <Modal.Header><Modal.Title>Metrics options</Modal.Title></Modal.Header>

            <Stack spacing={10} direction="column" alignItems="stretch" style={{padding: "1em"}}>
                <p>Availability</p>
                <ColorRangeSlider ranges={inEditExecutorColorThreshold.availability}
                                  onChange={(newRanges, index) => handleOnValueChange("availability", newRanges, index)}
                                  onChangeColor={(newColor, index) => handleColorChange("availability", newColor, index)}/>
                <Divider style={{marginTop: '3em', marginBottom: '1em'}}/>
                <p>Queue length</p>
                <ColorRangeSlider ranges={inEditExecutorColorThreshold.queueLength}
                                  onChange={(newRanges, index) => handleOnValueChange("queueLength", newRanges, index)}
                                  onChangeColor={(newColor, index) => handleColorChange("queueLength", newColor, index)}/>
            </Stack>

            <Modal.Footer style={{marginTop: '3em'}}>
                <Button onClick={close} appearance="primary">Ok</Button>
            </Modal.Footer>
        </Modal>
    );
}