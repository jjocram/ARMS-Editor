import React, { useState, useEffect } from "react";
import { RangeSlider } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import "./ColorRangeSlider.css";

interface ColorRangeSliderProps {
    initialValues: {
        availability: [number, number];
        queueLength: [number, number];
    };
    onChange: (ranges: {
        availability: [number, number];
        queueLength: [number, number];
    }) => void;
}

const ColorRangeSlider: React.FC<ColorRangeSliderProps> = ({ initialValues, onChange }) => {
    const [values, setValues] = useState(initialValues);

    useEffect(() => {
        const savedValues = localStorage.getItem("colorThresholds");
        if (savedValues) {
            setValues(JSON.parse(savedValues));
        }
    }, []);

    useEffect(() => {
        // Imposta le variabili CSS per Availability
        document.documentElement.style.setProperty("--availability-left", `${values.availability[0] * 100}%`);
        document.documentElement.style.setProperty("--availability-right", `${values.availability[1] * 100}%`);
    
        // Imposta le variabili CSS per Queue Length
        document.documentElement.style.setProperty("--queue-left", `${values.queueLength[0] * 100}%`);
        document.documentElement.style.setProperty("--queue-right", `${values.queueLength[1] * 100}%`);
    }, [values]);
    

    const handleValueChange = (metric: "availability" | "queueLength", newValue: [number, number]) => {
        // Impedisce che il pallino sinistro superi quello destro
        if (newValue[0] >= newValue[1]) {
            return;
        }
    
        const updatedValues = { ...values, [metric]: newValue };
        setValues(updatedValues);
        localStorage.setItem("colorThresholds", JSON.stringify(updatedValues));
        onChange(updatedValues);
    
        // Aggiorna le variabili CSS per il range selezionato
        if (metric === "availability") {
            document.documentElement.style.setProperty("--availability-left", `${newValue[0] * 100}%`);
            document.documentElement.style.setProperty("--availability-right", `${newValue[1] * 100}%`);
        } else {
            document.documentElement.style.setProperty("--queue-left", `${newValue[0] * 100}%`);
            document.documentElement.style.setProperty("--queue-right", `${newValue[1] * 100}%`);
        }
    };

    return (
        <div className="color-range-slider">
            {/* Slider per Availability */}
            <div className="slider-row availability-slider">
                <label className="slider-label">Availability</label>
                <RangeSlider
                    value={values.availability}  // Mantiene il valore controllato
                    min={0}
                    max={1}
                    step={0.01}
                    progress
                    onChange={(value) => handleValueChange("availability", value as [number, number])}
                />

                <span>{`${values.availability[0].toFixed(2)} - ${values.availability[1].toFixed(2)}`}</span>
            </div>

            {/* Slider per Queue Length */}
            <div className="slider-row queue-length-slider">
                <label className="slider-label">Queue Length</label>
                <RangeSlider
                    value={values.queueLength}
                    min={0}
                    max={1}
                    step={0.01}
                    progress
                    onChange={(value) => handleValueChange("queueLength", value as [number, number])}
                />
                <span>{`${values.queueLength[0].toFixed(2)} - ${values.queueLength[1].toFixed(2)}`}</span>
            </div>
        </div>
    );
};

export default ColorRangeSlider;
