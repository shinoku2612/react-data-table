import { useEffect } from "react";

const DEFAULT_BASE_WIDTH = 1280;
const DEFAULT_MIN_SCALE = 0.5;
const DEFAULT_MAX_SCALE = 7.5;
const ESTIMATED_MIN_DEVTOOLS_THRESHOLD = 100;
const checkDevToolsDockedSide = () => {
    return (
        window.outerWidth >
        window.innerWidth * window.devicePixelRatio -
            ESTIMATED_MIN_DEVTOOLS_THRESHOLD
    );
};

const useViewportScale = (
    baseWidth: number = DEFAULT_BASE_WIDTH,
    minScale: number = DEFAULT_MIN_SCALE,
    maxScale: number = DEFAULT_MAX_SCALE
) => {
    useEffect(() => {
        const controller = new AbortController();

        const handleResize = () => {
            // Calculate the initial scale when DevTools is docked on left or right
            const approximateScaleWidth =
                (window.innerWidth * window.devicePixelRatio) /
                window.outerWidth;
            const approximateScaleHeight =
                (window.innerHeight * window.devicePixelRatio) /
                window.outerHeight;
            const approximateDefaultScale = Math.max(
                approximateScaleWidth,
                approximateScaleHeight
            );

            // Check if DevTools is docked on left or right
            const isDevToolsDockedSide = checkDevToolsDockedSide();

            // If DevTools is docked on side (left or right)
            // use dockedViewportWidth
            const dockedViewportWidth =
                (window.innerWidth * window.devicePixelRatio) /
                approximateDefaultScale;

            // Otherwise, use window.outerWidth
            const viewportWidth = isDevToolsDockedSide
                ? dockedViewportWidth
                : window.outerWidth;

            const rawScale = viewportWidth / baseWidth;

            // Declare and use Math.clamp function if needed
            /* 
                Math.clamp = function (min: number, base: number, max: number): number {
                    return Math.max(Math.min(max, base), min);
                };
			*/
            const documentScale = Math.max(
                minScale,
                Math.min(maxScale, rawScale)
            );

            // Use --scale property to define root font-size;
            // after that, everything using `rem` unit will scale according to the ratio.
            /* 
                html {
                    ...other styles
                    font-size: calc(100% * var(--scale, 1));
                }
            */
            document.documentElement.style.setProperty(
                "--scale",
                documentScale.toString()
            );
        };

        // Initial call
        handleResize();

        window.addEventListener("resize", handleResize, {
            signal: controller.signal,
        });

        return () => {
            controller.abort();
        };
    }, [baseWidth, minScale, maxScale]);
};

export default useViewportScale;
