import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useFBO } from '@react-three/drei';
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
