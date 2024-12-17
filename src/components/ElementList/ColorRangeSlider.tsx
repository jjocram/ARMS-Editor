import React, { useState } from "react";
import "./ColorRangeSlider.css";

interface ColorRangeSliderProps {
    initialRanges: { green: number; yellow: number; red: number };
    onChange: (ranges: { green: number; yellow: number; red: number }) => void;
}

const ColorRangeSlider: React.FC<ColorRangeSliderProps> = ({ initialRanges, onChange }) => {
    const [ranges, setRanges] = useState(initialRanges);

    const handleChange = (color: string, value: number) => {
        const updatedRanges = { ...ranges, [color]: value };
        setRanges(updatedRanges);
        onChange(updatedRanges);
    };

    return (
        <div className="color-range-slider">
            <div className="slider-row">
                <label>Verde ≤</label>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={ranges.green}
                    onChange={(e) => handleChange("green", Number(e.target.value))}
                />
                <span>{ranges.green}%</span>
            </div>
            <div className="slider-row">
                <label>Giallo ≤</label>
                <input
                    type="range"
                    min={ranges.green + 1}
                    max={100}
                    value={ranges.yellow}
                    onChange={(e) => handleChange("yellow", Number(e.target.value))}
                />
                <span>{ranges.yellow}%</span>
            </div>
            <div className="slider-row">
                <label>Rosso ≤</label>
                <input
                    type="range"
                    min={ranges.yellow + 1}
                    max={100}
                    value={ranges.red}
                    onChange={(e) => handleChange("red", Number(e.target.value))}
                />
                <span>{ranges.red}%</span>
            </div>
        </div>
    );
};

export default ColorRangeSlider;
