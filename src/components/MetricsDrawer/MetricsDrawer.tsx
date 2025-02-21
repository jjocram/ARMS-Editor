import {MetricResult} from "../../Models/SimulationResult.ts";
import {Shape} from "bpmn-js/lib/model/Types.ts";
import {CSSProperties} from "react";
import ChartsSimulation from "./ChartsSimulation.tsx";
import ChartsElement from "./ChartsElement.tsx";

interface MetricsDrawerProps {
    simulationResult: MetricResult
    shape: Shape | null
}

export default function MetricsDrawer({simulationResult, shape}: MetricsDrawerProps) {
    const style: CSSProperties = {
        height: "100%",
        width: "25%",
        backgroundColor: "white",
        position: "absolute",
        zIndex: "10",
        top: "0px",
        right: "0px",
        borderLeft: "1px solid black",
        paddingLeft: "1em",
    }

    return (
        <div style={style}>
            {shape === null
                ? <ChartsSimulation simulationResult={simulationResult}/>
                : <ChartsElement simulationResult={simulationResult} shape={shape!}/>
            }
        </div>
    );
}