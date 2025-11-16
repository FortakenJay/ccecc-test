"use client";

import {useState, useEffect, useCallback} from "react";
import {Button} from "./button";
import {cn} from "./utils";
import {Alert, AlertDescription} from "./alert";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCheckCircle, 
  faExclamationCircle, 
  faCircleInfo, 
  faTriangleExclamation 
} from '@fortawesome/free-solid-svg-icons';

interface ToastProps {
    message : string;
    type?: "success" | "error" | "warning" | "info";
    duration?: number; // Duration in milliseconds
    onClose?: () => void;
    showCloseButton?: boolean;
    position?: "top" | "bottom";
    className?: string;
}

const toastIcons = {
    success: faCheckCircle,
    error: faExclamationCircle,
    warning: faTriangleExclamation,
    info: faCircleInfo
};

const toastStyles = {
    success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-" +
            "900/20 dark:text-green-400",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dar" +
            "k:text-red-400",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-ye" +
            "llow-900/20 dark:text-yellow-400",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/2" +
            "0 dark:text-blue-400"
};

export function Toast({
    message,
    type = "info",
    duration = 3000,
    onClose,
    showCloseButton = true,
    position = "top",
    className
} : ToastProps) {
    const [isVisible,
        setIsVisible] = useState(true);
    const [isAnimating,
        setIsAnimating] = useState(false);

    const handleClose = useCallback(() => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onClose
                ?.();
        }, 300); // Wait for exit animation
    }, [onClose]);

    useEffect(() => {
        const animationFrame = requestAnimationFrame(() => {
            setIsAnimating(true);
        });

        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animationFrame);
        };
    }, [duration, handleClose]);

    if (!isVisible) 
        return null;
    
    const Icon = toastIcons[type];

    return (
        <div
            className={cn("fixed left-0 right-0 z-50 mx-auto max-w-md px-4 transition-all duration-300 ease" +
                "-in-out",
        position === "top"
            ? "top-4"
            : "bottom-4", isAnimating
            ? "translate-y-0 opacity-100"
            : position === "top"
                ? "-translate-y-full opacity-0"
                : "translate-y-full opacity-0")}>
            <Alert className={cn(toastStyles[type], "shadow-lg", className)}>
                <FontAwesomeIcon icon={Icon} className="h-4 w-4"/>
                <AlertDescription className="flex items-center justify-between">
                    <span>{message}</span>
                    {showCloseButton && (
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="ml-2 h-6 w-6 opacity-70 hover:opacity-100">
                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3"/>
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        </div>
    );
}

// Hook to manage toast state
export function useToast() {
    const [toast,
        setToast] = useState < {
        message: string;
        type: "success" | "error" | "warning" | "info";
        duration?: number;
    } | null > (null);

    const showToast = (message : string, type : "success" | "error" | "warning" | "info" = "info", duration = 3000) => {
        setToast({message, type, duration});
    };

    const hideToast = () => {
        setToast(null);
    };

    return {toast, showToast, hideToast};
}