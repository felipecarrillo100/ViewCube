import React, {useEffect, useRef, useState} from "react";
import ViewCube, { type ViewCubeHandle } from "../src/lib/ViewCube";

export function App() {
    const cubeRef = useRef<ViewCubeHandle | null>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });

    return (
        <div>
            <div style={{ textAlign: "center" }}>
                <h2>
                    ViewCube — left click/tap selects face — right-drag or two-finger drag rotates
                </h2>
                <div style={{ width: "100%", height: 150, position: "relative", padding: 16 }}>
                    <div style={{ position: "absolute", right: 60 }}>
                        <ViewCube
                            ref={cubeRef}
                            size={64}
                            transitionMs={450}
                            onRotationChange={(rot) => setRotation(rot)}
                        />
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <button onClick={() => cubeRef.current?.reset()} style={{ marginRight: 8 }}>
                        Reset
                    </button>
                    <button onClick={() => cubeRef.current?.setRotation(0, -90)} style={{ marginRight: 8 }}>
                        Look Right
                    </button>
                    <button onClick={() => cubeRef.current?.setRotation(-90, 0)}>Look Top</button>
                </div>
                <p style={{ opacity: 0.8, marginTop: 10 }}>
                    Left-click/tap: select face — Right-click + drag (desktop) or two-finger drag (touch): rotate.
                </p>

                {/* ✅ Show current rotation updates */}
                <p>
                    Rotation: X={rotation.x.toFixed(1)}°, Y={rotation.y.toFixed(1)}°
                </p>
            </div>
        </div>
    );
}
