import * as THREE from 'three';
import { createCloudPuffTexture } from './textureGenerators';

interface CloudCluster {
  group: THREE.Group;
  speed: number;
  baseX: number;
}

export class CloudyScene {
  public group: THREE.Group;
  public fogColor = 0x223042;
  public fogDensity = 0.012;

  private clusters: CloudCluster[] = [];
  private mistPoints: THREE.Points;
  private mistPositions: Float32Array;
  private mistCount: number;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Overcast Lighting
    this.keyLight = new THREE.DirectionalLight(0xd9e5f5, 1.6);
    this.keyLight.position.set(6, 20, 8);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x768fa8, 0x182433, 1.2);
    this.group.add(this.hemiLight);

    // 2. Volumetric Cloud Clusters
    const cloudTex = createCloudPuffTexture();
    const clusterCount = isSoftwareGl ? 8 : 14;

    for (let c = 0; c < clusterCount; c++) {
      const clusterGroup = new THREE.Group();
      const puffsPerCluster = isSoftwareGl ? 6 : 10;
      const clusterScale = 1.0 + Math.random() * 0.8;

      for (let p = 0; p < puffsPerCluster; p++) {
        const mat = new THREE.SpriteMaterial({
          map: cloudTex,
          color: new THREE.Color().setHSL(0.6, 0.1, 0.85 + Math.random() * 0.1),
          transparent: true,
          opacity: 0.35 + Math.random() * 0.3,
          depthWrite: false,
          blending: THREE.NormalBlending,
        });
        const sprite = new THREE.Sprite(mat);
        const offsetX = (Math.random() - 0.5) * 8 * clusterScale;
        const offsetY = (Math.random() - 0.5) * 3 * clusterScale;
        const offsetZ = (Math.random() - 0.5) * 6 * clusterScale;
        sprite.position.set(offsetX, offsetY, offsetZ);

        const sz = (10 + Math.random() * 8) * clusterScale;
        sprite.scale.set(sz, sz * 0.75, 1);
        clusterGroup.add(sprite);
      }

      const posX = (Math.random() - 0.5) * 80;
      const posY = 6 + Math.random() * 10;
      const posZ = -10 - Math.random() * 30;
      clusterGroup.position.set(posX, posY, posZ);

      this.group.add(clusterGroup);
      this.clusters.push({
        group: clusterGroup,
        speed: 0.8 + Math.random() * 0.8,
        baseX: posX,
      });
    }

    // 3. Floating Ambient Atmospheric Mist Particles
    this.mistCount = isSoftwareGl ? 200 : 500;
    const mistGeom = new THREE.BufferGeometry();
    this.mistPositions = new Float32Array(this.mistCount * 3);

    for (let i = 0; i < this.mistCount; i++) {
      this.mistPositions[i * 3] = (Math.random() - 0.5) * 60;
      this.mistPositions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 2;
      this.mistPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 5;
    }
    mistGeom.setAttribute('position', new THREE.BufferAttribute(this.mistPositions, 3));

    const mistMat = new THREE.PointsMaterial({
      color: 0xc8d8e8,
      size: 0.8,
      transparent: true,
      opacity: 0.4,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    this.mistPoints = new THREE.Points(mistGeom, mistMat);
    this.group.add(this.mistPoints);

    // 4. Overcast Ground
    const groundGeom = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x162230,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    this.group.add(ground);
  }

  public update(delta: number, elapsed: number) {
    // Drifting clouds from west to east
    for (const c of this.clusters) {
      c.group.position.x += delta * c.speed;
      c.group.position.y += Math.sin(elapsed * 0.5 + c.baseX) * 0.005;

      if (c.group.position.x > 45) {
        c.group.position.x = -45;
      }
    }

    // Drift mist particles
    const pos = this.mistPositions;
    for (let i = 0; i < this.mistCount; i++) {
      const idx = i * 3;
      pos[idx] += delta * 0.6;
      pos[idx + 1] += Math.sin(elapsed * 0.3 + i) * 0.01;

      if (pos[idx] > 30) {
        pos[idx] = -30;
      }
    }
    this.mistPoints.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints || (obj as THREE.Sprite).isSprite) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }
}
