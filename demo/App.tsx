import React, { useRef, useState } from "react";
import ViewCube, { type ViewCubeHandle } from "../src/lib/ViewCube";

export function App() {
    const cubeRef1 = useRef<ViewCubeHandle | null>(null);
    const cubeRef2 = useRef<ViewCubeHandle | null>(null);

    // shared rotation state
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    // flag to prevent infinite update loop
    const updatingRef = useRef(false);

    const handleRotationChange = (rot: { x: number; y: number }) => {
        if (updatingRef.current) return; // ignore updates triggered programmatically
        updatingRef.current = true;
        setRotation(rot);

        // update the other cube
        cubeRef1.current?.setRotation(rot.x, rot.y);
        cubeRef2.current?.setRotation(rot.x, rot.y);

        // reset the flag on next tick
        setTimeout(() => {
            updatingRef.current = false;
        }, 0);
    };

    return (
        <div>
            <div style={{ textAlign: "center" }}>
                <h2>
                    Two synchronized ViewCubes — left click/tap selects face — right-drag or two-finger drag rotates
                </h2>
                <div style={{ width: "100%", height: 200, position: "relative", padding: 16 }}>
                    {/* Cube 1 */}
                    <div style={{ position: "absolute", left: 60 }}>
                        <ViewCube
                            ref={cubeRef1}
                            size={128}
                            transitionMs={450}
                            onRotationChange={handleRotationChange}
                            initialRotation={{ x: 0, y: 25 }}
                        />
                    </div>

                    {/* Cube 2 */}
                    <div style={{ position: "absolute", right: 60 }}>
                        <ViewCube
                            ref={cubeRef2}
                            size={128}
                            transitionMs={450}
                            onRotationChange={handleRotationChange}
                            initialRotation={{ x: 0, y: 25 }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <button onClick={() => cubeRef1.current?.reset()} style={{ marginRight: 8 }}>
                        Reset
                    </button>
                    <button onClick={() => cubeRef1.current?.setRotation(0, -90)} style={{ marginRight: 8 }}>
                        Look Right
                    </button>
                    <button onClick={() => cubeRef1.current?.setRotation(-90, 0)}>Look Top</button>
                </div>

                <p style={{ opacity: 0.8, marginTop: 10 }}>
                    Left-click/tap: select face — Right-click + drag (desktop) or two-finger drag (touch): rotate.
                </p>

                <p>
                    Rotation: X={rotation.x.toFixed(1)}°, Y={rotation.y.toFixed(1)}°
                </p>
            </div>
        </div>
    );
}
