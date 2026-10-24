import fs from 'fs';

function checkGlb(path) {
  if (!fs.existsSync(path)) {
    console.log('Not found:', path);
    return;
  }
  const buf = fs.readFileSync(path);
  // GLB header: magic (4), version (4), length (4), chunkLength (4), chunkType (4)
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  try {
    const gltf = JSON.parse(jsonStr);
    console.log(path, 'Nodes count:', gltf.nodes?.length, 'Meshes:', gltf.meshes?.length, 'Materials:', gltf.materials?.length);
    if (gltf.nodes) {
      const names = gltf.nodes.map(n => n.name).filter(Boolean);
      console.log('Sample node names (first 30):', names.slice(0, 30));
      const signNames = names.filter(n => n.toLowerCase().includes('sign') || n.toLowerCase().includes('neon') || n.toLowerCase().includes('fast') || n.toLowerCase().includes('food') || n.toLowerCase().includes('banner'));
      console.log('Sign/Neon matching nodes:', signNames);
    }
    if (gltf.materials) {
      const matNames = gltf.materials.map(m => m.name).filter(Boolean);
      console.log('Sample material names:', matNames.slice(0, 30));
      const neonMats = matNames.filter(m => m.toLowerCase().includes('neon') || m.toLowerCase().includes('sign') || m.toLowerCase().includes('light') || m.toLowerCase().includes('red'));
      console.log('Neon/Sign matching materials:', neonMats);
    }
  } catch (e) {
    console.error('Error parsing GLB:', e);
  }
}

checkGlb('public/models/cyberpunk_compressed.glb');
checkGlb('public/models/billboards.glb');
