import React, { useRef } from "react";
import ViewCube, { type ViewCubeHandle } from "../src/lib/ViewCube";

export function App() {
    const ref = useRef<ViewCubeHandle | null>(null);

    return (
        <div >
            <div style={{ textAlign: "center" }}>
                <h2>ViewCube — left click/tap selects face — right-drag or two-finger drag rotates</h2>
                <div style={{width:"100%", height: 150, position: "relative", padding: 16}}>
                    <div style={{position: "absolute" , right: 60}}>
                        <ViewCube ref={ref} size={64} transitionMs={450} />
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <button onClick={() => ref.current?.reset()} style={{ marginRight: 8 }}>Reset</button>
                    <button onClick={() => ref.current?.setRotation(0, -90)} style={{ marginRight: 8 }}>Look Right</button>
                    <button onClick={() => ref.current?.setRotation(-90, 0)}>Look Top</button>
                </div>
                <p style={{ opacity: 0.8, marginTop: 10 }}>
                    Left-click/tap: select face — Right-click + drag (desktop) or two-finger drag (touch): rotate.
                </p>
            </div>
        </div>
    );
}
