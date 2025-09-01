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
import { MyButton } from "viewcube-demo";

function App() {
  return <MyButton label="Click me!" onClick={() => alert("Hello!")} />;
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
