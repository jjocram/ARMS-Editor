import React, { useState } from "react";
import "./ColorRangeSlider.css";

interface ColorRangeSliderProps {
    initialValues: {
        green: number;
        yellow: number;
    };
    onChange: (ranges: {
        green: number;
        yellow: number;
        red: number;
    }) => void;
}

const ColorRangeSlider: React.FC<ColorRangeSliderProps> = ({ initialValues, onChange }) => {
    const [values, setValues] = useState(initialValues);

    const handleValueChange = (color: keyof typeof values, newValue: number) => {
        const updatedValues = { ...values, [color]: newValue };

        // Imposta i vincoli per i valori
        if (color === "green" && updatedValues.green < updatedValues.yellow) {
            updatedValues.green = updatedValues.yellow;
        }

        if (color === "yellow" && updatedValues.yellow > updatedValues.green) {
            updatedValues.yellow = updatedValues.green;
        }

        setValues(updatedValues);

        // Calcola il range del rosso
        const ranges = {
            green: updatedValues.green,
            yellow: updatedValues.yellow,
            red: 0, // I valori sotto il giallo saranno rossi
        };

        onChange(ranges);
    };

    return (
        <div className="color-range-slider">
            {/* Verde */}
            <div className="slider-row">
                <label>Verde:</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={values.green}
                        onChange={(e) =>
                            handleValueChange("green", parseFloat(e.target.value))
                        }
                        className="slider-thumb"
                    />
                </div>
                <span>{values.green.toFixed(2)}</span>
            </div>

            {/* Giallo */}
            <div className="slider-row">
                <label>Giallo:</label>
                <div className="slider-container">
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={values.yellow}
                        onChange={(e) =>
                            handleValueChange("yellow", parseFloat(e.target.value))
                        }
                        className="slider-thumb"
                    />
                </div>
                <span>{values.yellow.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default ColorRangeSlider;
