import * as THREE from 'three';
import { createCloudPuffTexture } from './textureGenerators';

export class StormScene {
  public group: THREE.Group;
  public fogColor = 0x0a0e14;
  public fogDensity = 0.022;

  private rainLines: THREE.LineSegments;
  private rainPositions: Float32Array;
  private rainVelocities: Float32Array;
  private rainDropCount: number;

  private lightningLight: THREE.PointLight;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private cloudSprites: THREE.Sprite[] = [];
  private lightningBolt: THREE.Line;
  private boltPositions: Float32Array;
  private isFlashing = false;
  private flashTimer = 0;
  private nextFlashTime = 2.5;

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Dark Storm Lighting
    this.keyLight = new THREE.DirectionalLight(0x2a3d54, 0.4);
    this.keyLight.position.set(0, 20, 10);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x182433, 0x05070a, 0.5);
    this.group.add(this.hemiLight);

    // Dynamic Lightning Strobe Point Light
    this.lightningLight = new THREE.PointLight(0xd0e8ff, 0, 80, 2);
    this.lightningLight.position.set(0, 15, -10);
    this.group.add(this.lightningLight);

    // 2. Dark Volumetric Storm Clouds
    const cloudTex = createCloudPuffTexture();
    const cloudCount = isSoftwareGl ? 12 : 24;

    for (let i = 0; i < cloudCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: cloudTex,
        color: new THREE.Color().setHSL(0.6, 0.25, 0.15 + Math.random() * 0.15),
        transparent: true,
        opacity: 0.75 + Math.random() * 0.2,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const x = (Math.random() - 0.5) * 70;
      const y = 8 + Math.random() * 8;
      const z = -5 - Math.random() * 25;
      sprite.position.set(x, y, z);
      const sz = 16 + Math.random() * 12;
      sprite.scale.set(sz, sz * 0.7, 1);
      this.group.add(sprite);
      this.cloudSprites.push(sprite);
    }

    // 3. Heavy Torrential Rain
    this.rainDropCount = isSoftwareGl ? 800 : 2200;
    const lineGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainDropCount * 6);
    this.rainVelocities = new Float32Array(this.rainDropCount);

    const stormSlantX = -0.35; // fierce wind slant
    const dropLength = 0.9;

    for (let i = 0; i < this.rainDropCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = (Math.random() - 0.5) * 40 + 5;
      const z = (Math.random() - 0.5) * 40 - 5;
      this.rainVelocities[i] = 34 + Math.random() * 18;

      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;
      this.rainPositions[idx + 3] = x + stormSlantX * dropLength;
      this.rainPositions[idx + 4] = y - dropLength;
      this.rainPositions[idx + 5] = z;
    }

    lineGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x90b8e0,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.rainLines = new THREE.LineSegments(lineGeom, lineMat);
    this.group.add(this.rainLines);

    // 4. Procedural 3D Branching Lightning Bolt
    const boltPoints = 20;
    const boltGeom = new THREE.BufferGeometry();
    this.boltPositions = new Float32Array(boltPoints * 3);
    boltGeom.setAttribute('position', new THREE.BufferAttribute(this.boltPositions, 3));

    const boltMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.lightningBolt = new THREE.Line(boltGeom, boltMat);
    this.group.add(this.lightningBolt);

    // 5. Dark Wet Ground
    const groundGeom = new THREE.PlaneGeometry(160, 160, 8, 8);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x05080c,
      roughness: 0.3,
      metalness: 0.3,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    this.group.add(ground);
  }

  public onPointerDown(point: THREE.Vector3) {
    this.isFlashing = true;
    this.flashTimer = 0;
    this.generateLightningBolt(point.x, point.z);
    this.lightningLight.intensity = 16;
    (this.lightningBolt.material as THREE.LineBasicMaterial).opacity = 1;
    this.cloudSprites.forEach((s) => {
      (s.material as THREE.SpriteMaterial).color.setRGB(0.8, 0.9, 1.0);
    });
  }

  private generateLightningBolt(targetX?: number, targetZ?: number) {
    const endX = targetX !== undefined ? targetX : (Math.random() - 0.5) * 30;
    const endZ = targetZ !== undefined ? targetZ : (-10 - Math.random() * 10);
    const startX = endX + (Math.random() - 0.5) * 12;
    const startY = 16 + Math.random() * 4;
    const startZ = endZ + (Math.random() - 0.5) * 6;

    let currX = startX;
    let currY = startY;
    let currZ = startZ;

    const points = this.boltPositions.length / 3;
    const dy = (startY - (-7)) / points;
    const stepX = (endX - startX) / points;
    const stepZ = (endZ - startZ) / points;

    for (let i = 0; i < points; i++) {
      this.boltPositions[i * 3] = currX;
      this.boltPositions[i * 3 + 1] = currY;
      this.boltPositions[i * 3 + 2] = currZ;

      currY -= dy;
      currX += stepX + (Math.random() - 0.5) * 2.5;
      currZ += stepZ + (Math.random() - 0.5) * 1.5;
    }

    this.lightningBolt.geometry.attributes.position.needsUpdate = true;
    this.lightningLight.position.set(endX, startY - 4, endZ);
  }

  public update(delta: number) {
    const stormSlantX = -0.35;
    const dropLength = 0.9;
    const pos = this.rainPositions;
    const vels = this.rainVelocities;

    // Torrential rain motion
    for (let i = 0; i < this.rainDropCount; i++) {
      const idx = i * 6;
      const dy = vels[i] * delta;
      const dx = stormSlantX * dy;

      pos[idx] += dx;
      pos[idx + 1] -= dy;
      pos[idx + 3] = pos[idx] + stormSlantX * dropLength;
      pos[idx + 4] = pos[idx + 1] - dropLength;

      if (pos[idx + 1] < -8) {
        pos[idx] = (Math.random() - 0.5) * 70;
        pos[idx + 1] = 20 + Math.random() * 8;
        pos[idx + 3] = pos[idx] + stormSlantX * dropLength;
        pos[idx + 4] = pos[idx + 1] - dropLength;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;

    // Lightning Flash Logic
    this.flashTimer += delta;
    const boltMat = this.lightningBolt.material as THREE.LineBasicMaterial;

    if (!this.isFlashing && this.flashTimer >= this.nextFlashTime) {
      // Trigger lightning flash!
      this.isFlashing = true;
      this.flashTimer = 0;
      this.nextFlashTime = 2.0 + Math.random() * 4.5;
      this.generateLightningBolt();
      this.lightningLight.intensity = 12 + Math.random() * 8;
      boltMat.opacity = 1;

      // Brighten clouds momentarily
      this.cloudSprites.forEach((s) => {
        (s.material as THREE.SpriteMaterial).color.setRGB(0.7, 0.8, 0.95);
      });
    } else if (this.isFlashing) {
      // Rapid flicker & decay
      if (this.flashTimer > 0.28) {
        this.isFlashing = false;
        this.lightningLight.intensity = 0;
        boltMat.opacity = 0;
        this.cloudSprites.forEach((s) => {
          (s.material as THREE.SpriteMaterial).color.setHSL(0.6, 0.25, 0.15);
        });
      } else {
        // Stochastic strobe intensity
        const flicker = Math.random() > 0.4 ? 1 : 0.2;
        this.lightningLight.intensity = (8 + Math.random() * 6) * flicker;
        boltMat.opacity = flicker > 0.5 ? 1 : 0.2;
      }
    }

    // Drifting storm clouds
    for (const c of this.cloudSprites) {
      c.position.x += delta * 1.2;
      if (c.position.x > 38) {
        c.position.x = -38;
      }
    }
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.LineSegments).isLineSegments || (obj as THREE.Line).isLine || (obj as THREE.Sprite).isSprite) {
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
