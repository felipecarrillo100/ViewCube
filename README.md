# ViewCube Demo Library

A reusable React library with TypeScript, built with Vite. Includes a demo app to preview components during development.

---

## Installation

Install the library and its peer dependencies:

```bash
npm install viewcube-demo react react-dom
```

## Usage
Import your components from the library:
```typescript
import React from "react";
import { ViewCube } from "viewcube";

function App() {
    return (
        <>
            <ViewCube ref={cubeRef} size={250} transitionMs={500} />
            <button onClick={() => cubeRef.current?.setRotation(45, 90)}>
                Rotate Cube
            </button>
            <button onClick={() => cubeRef.current?.reset()}>Reset Cube</button>
        </>
    );
}

export default App;

```

## Development
1) To build
```bash
npm run build
```

2) To run demo sample
```bash
npm run demo
```
