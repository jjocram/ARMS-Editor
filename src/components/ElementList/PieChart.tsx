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
  chartType: 'executor' | 'activity' | "processedItems"; // Nuova prop per determinare il titolo
  width?: number;
  height?: number;
}

const PieChart: React.FC<PieChartProps> = ({ activities, chartType, width = 150, height = 120 }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activities || activities.length === 0) {
            return; // Evita di eseguire il codice se non ci sono attività
        }

        const container = d3.select(ref.current);
        container.selectAll("*").remove();
        container.html('');

        const radius = Math.min(width, height) / 2;
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Crea l'SVG
        const svg = container.append('svg')
            .attr('width', width + 150) // Spazio extra per la legenda
            .attr('height', height + 70) // Altezza totale con spazio extra
            .style('display', 'block')
            .style('margin', '0 auto');

        // Determina il titolo in base al tipo di grafico
        const chartTitle = chartType === "executor"
            ? "Grafico dei tempi delle Attività"
            : chartType === "activity"
            ? "Grafico degli esecutori coinvolti"
            : "Prodotti lavorati per esecutore";

        // Aggiungi il titolo con maggiore spazio
        svg.append('text')
            .attr('x', (width + 100) / 2)
            .attr('y', 20) // Maggiore spazio per il titolo
            .attr('text-anchor', 'middle') // Centra il testo orizzontalmente
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text(chartTitle);

        // Sposta il gruppo del grafico più in basso
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${(height / 2) + 30})`); // Offset per grafico più basso

        // Prepara la struttura dei dati per il grafico a torta
        const pie = d3.pie<Activity>().value(d => 
            chartType === "processedItems" ? d.processedItems ?? 0 : d.busy
        );
        

        const dataReady = pie(activities);

        // Definisci l'arco
        const arc = d3.arc<d3.PieArcDatum<Activity>>()
            .innerRadius(0)
            .outerRadius(radius);

        // Disegna gli archi
        chartGroup.selectAll('path')
            .data(dataReady)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.id));

        // Legenda
        const legendGroup = svg.append('g')
            .attr('transform', `translate(${width + 20}, 50)`); // Posiziona la legenda a destra

        legendGroup.selectAll('rect')
            .data(activities)
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (_, i) => i * 20) // Posizione verticale per ogni elemento
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => color(d.id));

        legendGroup.selectAll('text')
            .data(activities)
            .enter()
            .append('text')
            .attr('x', 16) // Spostato a destra rispetto al rettangolo
            .attr('y', (_, i) => i * 20 + 10) // Allineato verticalmente con il rettangolo
            .style('font-size', '10px')
            .text(d => 
                chartType === "processedItems" 
                    ? `${d.processedItems ?? 0}` // Mostra solo il numero di prodotti processati
                    : d.name // Per gli altri grafici, mostra il nome
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
