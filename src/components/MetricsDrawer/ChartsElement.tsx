import {Shape} from "bpmn-js/lib/model/Types.ts";
import {
    getExecutorsBusyTimePerActivity,
    MetricResult,
    toDataActivityExecutorsProductsPieChart,
    toDataActivityExecutorsTimePieChart,
    toDataExecutorActivitiesBarChart
} from "../../Models/SimulationResult.ts";
import {Heading, Text, VStack} from "rsuite";
import {ReactElement, useEffect, useState} from "react";
import {BaseElement} from "../../Models/BaseElement.ts";
import {useModelerRef} from "../../ModelerContext.ts";
import {setSpecificElementFromShape} from "../../Utils.ts";
import {ActivityElement} from "../../Models/ActivityElement.ts";
import {Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, Tooltip, XAxis, YAxis} from "recharts";

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
                        <div key={`${element.id}-${index}`}>
                            <Text weight="bold" size="lg">Time-frame for {element.name}-{index + 1}</Text>
                            <PieChart width={200} height={200}>
                                <Pie dataKey="value" data={activityData} isAnimationActive={false}
                                     blendStroke={activityData.length === 1}>
                                    {activityData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index]}/>
                                    ))}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </div>
                    );
                })}
                {toDataExecutorActivitiesBarChart(simulationResult, element, modelerRef.activities).map((executorsData, index) => {
                    return (
                        <div key={executorsData.id}>
                            <Text weight="bold" size="lg">Times for {element.name}-{index + 1}</Text>
                            <BarChart width={300} height={250} data={executorsData.activities} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis type="number"/>
                                <YAxis dataKey="name" type="category"/>
                                <Tooltip/>
                                <Legend/>
                                <Bar dataKey="busyPerProduct" fill="#1F3A93" name="Ideal time"
                                     isAnimationActive={false}/>
                                <Bar dataKey="averageTime" fill="#00AA98" name="Average time"
                                     isAnimationActive={false}/>
                                <Bar dataKey="worstTime" fill="#FF6B6B" name="Worst result" isAnimationActive={false}/>
                            </BarChart>
                        </div>)
                })}
            </>],
            ["factory:Inventory", <div/>],
        ]);
        for (const activityType of ActivityElement.elementTypes) {
            const pieChart = (data: {id: string, name: string, value: number}[]) => {
                return (
                    <PieChart width={200} height={200}>
                        <Pie dataKey="value" data={data}
                             isAnimationActive={false}
                             blendStroke={data.length === 1}>
                            {data.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index]}/>
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                )
            }
            typeCharts.set(activityType, (<>
                <Text weight="bold" size="lg">Times of assigned executors</Text>
                {pieChart(toDataActivityExecutorsTimePieChart(simulationResult, element, modelerRef.executors))}

                <Text weight="bold" size="lg">Products processed at assigned executors</Text>
                {pieChart(toDataActivityExecutorsProductsPieChart(simulationResult, element, modelerRef.executors))}
            </>));
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