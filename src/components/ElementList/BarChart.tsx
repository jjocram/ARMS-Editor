import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BarChartData {
    id: string;
    real: number; // Tempo reale
    ideal: number; // Tempo ideale
}

interface BarChartProps {
    data: BarChartData[]; // Dati per un'unica attività
    title: string; // Titolo del grafico
}

const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data || data.length === 0) {
            return; // Evita di eseguire il codice se non ci sono dati
        }

        // Pulisci il contenuto precedente
        const container = d3.select(ref.current);
        container.selectAll("*").remove();

        // Dimensioni del grafico
        const margin = { top: 20, right: 50, bottom: 5, left: 50 };
        const width = 300 - margin.left - margin.right;
        const height = 50; // Altezza fissa per una sola attività

        // Crea l'elemento SVG
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Aggiungi il titolo sopra il grafico
        svg.append("text")
            .attr("x", (width + margin.left) / 2) // Centra il titolo
            .attr("y", margin.top / 2)
            .attr("text-anchor", "center") // Allinea al centro
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(title);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scale
        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.ideal, d.real)) || 0])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.id))
            .range([0, height])
            .padding(0.1);

        // Barre per il tempo ideale
        chart.selectAll(".bar-ideal")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-ideal")
            .attr("y", d => y(d.id)!)
            .attr("height", y.bandwidth() / 2)
            .attr("x", 0)
            .attr("width", d => x(d.ideal)!)
            .style("fill", "steelblue");

        // Barre per il tempo reale
        chart.selectAll(".bar-real")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar-real")
            .attr("y", d => y(d.id)! + y.bandwidth() / 2)
            .attr("height", y.bandwidth() / 2)
            .attr("x", 0)
            .attr("width", d => x(d.real)!)
            .style("fill", "orange");

        // Etichette accanto alle barre
        chart.selectAll(".label-ideal")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label-ideal")
            .attr("x", d => x(d.ideal) + 5) // Incrementa lo spazio accanto alla barra ideale
            .attr("y", d => y(d.id)! + y.bandwidth() / 4 + 5)
            .text(d => `${d.ideal.toFixed(1)} min`)
            .style("font-size", "10px")
            .style("fill", "black");

        chart.selectAll(".label-real")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "label-real")
            .attr("x", d => x(d.real) + 5) // Incrementa lo spazio accanto alla barra reale
            .attr("y", d => y(d.id)! + (3 * y.bandwidth()) / 4 + 5)
            .text(d => `${d.real.toFixed(1)} min`)
            .style("font-size", "10px")
            .style("fill", "black");

    }, [data, title]);

    return <div ref={ref} style={{ marginBottom: '20px' }} />;
};

export default BarChart;
