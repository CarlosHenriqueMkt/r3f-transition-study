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
