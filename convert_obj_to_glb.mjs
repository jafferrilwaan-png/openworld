class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onload) this.onload({ target: { result: buf } });
      if (this.onloadend) this.onloadend({ target: { result: buf } });
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';

const loader = new OBJLoader();
const exporter = new GLTFExporter();

async function convert(objPath, glbPath, carName, defaultColor) {
  const text = fs.readFileSync(objPath, 'utf8');
  const group = loader.parse(text);
  group.name = carName;

  const paintMat = new THREE.MeshStandardMaterial({
    name: 'paint',
    color: new THREE.Color(defaultColor),
    metalness: 0.85,
    roughness: 0.2
  });

  const trimMat = new THREE.MeshStandardMaterial({
    name: 'trim',
    color: new THREE.Color(0x15171a),
    metalness: 0.2,
    roughness: 0.7
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    name: 'glass',
    color: new THREE.Color(0x10151c),
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.4
  });

  const tireMat = new THREE.MeshStandardMaterial({
    name: 'tire',
    color: new THREE.Color(0x151515),
    metalness: 0.05,
    roughness: 0.9
  });

  const rimMat = new THREE.MeshStandardMaterial({
    name: 'rim',
    color: new THREE.Color(0xdcdcdc),
    metalness: 0.95,
    roughness: 0.15
  });

  group.traverse(ch => {
    if (ch.isMesh) {
      const n = ch.name.toLowerCase();
      if (n.includes('paint')) ch.material = paintMat;
      else if (n.includes('glass')) ch.material = glassMat;
      else if (n.includes('rim')) ch.material = rimMat;
      else if (n.includes('tyre') || n.includes('tire')) ch.material = tireMat;
      else ch.material = trimMat;
      ch.castShadow = true;
      ch.receiveShadow = true;
    }
  });

  const gltf = await exporter.parseAsync(group, { binary: true });
  fs.writeFileSync(glbPath, Buffer.from(gltf));
  console.log(`Successfully generated GLB: ${glbPath} (${(gltf.byteLength / 1024).toFixed(1)} KB)`);
}

async function run() {
  await convert('public/models/camaro_complete.obj', 'public/models/camaro.glb', 'camaro', '#ffd000');
  await convert('public/models/ferrari_complete.obj', 'public/models/ferrari.glb', 'ferrari', '#e61919');
  await convert('public/models/audi_complete.obj', 'public/models/audi.glb', 'audi', '#00a8e8');
  await convert('public/models/carvisualizer_garage.obj', 'public/models/carvisualizer_garage.glb', 'garage', '#282b30');
  console.log('ALL 4 CARVISUALIZER GLB ASSETS GENERATED!');
}

run().catch(console.error);
