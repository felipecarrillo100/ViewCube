import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import "./ViewCube.css";

/** Public API available through ref */
export interface ViewCubeHandle {
    setRotation: (xDeg: number, yDeg: number) => void;
    reset: () => void;
    getRotation: () => { x: number; y: number };
}

export interface ViewCubeProps {
    size?: number;
    transitionMs?: number;
    onRotationChange?: (rotation: { x: number; y: number }) => void;
    onCornerClick?: (cornerClass: string) => void;
    initialRotation?: { x: number; y: number };
}

const FACE_LABELS = ["Front", "Back", "Left", "Right", "Top", "Bottom"] as const;

const FACE_TARGETS: Record<(typeof FACE_LABELS)[number], { x: number; y: number }> = {
    Front: { x: 0, y: -0 },
    Back: { x: 0, y: -180 },
    Left: { x: 0, y: 90 },
    Right: { x: 0, y: -90 },
    Top: { x: -90, y: 0 },
    Bottom: { x: 90, y: 0 },
};

// CORNERS: each face lists 4 corner classes in this order:
// index 0 = top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left
const FACE_CORNERS: Record<(typeof FACE_LABELS)[number], string[]> = {
    Front: ["lft", "frt", "frm", "lfm"],
    Back: ["brt", "blt", "blm", "brm"],
    Left: ["blt", "lft", "lfm", "blm"],
    Right: ["frt", "brt", "brm", "frm"],
    // ==== FIXED: Top face must be vertically inverted because of rotateX(90deg) ====
    // original (visual) order when looking at top face as we draw it is inverted,
    // so reverse the logical corner list so css top/bottom match the intended corners.
    Top: ["blt", "brt", "frt", "lft"],
    Bottom: ["lfm", "frm", "brm", "blm"],
};

const mod = (n: number, m: number) => ((n % m) + m) % m;
function shortestSignedAngleDiff(current: number, target: number) {
    return mod(target - current + 180, 360) - 180;
}
function clampPitch(x: number) {
    return Math.max(-90, Math.min(90, x));
}

export const ViewCube = forwardRef<ViewCubeHandle, ViewCubeProps>(
    (
        {
            size = 200,
            transitionMs = 400,
            onRotationChange,
            onCornerClick,
            initialRotation = { x: -20, y: -30 },
        },
        ref
    ) => {
        const [rotation, setRotation] = useState(initialRotation);
        const rotationRef = useRef(rotation);
        const initialRotationRef = useRef(initialRotation);

        const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);

        useEffect(() => {
            rotationRef.current = rotation;
        }, [rotation]);

        const isDragging = useRef(false);
        const dragButton = useRef<number | null>(null);
        const lastPos = useRef({ x: 0, y: 0 });

        const [isAnimating, setIsAnimating] = useState(false);
        const cancelAnimationTimer = useRef<number | null>(null);

        const setCubeRotation = (newRotation: { x: number; y: number }) => {
            rotationRef.current = newRotation;
            setRotation(newRotation);
            onRotationChange?.(newRotation);
        };

        useImperativeHandle(ref, () => ({
            setRotation: (xDeg: number, yDeg: number) => {
                const cur = rotationRef.current;
                const targetPitch = clampPitch(xDeg);
                const diffY = shortestSignedAngleDiff(cur.y, yDeg);
                const finalY = cur.y + diffY;
                animateTo(finalY, targetPitch);
            },
            reset: () => {
                const init = initialRotationRef.current;
                animateTo(init.y, init.x);
            },
            getRotation: () => rotationRef.current,
        }));

        const animateTo = (targetY: number, targetX: number) => {
            const finalX = clampPitch(targetX);
            const cur = rotationRef.current;
            const dy = shortestSignedAngleDiff(cur.y, targetY);
            const newY = cur.y + dy;
            const dx = finalX - cur.x;
            const newX = clampPitch(cur.x + dx);

            if (cancelAnimationTimer.current) {
                window.clearTimeout(cancelAnimationTimer.current);
                cancelAnimationTimer.current = null;
            }
            setIsAnimating(true);
            setCubeRotation({ x: newX, y: newY });

            cancelAnimationTimer.current = window.setTimeout(() => {
                setIsAnimating(false);
                cancelAnimationTimer.current = null;
            }, transitionMs + 20);
        };

        /** ---- Mouse + Touch handlers ---- */
        const handleContainerMouseDown = (e: React.MouseEvent) => {
            dragButton.current = e.button;
            lastPos.current = { x: e.clientX, y: e.clientY };

            if (e.button === 2) {
                isDragging.current = true;
                setIsAnimating(false);
            }
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || dragButton.current !== 2) return;
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };

            setCubeRotation({
                x: clampPitch(rotationRef.current.x - dy * 0.5),
                y: rotationRef.current.y + dx * 0.5,
            });
        };

        const handleGlobalMouseUp = () => {
            isDragging.current = false;
            dragButton.current = null;
        };

        const handleTouchStart: React.TouchEventHandler = (e) => {
            if (e.touches.length === 2) {
                const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                lastPos.current = { x, y };
                dragButton.current = 2;
                isDragging.current = true;
                setIsAnimating(false);
            } else {
                dragButton.current = 0;
            }
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!isDragging.current || dragButton.current !== 2 || e.touches.length !== 2) return;
            const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = x - lastPos.current.x;
            const dy = y - lastPos.current.y;
            lastPos.current = { x, y };

            setCubeRotation({
                x: clampPitch(rotationRef.current.x - dy * 0.5),
                y: rotationRef.current.y + dx * 0.5,
            });
        };

        const handleGlobalTouchEnd = () => {
            isDragging.current = false;
            dragButton.current = null;
        };

        useEffect(() => {
            window.addEventListener("mousemove", handleGlobalMouseMove);
            window.addEventListener("mouseup", handleGlobalMouseUp);
            window.addEventListener("touchmove", handleGlobalTouchMove);
            window.addEventListener("touchend", handleGlobalTouchEnd);
            return () => {
                window.removeEventListener("mousemove", handleGlobalMouseMove);
                window.removeEventListener("mouseup", handleGlobalMouseUp);
                window.removeEventListener("touchmove", handleGlobalTouchMove);
                window.removeEventListener("touchend", handleGlobalTouchEnd);
                if (cancelAnimationTimer.current) {
                    window.clearTimeout(cancelAnimationTimer.current);
                }
            };
        }, []);

        const handleFaceClick = (face: (typeof FACE_LABELS)[number]) => {
            const base = FACE_TARGETS[face];
            const cur = rotationRef.current;
            const dy = shortestSignedAngleDiff(cur.y, base.y);
            const targetY = cur.y + dy;
            const targetX = clampPitch(base.x);
            animateTo(targetY, targetX);
        };

        const half = size / 2;
        const faceTransforms = [
            `rotateY(0deg) translateZ(${half}px)`,   // Front
            `rotateY(180deg) translateZ(${half}px)`, // Back
            `rotateY(-90deg) translateZ(${half}px)`, // Left
            `rotateY(90deg) translateZ(${half}px)`,  // Right
            `rotateX(90deg) translateZ(${half}px)`,  // Top
            `rotateX(-90deg) translateZ(${half}px)`, // Bottom
        ];

        const transitionStyle = isAnimating
            ? { transition: `transform ${transitionMs}ms cubic-bezier(.22,.9,.2,1)` }
            : { transition: "none" };

        return (
            <div
                className={`viewcube-container`}
                style={{ width: size, height: size }}
                onMouseDown={handleContainerMouseDown}
                onContextMenu={(e) => e.preventDefault()}
                onTouchStart={handleTouchStart}
            >
                <div
                    className="viewcube-scene"
                    style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, ...transitionStyle }}
                >
                    {FACE_LABELS.map((label, i) => (
                        <div
                            key={label}
                            className="viewcube-face"
                            style={{ transform: faceTransforms[i] }}
                            onClick={() => handleFaceClick(label)}
                        >
                            {label}
                            {/* Render 4 corner squares for this face */}
                            {FACE_CORNERS[label].map((cornerClass, j) => (
                                <div
                                    key={j}
                                    className={`viewcube-corner ${cornerClass} ${hoveredCorner === cornerClass ? "hover" : ""}`}
                                    onMouseEnter={() => setHoveredCorner(cornerClass)}
                                    onMouseLeave={() => setHoveredCorner(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCornerClick?.(cornerClass);
                                    }}
                                    style={{
                                        width: `${size * 0.05}px`,
                                        height: `${size * 0.05}px`,
                                        ...cornerPositionStyle(j),
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

ViewCube.displayName = "ViewCube";
export default ViewCube;

/** Position corner squares inside face (0=tl,1=tr,2=br,3=bl) */
function cornerPositionStyle(index: number): React.CSSProperties {
    switch (index) {
        case 0: return { top: 0, left: 0, position: "absolute" };     // top-left
        case 1: return { top: 0, right: 0, position: "absolute" };    // top-right
        case 2: return { bottom: 0, right: 0, position: "absolute" }; // bottom-right
        case 3: return { bottom: 0, left: 0, position: "absolute" };  // bottom-left
        default: return {};
    }
}
