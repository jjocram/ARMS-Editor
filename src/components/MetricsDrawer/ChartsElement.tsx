import {Shape} from "bpmn-js/lib/model/Types.ts";
import {
    getExecutorsBusyTimePerActivity,
    MetricResult
} from "../../Models/SimulationResult.ts";
import {Heading, Text, VStack} from "rsuite";
import {ReactElement, useEffect, useState} from "react";
import {BaseElement} from "../../Models/BaseElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import {setSpecificElementFromShape} from "../../Utils.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {Cell, Legend, Pie, PieChart, Tooltip} from "recharts";

interface ChartElementProps {
    simulationResult: MetricResult
    shape: Shape
}

export default function ChartsElement({simulationResult, shape}: ChartElementProps) {
    const modelerRef = useModelerRef();
    const [element, setElement] = useState<BaseElement>(new BaseElement(null));
    useEffect(() => {
        setSpecificElementFromShape(shape, setElement, modelerRef);
    }, [shape]);

    const colors = ["#1E3A8A", "#0F766E", "#10B981", "#F59E0B", "#EA580C", "#DC2626", "#BE185D", "#7C3AED", "#64748B", "#F3E8D2"]

    const noData = (<Text>This element has no data</Text>);

    function dataCharts() {
        const typeCharts = new Map<string, ReactElement>([
            ["factory:Executor", <>
                {getExecutorsBusyTimePerActivity(element.id, simulationResult, modelerRef.activities).map((activityData, index) => {
                    return (
                        <PieChart width={400} height={400} key={`${element.id}-${index}`}>
                            <Pie dataKey="value" data={activityData} isAnimationActive={false}
                                 blendStroke={activityData.length === 1}>
                                {activityData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index]}/>
                                ))}
                            </Pie>
                            <Tooltip/>
                            <Legend/>
                        </PieChart>
                    );
                })}

            </>],
            ["factory:Inventory", <div/>],
        ]);
        for (const activityType of ActivityElement.elementTypes) {
            typeCharts.set(activityType, <div/>);
        }

        return typeCharts.get(element.type) ?? noData;
    }

    return (
        <VStack>
            <Heading>Data for {element.name ? element.name : "selected element"}</Heading>
            {dataCharts()}
        </VStack>
    );
}