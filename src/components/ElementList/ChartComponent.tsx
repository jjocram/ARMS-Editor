import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  idealTime: number;
  realTime: number;
  title: string; 
}

const D3Chart: React.FC<D3ChartProps> = ({ idealTime, realTime, title }) => {
    useEffect(() => {
        d3.select('#d3chart').html('');

        const margin = { top: 30, right: 2, bottom: 30, left: 10 }; // Aumentato top per spazio titolo
        const width = 350;
        const height = 100;

        const svg = d3.select('#d3chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

        // Aggiunta del titolo
        svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10) // Posizione sopra l'asse X, all'interno del margine superiore
        .attr('text-anchor', 'middle') // Centra il testo rispetto alle coordinate x
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(title);

        const x = d3.scaleLinear()
        .domain([0, Math.max(idealTime, realTime)])
        .range([0, width * 0.6]);

        const times = [
            { label: 'Ideal time', time: `${idealTime}` },
            { label: 'Real time', time: `${realTime}` }
        ];

        svg.selectAll('.bar')
        .data(times)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', (d, i) => i * 30 + 20) // Aggiusta la posizione delle barre per il titolo
        .attr('width', d => x(parseFloat(d.time)))
        .attr('height', 25)
        .attr('fill', (d, i) => i % 2 ? 'steelblue' : 'green');

        svg.selectAll('.label')
        .data(times)
        .enter()
        .append('text')
        .attr('x', d => x(parseFloat(d.time)) + 3)
        .attr('y', (d, i) => i * 30 + 35) // Aggiusta la posizione delle label per il titolo
        .attr('dy', '.35em')
        .attr('fill', 'black')
        .text(d => `${d.label}: ${d.time}`);
    }, [idealTime, realTime, title]);

  return <div id="d3chart"></div>;
};

export default D3Chart;
