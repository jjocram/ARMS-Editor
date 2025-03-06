import React, {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import "./ColorRangeSlider.css";
import classnames from "classnames";
import {ColorRange} from "../../../ExecutorsColorRanges.ts";
import {Popover, Whisper} from "rsuite";


interface ColorRangeSliderProps {
    ranges: ColorRange[]
    onChange: (values: number[], index: number) => void;
    onChangeColor: (newColor: string, index: number) => void;
}

export function ColorRangeSlider({ranges, onChange, onChangeColor}: ColorRangeSliderProps) {
    const min = 0;
    const max = 100;

    // Util state
    const [isDragging, setIsDragging] = useState(false);

    // Generate initial values based on ranges
    const [values, setValues] = useState(Array.from(new Set(ranges.flatMap((r) => [r.min * 100, r.max * 100]).filter((v) => v !== 0 && v !== 100))));

    const rangeRefs = useRef<HTMLDivElement[]>([]); // Store refs for multiple ranges

    // Convert to percentage
    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    // Update range bar styles dynamically
    useEffect(() => {
        values.forEach((_val, index) => {
            if (rangeRefs.current[index]) {
                const leftPercent = getPercent(values[index - 1] ?? min);
                const rightPercent = getPercent(values[index + 1] ?? max);
                rangeRefs.current[index].style.left = `${leftPercent}%`;
                rangeRefs.current[index].style.width = `${rightPercent - leftPercent}%`;
            }
        });
    }, [values, getPercent]);

    // Handle input changes
    const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
        setIsDragging(true);
        const newValue = +event.target.value;
        const updatedValues = [...values];

        // Ensure new value stays within bounds and does not overlap adjacent sliders
        if (index > 0 && newValue <= values[index - 1]) return;
        if (index < values.length - 1 && newValue >= values[index + 1]) return;

        updatedValues[index] = newValue;
        setValues(updatedValues);
        onChange(updatedValues.map((value) => value / 100), index);
    };

    function handleMouseUp(event: React.MouseEvent<HTMLInputElement>) {
        if (!isDragging) {
            handleSliderClick(event);
        }

        setIsDragging(false);
    }

    function handleSliderClick(event: React.MouseEvent<HTMLInputElement>) {
        console.log(event);
    }

    return (
        <div className="container">
            {values.map((val, index) => (
                <div key={index} style={{position: "relative"}}>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={val}
                        onChange={(event) => handleChange(index, event)}
                        className={classnames("thumb", {
                            "thumb--zindex-3": index % 2 === 0,
                            "thumb--zindex-4": index % 2 !== 0,
                        })}
                        onMouseUp={(event) => handleMouseUp(event)}
                    />
                    <div className="slider__value" style={{left: `${getPercent(val)}%`}}>
                        {val / 100}
                    </div>
                </div>
            ))}

            <div className="slider">
                <div className="slider__track"></div>
                {[min, ...values, max].map((_, index, arr) => {
                    if (index === arr.length - 1) return null; // Avoid out-of-bounds error
                    const leftPercent = getPercent(arr[index]);
                    const rightPercent = getPercent(arr[index + 1]);
                    const speaker = (
                        <Popover title="Change color">
                            <input
                                type="color"
                                value={ranges[index].color}
                                onChange={(event) => onChangeColor(event.target.value, index)}
                            />
                        </Popover>
                    );
                    return (
                        <Whisper key={index} speaker={speaker} trigger="click" placement="top">
                            <div
                                ref={(el) => (rangeRefs.current[index] = el!)}
                                className="slider__range"
                                style={{
                                    left: `${leftPercent}%`,
                                    width: `${rightPercent - leftPercent}%`,
                                    backgroundColor: ranges[index].color,
                                }}
                            />
                        </Whisper>
                    )
                })}
                <div className="slider__left-value">{min / 100}</div>

                <div className="slider__right-value">{max / 100}</div>
            </div>
        </div>
    );
};