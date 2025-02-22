import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Activity {
  id: string;
  name: string;
  busy: number;
  processedItems?: number;
}

interface PieChartProps {
  activities: Activity[];
  chartType: 'executor' | 'activity' | "processedItems";
  width?: number;
  height?: number;
}

const PieChart: React.FC<PieChartProps> = ({ activities, chartType, width = 150, height = 120 }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activities || activities.length === 0) {
            return;
        }

        const container = d3.select(ref.current);
        container.selectAll("*").remove();
        container.html('');

        const radius = Math.min(width, height) / 2;
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const svg = container.append('svg')
            .attr('width', width + 150)
            .attr('height', height + 70) 
            .style('display', 'block')
            .style('margin', '0 auto');

        //The title according to the chart type
        const chartTitle = chartType === "executor"
            ? "Time-frame for each activity"
            : chartType === "activity"
            ? "Involved executors"
            : "Products processed by each executor";

        svg.append('text')
            .attr('x', (width + 100) / 2)
            .attr('y', 20) 
            .attr('text-anchor', 'middle') 
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(chartTitle);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${(height / 2) + 30})`); 
      
        const pie = d3.pie<Activity>().value(d => 
            chartType === "processedItems" ? d.processedItems ?? 0 : d.busy
        );
        
        const dataReady = pie(activities);

        const arc = d3.arc<d3.PieArcDatum<Activity>>()
            .innerRadius(0)
            .outerRadius(radius);

        chartGroup.selectAll('path')
            .data(dataReady)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.id));

        const legendGroup = svg.append('g')
            .attr('transform', `translate(${width + 20}, 50)`); 

        legendGroup.selectAll('rect')
            .data(activities)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (_, i) => i * 20) 
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => color(d.id));

        legendGroup.selectAll('text')
            .data(activities)
            .enter()
            .append('text')
            .attr('x', 16) 
            .attr('y', (_, i) => i * 20 + 10) 
            .style('font-size', '10px')
            .text(d =>{
                console.log("STAMPA DI D"); 
                console.log(d); 
                    if (chartType === "activity") {
                        return `${d.name}: ${d.busy} minutes`;
                    } else if (chartType === "processedItems") {
                        return `${d.name}: ${d.processedItems ?? 0} products`;
                    } else {
                        // Default: just name
                        return d.name;
                    }
                }
            );
    }, [activities, chartType, width, height]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
            }}
        >
            <div ref={ref} id="piechart" />
        </div>
    );
};

export default PieChart;
