import * as THREE from 'three';
import { createSnowflakeTexture } from './textureGenerators';

interface Snowflake {
  sprite: THREE.Sprite;
  speed: number;
  swaySpeed: number;
  swayDist: number;
  phase: number;
  baseX: number;
}

export class SnowScene {
  public group: THREE.Group;
  public fogColor = 0x142030;
  public fogDensity = 0.015;

  private snowflakes: Snowflake[] = [];
  private sparklePoints: THREE.Points;
  private sparklePositions: Float32Array;
  private sparkleCount: number;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Crisp Winter Lighting
    this.keyLight = new THREE.DirectionalLight(0xdff0ff, 1.7);
    this.keyLight.position.set(6, 18, 10);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x7da4cc, 0x141f2d, 1.2);
    this.group.add(this.hemiLight);

    // 2. 3D Procedural Snowflakes
    const snowTex = createSnowflakeTexture();
    const count = isSoftwareGl ? 120 : 350;

    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: snowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);

      const x = (Math.random() - 0.5) * 55;
      const y = (Math.random() - 0.5) * 35 + 5;
      const z = (Math.random() - 0.5) * 35 - 5;
      sprite.position.set(x, y, z);

      const sz = 0.6 + Math.random() * 1.2;
      sprite.scale.set(sz, sz, 1);
      this.group.add(sprite);

      this.snowflakes.push({
        sprite,
        speed: 2.2 + Math.random() * 2.5,
        swaySpeed: 1.0 + Math.random() * 1.8,
        swayDist: 0.8 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        baseX: x,
      });
    }

    // 3. Ambient Frost Sparkles
    this.sparkleCount = isSoftwareGl ? 150 : 400;
    const sparkleGeom = new THREE.BufferGeometry();
    this.sparklePositions = new Float32Array(this.sparkleCount * 3);

    for (let i = 0; i < this.sparkleCount; i++) {
      this.sparklePositions[i * 3] = (Math.random() - 0.5) * 50;
      this.sparklePositions[i * 3 + 1] = (Math.random() - 0.5) * 25 + 2;
      this.sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
    }
    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(this.sparklePositions, 3));

    const sparkleMat = new THREE.PointsMaterial({
      color: 0xe0f4ff,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparklePoints = new THREE.Points(sparkleGeom, sparkleMat);
    this.group.add(this.sparklePoints);

    // 4. Snowy Crisp Ground
    const groundGeom = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1b2d42,
      roughness: 0.6,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    this.group.add(ground);
  }

  public update(delta: number, elapsed: number) {
    // Falling snowflakes with gentle sinusoidal sway
    for (const flake of this.snowflakes) {
      const s = flake.sprite;
      s.position.y -= delta * flake.speed;
      s.position.x = flake.baseX + Math.sin(elapsed * flake.swaySpeed + flake.phase) * flake.swayDist;
      s.position.z += Math.cos(elapsed * 0.8 + flake.phase) * 0.01;

      // Reset to top when falling below ground
      if (s.position.y < -8) {
        s.position.y = 18 + Math.random() * 4;
        flake.baseX = (Math.random() - 0.5) * 55;
        s.position.x = flake.baseX;
      }
    }

    // Sparkle twinkling
    const pos = this.sparklePositions;
    for (let i = 0; i < this.sparkleCount; i++) {
      const idx = i * 3;
      pos[idx + 1] -= delta * 0.5;
      if (pos[idx + 1] < -8) {
        pos[idx + 1] = 16;
      }
    }
    this.sparklePoints.geometry.attributes.position.needsUpdate = true;
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
