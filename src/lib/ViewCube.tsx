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
    /** Smoothly rotate to (xDeg, yDeg) — x = pitch, y = yaw (degrees) */
    setRotation: (xDeg: number, yDeg: number) => void;
    /** Reset to default pose */
    reset: () => void;
}

export interface ViewCubeProps {
    size?: number;
    transitionMs?: number;
}

const FACE_LABELS = ["Front", "Back", "Left", "Right", "Top", "Bottom"] as const;

/**
 * Face target "base" angles (these are the face transforms used in the DOM).
 * To bring a face to the camera we set scene rotation such that:
 *    sceneRotation + faceAngle = 0  (mod 360)
 * so targetSceneAngle = -faceAngle.
 *
 * Note: faceAngle for left/right are Y-rotations; for top/bottom they are X-rotations.
 */
const FACE_TARGETS: Record<
    typeof FACE_LABELS[number],
    { x: number; y: number }
> = {
    Front: { x: 0, y: -0 }, // rotateY(0) => targetY = 0
    Back: { x: 0, y: -180 }, // rotateY(180) => targetY = -180
    Left: { x: 0, y: -(-90) /* = 90 */ }, // face was rotateY(-90)
    Right: { x: 0, y: -(90) /* = -90 */ }, // face was rotateY(90)
    Top: { x: -90, y: 0 }, // face rotateX(90) => targetX = -90
    Bottom: { x: 90, y: 0 }, // face rotateX(-90) => targetX = 90
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** minimal signed angular difference in degrees from `current` to `target` */
function shortestSignedAngleDiff(current: number, target: number) {
    // returns value in (-180, 180]
    return mod(target - current + 180, 360) - 180;
}

/** Clamp pitch to keep top never upside down */
function clampPitch(x: number) {
    return Math.max(-90, Math.min(90, x));
}

export const ViewCube = forwardRef<ViewCubeHandle, ViewCubeProps>(
    ({ size = 200, transitionMs = 400 }, ref) => {
        // rotation state (deg). x = pitch (rotateX), y = yaw (rotateY)
        const [rotation, setRotation] = useState({ x: -20, y: -30 });
        const rotationRef = useRef(rotation);
        useEffect(() => {
            rotationRef.current = rotation;
        }, [rotation]);

        // interaction flags
        const isDragging = useRef(false);
        const dragButton = useRef<number | null>(null); // which mouse button started the press (0,1,2)
        const lastPos = useRef({ x: 0, y: 0 });

        // controls whether CSS transition is applied. while dragging -> no transition.
        const [isAnimating, setIsAnimating] = useState(false);
        const cancelAnimationTimer = useRef<number | null>(null);

        useImperativeHandle(ref, () => ({
            setRotation: (xDeg: number, yDeg: number) => {
                // animate to requested rotation using shortest yaw route
                const cur = rotationRef.current;
                const targetPitch = clampPitch(xDeg);
                const diffY = shortestSignedAngleDiff(cur.y, yDeg);
                const finalY = cur.y + diffY;
                // animate
                animateTo(finalY, targetPitch);
            },
            reset: () => {
                animateTo(-30, -20); // initial/default pose
            },
        }));

        // perform an animated "move to" (uses CSS transition). If called while dragging,
        // it will be aborted and apply immediately once drag ends.
        const animateTo = (targetY: number, targetX: number) => {
            // ensure final X is clamped
            const finalX = clampPitch(targetX);

            // compute shortest yaw target (we already pass targetY maybe in -180..180)
            const cur = rotationRef.current;
            const dy = shortestSignedAngleDiff(cur.y, targetY);
            const newY = cur.y + dy;

            // For pitch (X) we don't wrap; simply move to finalX (the values are within [-90,90])
            const dx = finalX - cur.x;
            const newX = clampPitch(cur.x + dx);

            // start animation (enable transition)
            if (cancelAnimationTimer.current) {
                window.clearTimeout(cancelAnimationTimer.current);
                cancelAnimationTimer.current = null;
            }
            setIsAnimating(true);
            setRotation({ x: newX, y: newY });
            // stop animation after transition
            cancelAnimationTimer.current = window.setTimeout(() => {
                setIsAnimating(false);
                cancelAnimationTimer.current = null;
            }, transitionMs + 20);
        };

        /** ---- Mouse handlers ---- */
        const handleContainerMouseDown = (e: React.MouseEvent) => {
            dragButton.current = e.button;
            lastPos.current = { x: e.clientX, y: e.clientY };

            // right-button drag -> enable dragging
            if (e.button === 2) {
                isDragging.current = true;
                setIsAnimating(false); // disable transitions while dragging
            }
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || dragButton.current !== 2) return;
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            lastPos.current = { x: e.clientX, y: e.clientY };

            setRotation((r) => {
                const nextX = clampPitch(r.x - dy * 0.5);
                const nextY = r.y + dx * 0.5;
                rotationRef.current = { x: nextX, y: nextY };
                return { x: nextX, y: nextY };
            });
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const handleGlobalMouseUp = (_e: MouseEvent) => {
            isDragging.current = false;
            dragButton.current = null;
        };

        /** ---- Touch handlers ----
         * single-finger: tap/press -> face select (click)
         * two-finger: drag rotate (center point)
         */
        const handleTouchStart: React.TouchEventHandler = (e) => {
            if (e.touches.length === 2) {
                // compute center and start drag
                const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                lastPos.current = { x, y };
                dragButton.current = 2;
                isDragging.current = true;
                setIsAnimating(false);
            } else {
                // single-finger: do nothing special here (onClick will handle face taps)
                dragButton.current = 0;
            }
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!isDragging.current || dragButton.current !== 2) return;
            if (e.touches.length !== 2) return;
            const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = x - lastPos.current.x;
            const dy = y - lastPos.current.y;
            lastPos.current = { x, y };

            setRotation((r) => {
                const nextX = clampPitch(r.x - dy * 0.5);
                const nextY = r.y + dx * 0.5;
                rotationRef.current = { x: nextX, y: nextY };
                return { x: nextX, y: nextY };
            });
        };

        const handleGlobalTouchEnd = () => {
            isDragging.current = false;
            dragButton.current = null;
        };

        // attach global listeners
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
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []); // run once

        // Face click: only left click or touch-generated click triggers onClick.
        const handleFaceClick = (face: typeof FACE_LABELS[number]) => {
            const base = FACE_TARGETS[face];
            // base.y/base.x are already calculated (target for scene = -faceAngle)
            // compute nearest-equivalent yaw target so we take the shortest route:
            const cur = rotationRef.current;
            const dy = shortestSignedAngleDiff(cur.y, base.y);
            const targetY = cur.y + dy;
            const targetX = clampPitch(base.x);
            animateTo(targetY, targetX);
        };

        const half = size / 2;
        const faceTransforms = [
            `rotateY(0deg) translateZ(${half}px)`, // Front
            `rotateY(180deg) translateZ(${half}px)`, // Back
            `rotateY(-90deg) translateZ(${half}px)`, // Left
            `rotateY(90deg) translateZ(${half}px)`, // Right
            `rotateX(90deg) translateZ(${half}px)`, // Top
            `rotateX(-90deg) translateZ(${half}px)`, // Bottom
        ];

        // dynamic transition style
        const transitionStyle = isAnimating
            ? { transition: `transform ${transitionMs}ms cubic-bezier(.22,.9,.2,1)` }
            : { transition: "none" };

        return (
            <div
                className="viewcube-container"
                style={{ width: size, height: size }}
                onMouseDown={handleContainerMouseDown}
                onContextMenu={(e) => e.preventDefault()}
                onTouchStart={handleTouchStart}
            >
                <div
                    className="viewcube-scene"
                    style={{
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        ...transitionStyle,
                    }}
                >
                    {FACE_LABELS.map((label, i) => (
                        <div
                            key={label}
                            className="viewcube-face"
                            style={{ transform: faceTransforms[i] }}
                            // use onClick — it only fires for left mouse click and touch taps
                            onClick={() => handleFaceClick(label)}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

ViewCube.displayName = "ViewCube";
export default ViewCube;
