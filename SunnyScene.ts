import * as THREE from 'three';
import { createSunGlowTexture } from './textureGenerators';

export class SunnyScene {
  public group: THREE.Group;
  public fogColor = 0x1a4570;
  public fogDensity = 0.008;

  private sunOrb: THREE.Mesh;
  private coronaSprite: THREE.Sprite;
  private outerFlare: THREE.Sprite;
  private dustPoints: THREE.Points;
  private dustPositions: Float32Array;
  private initialY: Float32Array;
  private dustCount: number;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private floatingRays: THREE.Group;

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Lighting
    this.keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    this.keyLight.position.set(12, 18, 10);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x5ca0e6, 0x1c2b3a, 1.4);
    this.group.add(this.hemiLight);

    // 2. Central 3D Procedural Sun
    const sunGeom = new THREE.SphereGeometry(3.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.sunOrb = new THREE.Mesh(sunGeom, sunMat);
    this.sunOrb.position.set(10, 14, -18);
    this.group.add(this.sunOrb);

    // Inner Glowing Corona
    const glowTex = createSunGlowTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffe082,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.9,
      depthWrite: false,
    });
    this.coronaSprite = new THREE.Sprite(coronaMat);
    this.coronaSprite.position.copy(this.sunOrb.position);
    this.coronaSprite.scale.set(24, 24, 1);
    this.group.add(this.coronaSprite);

    // Outer Soft Atmosphere Flare
    const flareMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xff9900,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.45,
      depthWrite: false,
    });
    this.outerFlare = new THREE.Sprite(flareMat);
    this.outerFlare.position.copy(this.sunOrb.position);
    this.outerFlare.scale.set(45, 45, 1);
    this.group.add(this.outerFlare);

    // 3. Sun Rays / Shimmering Geometry
    this.floatingRays = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfff4c2,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const coneGeom = new THREE.ConeGeometry(4, 30, 4, 1, true);
      const cone = new THREE.Mesh(coneGeom, rayMat);
      cone.position.copy(this.sunOrb.position);
      cone.rotation.z = angle;
      cone.rotation.x = Math.PI / 2 + 0.2;
      this.floatingRays.add(cone);
    }
    this.group.add(this.floatingRays);

    // 4. Floating Warm Atmospheric Dust Particles
    this.dustCount = isSoftwareGl ? 300 : 700;
    const dustGeom = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.dustCount * 3);
    this.initialY = new Float32Array(this.dustCount);

    for (let i = 0; i < this.dustCount; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 30 + 5;
      const z = (Math.random() - 0.5) * 40 - 5;
      this.dustPositions[i * 3] = x;
      this.dustPositions[i * 3 + 1] = y;
      this.dustPositions[i * 3 + 2] = z;
      this.initialY[i] = y;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xffe8aa,
      size: 0.45,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dustPoints = new THREE.Points(dustGeom, dustMat);
    this.group.add(this.dustPoints);

    // 5. Horizon Atmospheric Ground Plane
    const groundGeom = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x11283d,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    this.group.add(ground);
  }

  public update(delta: number, elapsed: number) {
    // Subtle breathing pulse on the sun corona
    const pulse = Math.sin(elapsed * 1.5) * 1.2;
    this.coronaSprite.scale.set(24 + pulse, 24 + pulse, 1);
    this.outerFlare.scale.set(45 + pulse * 2, 45 + pulse * 2, 1);

    // Rotate the soft sunray cones
    this.floatingRays.rotation.z += delta * 0.05;

    // Dust particles floating upward gently with sine wave sway
    const pos = this.dustPositions;
    for (let i = 0; i < this.dustCount; i++) {
      const idx = i * 3;
      pos[idx + 1] += delta * 0.4;
      pos[idx] += Math.sin(elapsed + i) * 0.02;
      pos[idx + 2] += Math.cos(elapsed * 0.8 + i) * 0.02;

      // Wrap around top/bottom
      if (pos[idx + 1] > 22) {
        pos[idx + 1] = -6;
      }
    }
    this.dustPoints.geometry.attributes.position.needsUpdate = true;
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
