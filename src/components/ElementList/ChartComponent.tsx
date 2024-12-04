import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  data: { id: string; busy: number; idle: number }[];
  selectedMetric: 'busy' | 'idle';
}

const D3Chart: React.FC<D3ChartProps> = ({ data, selectedMetric }) => {
  useEffect(() => {
    d3.select('#d3chart').html('');  // Pulisce il contenuto precedente

    const margin = { top: 20, right: 30, bottom: 40, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select('#d3chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scala per l'asse X (valore busy o idle)
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => (selectedMetric === 'busy' ? d.busy : d.idle)) ?? 0]) // Fallback a 0 se undefined
      .nice()
      .range([0, width]);

    // Scala per l'asse Y (nomi degli esecutori)
    const y = d3.scaleBand().domain(data.map(d => d.id)).range([0, height]).padding(0.1);

    // Aggiungi le barre orizzontali
    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.id)!)
      .attr('width', d => x(selectedMetric === 'busy' ? d.busy : d.idle))
      .attr('height', y.bandwidth())
      .attr('fill', 'steelblue');

    // Aggiungi le etichette con le percentuali sopra le barre
    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(selectedMetric === 'busy' ? d.busy : d.idle) + 5)  
      .attr('y', d => y(d.id)! + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'black')
      .attr('font-size', '12px')
      .text(d => {
        // Calcolare la percentuale
        const metricValue = selectedMetric === 'busy' ? d.busy : d.idle;
        const totalTime = 252000;  // valore di totalTime 
        return `${((metricValue / totalTime) * 100).toFixed(1)}%`;
      });

    // Aggiungi l'asse X
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Aggiungi l'asse Y
    svg.append('g').call(d3.axisLeft(y));

  }, [data, selectedMetric]);

  return <div id="d3chart"></div>;
};

export default D3Chart;
