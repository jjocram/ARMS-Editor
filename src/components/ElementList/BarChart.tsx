import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BarChartData {
    id: string;
    busyPerProduct: number; 
    average: number;
    max: number;
}

interface BarChartProps {
    data: BarChartData[];
    title: string;
    globalMax: number; 
}

const BarChart: React.FC<BarChartProps> = ({ data, title, globalMax }) => {
    const ref = useRef<HTMLDivElement>(null);

    const isInactive = (data: BarChartData[]) => {
        return data.every(d => d.busyPerProduct === 0 && d.average === 0 && d.max === 0);
    };
    
    useEffect(() => {
        if (!data || data.length === 0) return;

        const container = d3.select(ref.current);

        if (!data || data.length === 0 || isInactive(data)) {
            container.selectAll("*").remove();
            return;
        }
        container.selectAll("*").remove(); 

        const margin = { top: 20, right: 60, bottom: 5, left: 60 }; 
        const width = 350 - margin.left - margin.right; 
        const height = 50;

        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(title);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain([1, globalMax]) 
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.id))
            .range([0, height])
            .padding(0.1);

        const bandWidth = y.bandwidth() / 3; 

        const keys = ['busyPerProduct', 'average', 'max'];
        const colors = ['steelblue', 'lightblue', 'red'];
        const labels = ['ideal', 'average', 'worst']; 

        keys.forEach((key, index) => {
            chart.selectAll(`.bar-${key}`)
                .data(data)
                .enter()
                .append("rect")
                .attr("class", `bar-${key}`)
                .attr("y", d => y(d.id)! + index * bandWidth)
                .attr("height", bandWidth)
                .attr("x", 0)
                .attr("width", d => Math.max(x(Number(d[key as keyof BarChartData])), 1))
                .style("fill", colors[index]);

            chart.selectAll(`.label-${key}`)
                .data(data)
                .enter()
                .append("text")
                .attr("class", `label-${key}`)
                .attr("x", -5) 
                .attr("y", d => y(d.id)! + index * bandWidth + bandWidth / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .text(d => Number(d[key as keyof BarChartData]).toFixed(1))
                .style("fill", "black")
                .style("font-size", "10px");

            chart.selectAll(`.bar-label-${key}`)
                .data(data)
                .enter()
                .append("text")
                .attr("class", `bar-label-${key}`)
                .attr("x", d => x(Number(d[key as keyof BarChartData])) + 5) 
                .attr("y", d => y(d.id)! + index * bandWidth + bandWidth / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "start")
                .text(labels[index]) 
                .style("fill", "#C0C0C0") 
                .style("font-size", "10px")
                .style("font-weight", "normal");
        });
    }, [data, title, globalMax]);

    return <div ref={ref} style={{ marginBottom: '20px' }} />;
};

export default BarChart;
