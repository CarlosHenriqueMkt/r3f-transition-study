# Scene Transitions with Three.js and React Three Fiber

This project demonstrates how to create smooth scene transitions using Three.js and React Three Fiber. By following this guide, you'll learn how to set up and manage scene transitions effectively, leveraging custom shaders and frame buffer objects (FBOs).

## Table of Contents

1. [Introduction](#introduction)
2. [Key Concepts](#key-concepts)
3. [Project Structure](#project-structure)
4. [Detailed Code Explanation](#detailed-code-explanation)
    - [TransitionMaterial.js](#1-transitionmaterialjs)
    - [TransitionScene.js](#2-transitionscenejs)
    - [App.js](#3-appjs)
    - [index.css](#4-indexcss)
5. [Tips and Best Practices](#tips-and-best-practices)
6. [Conclusion](#conclusion)

## Introduction

Three.js is a powerful 3D graphics library that allows developers to create stunning visualizations. React Three Fiber (R3F) is a React renderer for Three.js, enabling developers to use Three.js within the React ecosystem. By combining these tools, you can create interactive and dynamic 3D experiences with the declarative nature of React.

## Key Concepts

- **Three.js**: A JavaScript library used to create and display animated 3D computer graphics in a web browser using WebGL.
- **React Three Fiber (R3F)**: A React renderer for Three.js, allowing you to build 3D scenes declaratively using React components.
- **Frame Buffer Objects (FBOs)**: Used to render scenes off-screen and use them as textures in other scenes or effects.
- **Shader Materials**: Custom shaders written in GLSL (OpenGL Shading Language) that provide more control over the rendering process.

## Project Structure

```
src/
│
├── components/
│   ├── TransitionMaterial.js
│   └── TransitionScene.js
│
├── App.js
├── index.css
└── index.js
```

## Detailed Code Explanation

### 1. TransitionMaterial.js

Defines the custom shader material used for the transition effect.

```jsx
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const TransitionMaterial = shaderMaterial(
  {
    scene0: null,
    scene1: null,
    aspect: 1,
    action: 0,
    time: 0,
    timeStart: -1000,
    duration: 3,
  },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = vec4(position, 1.0);
   }`,
  `uniform sampler2D scene0;
   uniform sampler2D scene1;
   uniform float aspect;
   uniform float action;
   uniform float time;
   uniform float timeStart;
   uniform float duration;

   varying vec2 vUv;

   void main() {
     vec2 uv = vUv;
     vec4 s0 = texture2D(scene0, uv);
     vec4 s1 = texture2D(scene1, uv);

     float d = vUv.x;

     float waveWidth = 0.25;
     float halfWave = waveWidth * 0.5;
     float maxLength = 1.0 + waveWidth;
     float currWavePos = -halfWave + maxLength * clamp((time - timeStart) / duration, 0.0, 1.0);
     float f = smoothstep(currWavePos + halfWave, currWavePos - halfWave, d);

     vec3 col = mix(s0.rgb, s1.rgb, f);

     gl_FragColor = vec4(col, 1.0);
   }`
);

extend({ TransitionMaterial });

export default TransitionMaterial;
```

### 2. TransitionScene.js

Handles the creation of scenes, managing transitions, and rendering.

```jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import TransitionMaterial from './TransitionMaterial';
import * as THREE from 'three';

const createRandomGeometries = (scene) => {
  const geometries = [
    new THREE.BoxGeometry(),
    new THREE.SphereGeometry(),
    new THREE.ConeGeometry(),
    new THREE.CylinderGeometry(),
    new THREE.TorusGeometry(),
  ];

  for (let i = 0; i < 50; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(mesh);
  }
};

const TransitionScene = ({ toggle }) => {
  const { gl, size, camera } = useThree();
  const fbo1 = useFBO(size.width, size.height);
  const fbo2 = useFBO(size.width, size.height);
  const [scenes] = useState([new THREE.Scene(), new THREE.Scene()]);
  const materialRef = useRef();
  const clock = useRef(new THREE.Clock());
  const time = useRef(0);
  const [action, setAction] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [timeStart, setTimeStart] = useState(-1000);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    createRandomGeometries(scenes[0]);
    createRandomGeometries(scenes[1]);
  }, [scenes]);

  useEffect(() => {
    if (!isFirstRender) {
      setAction((prev) => (prev === 0 ? 1 : 0));
      setCurrentSceneIndex((prev) => (prev === 0 ? 1 : 0));
      setTimeStart(clock.current.getElapsedTime());
    } else {
      setIsFirstRender(false);
    }
  }, [toggle]);

  useFrame(() => {
    time.current = clock.current.getElapsedTime();

    gl.setRenderTarget(fbo1);
    gl.render(scenes[currentSceneIndex], camera);
    gl.setRenderTarget(fbo2);
    gl.render(scenes[1 - currentSceneIndex], camera);
    gl.setRenderTarget(null);

    if (materialRef.current) {
      materialRef.current.uniforms.scene0.value = fbo1.texture;
      materialRef.current.uniforms.scene1.value = fbo2.texture;
      materialRef.current.uniforms.time.value = time.current;
      materialRef.current.uniforms.timeStart.value = timeStart;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <transitionMaterial
        ref={materialRef}
        aspect={size.width / size.height}
        action={action}
        time={time.current}
        timeStart={timeStart}
        duration={3}
      />
    </mesh>
  );
};

const TransitionCanvas = ({ toggle }) => (
  <Canvas>
    <OrbitControls enableDamping />
    <TransitionScene toggle={toggle} />
  </Canvas>
);

export default TransitionCanvas;
```

### 3. App.js

Initializes the application and handles the toggle button for transitions.

```jsx
import React, { useState } from 'react';
import TransitionCanvas from './TransitionCanvas';
import './index.css';  // Import the CSS file here

const App = () => {
  const [toggle, setToggle] = useState(false);

  const toggleScene = () => {
    setToggle((prev) => !prev);
  };

  return (
    <>
      <TransitionCanvas toggle={toggle} />
      <button onClick={toggleScene}>
        Toggle Scene
      </button>
    </>
  );
};

export default App;
```

### 4. index.css

Ensures the canvas and button are displayed full screen.

```css
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

#root {
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

button {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 10px 20px;
  background-color: #ff6600;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #ff4500;
}
```

## Tips and Best Practices

1. **State Management**: Carefully manage state to avoid unnecessary re-renders and ensure smooth transitions. Use hooks like `useState`, `useRef`, and `useEffect` effectively.
2. **Performance**: Keep an eye on performance. Use FBOs to render scenes off-screen and reuse geometries instead of recreating them.
3. **Custom Shaders**: Leverage custom shaders for advanced effects. Understanding GLSL can significantly enhance the

 visual quality of your transitions.
4. **Testing**: Test your transitions on different devices and screen sizes to ensure consistent performance and appearance.
5. **Debugging**: Use browser developer tools and Three.js inspector tools to debug and optimize your scenes.

## Conclusion

By following this guide, you can create smooth and visually appealing scene transitions using Three.js and React Three Fiber. Understanding the underlying concepts and applying best practices will help you build more complex and interactive 3D applications. Happy coding!
