import {MetricResult, toDataForSimulationTimeBarChart} from "../../Models/SimulationResult.ts";
import {Heading, VStack} from "rsuite";
import {Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis} from "recharts";
import {useModelerRef} from "../../ModelerContext.ts";

interface ChartsSimulationProps {
    simulationResult: MetricResult
}

export default function ChartsSimulation({simulationResult} : ChartsSimulationProps) {
    const modelerRef = useModelerRef();

    return (
        <VStack>
            <Heading>Simulation results</Heading>
            <BarChart width={300} height={250} data={toDataForSimulationTimeBarChart(simulationResult, modelerRef.compatibilities)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category"/>
                <Tooltip />
                <Legend />
                <Bar dataKey="Simulated" fill="#8884d8" />
                <Bar dataKey="Ideal" fill="#7784aa" />
            </BarChart>
        </VStack>
    );
}