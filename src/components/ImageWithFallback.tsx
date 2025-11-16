"use client";

import React, {useState} from "react";
import Image, {StaticImageData} from "next/image";

const ERROR_IMG_SRC = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi" +
        "8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi" +
        "BvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PS" +
        "IxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMi" +
        "AzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

interface ImageWithFallbackProps {
    src : string | StaticImageData;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}

export function ImageWithFallback({
    src,
    alt,
    style,
    className,
    width,
    height,
    ...rest
} : ImageWithFallbackProps) {
    const [didError,
        setDidError] = useState(false);

    const handleError = () => setDidError(true);

    return didError
        ? (
            <div
                className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
                style={style}>
                <div className="flex items-center justify-center w-full h-full">
                    <Image
                        src={ERROR_IMG_SRC}
                        alt="Error loading image"
                        width={width || 88}
                        height={height || 88}
                        {...rest}/>
                </div>
            </div>
        )
        : (<Image
            src={src}
            alt={alt || ""}
            className={className}
            style={style}
            width={width || 400}
            height={height || 300}
            onError={handleError}
            {...rest}/>);
}
