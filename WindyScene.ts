import * as THREE from 'three';
import { createWindLeafTexture, createCloudPuffTexture } from './textureGenerators';

interface LeafParticle {
  mesh: THREE.Mesh;
  rotSpeed: THREE.Vector3;
  flowSpeed: number;
  flowOffset: number;
}

interface SwayingFoliage {
  group: THREE.Group;
  stalks: THREE.Mesh[];
  baseX: number;
  baseZ: number;
  phase: number;
  stiffness: number;
  impulse: number;
}

export class WindyScene {
  public group: THREE.Group;
  public fogColor = 0x1b2838;
  public fogDensity = 0.012;

  private windStreams: THREE.Line[];
  private leafParticles: LeafParticle[] = [];
  private foliageClusters: SwayingFoliage[] = [];
  private clouds: THREE.Sprite[] = [];
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  public windIntensity = 1.0; // 0.5 (gentle breeze) to 2.5 (gale)

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Atmospheric Breezy Lighting
    this.keyLight = new THREE.DirectionalLight(0xfff0dd, 1.8);
    this.keyLight.position.set(10, 16, 8);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x567c9c, 0x182430, 1.3);
    this.group.add(this.hemiLight);

    // 2. Swaying Environmental Foliage (Reeds & Grass Clusters)
    const foliageClusterCount = isSoftwareGl ? 14 : 28;
    const bladeGeom = new THREE.CylinderGeometry(0.04, 0.12, 3.2, 4);
    // Translate geometry so pivot is at the ground base
    bladeGeom.translate(0, 1.6, 0);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
      metalness: 0.1,
    });

    for (let c = 0; c < foliageClusterCount; c++) {
      const clusterGroup = new THREE.Group();
      const posX = (Math.random() - 0.5) * 50;
      const posZ = (Math.random() - 0.5) * 28 - 2;
      const posY = -8; // ground surface

      clusterGroup.position.set(posX, posY, posZ);

      const bladesInCluster = isSoftwareGl ? 3 : 5;
      const stalks: THREE.Mesh[] = [];

      for (let b = 0; b < bladesInCluster; b++) {
        const stalk = new THREE.Mesh(bladeGeom, foliageMat);
        const sX = (Math.random() - 0.5) * 0.6;
        const sZ = (Math.random() - 0.5) * 0.6;
        stalk.position.set(sX, 0, sZ);

        // Slight natural fan-out angle
        stalk.rotation.x = (Math.random() - 0.5) * 0.2;
        stalk.rotation.z = (Math.random() - 0.5) * 0.25;

        const scaleY = 0.8 + Math.random() * 0.5;
        stalk.scale.set(1, scaleY, 1);

        clusterGroup.add(stalk);
        stalks.push(stalk);
      }

      this.group.add(clusterGroup);
      this.foliageClusters.push({
        group: clusterGroup,
        stalks,
        baseX: posX,
        baseZ: posZ,
        phase: Math.random() * Math.PI * 2,
        stiffness: 0.85 + Math.random() * 0.3,
        impulse: 0,
      });
    }

    // 3. Flowing Wind Stream Ribbons / Trails
    this.windStreams = [];
    const streamCount = isSoftwareGl ? 8 : 16;
    const streamMat = new THREE.LineBasicMaterial({
      color: 0xc4e4ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let s = 0; s < streamCount; s++) {
      const points: THREE.Vector3[] = [];
      const baseY = (Math.random() - 0.5) * 16 + 4;
      const baseZ = (Math.random() - 0.5) * 30 - 5;
      const segments = 24;

      for (let p = 0; p <= segments; p++) {
        const x = -35 + (p / segments) * 70;
        const wave = Math.sin(p * 0.4 + s) * 2.5;
        points.push(new THREE.Vector3(x, baseY + wave, baseZ));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, streamMat);
      line.userData = { baseY, baseZ, phase: s * 0.8, speed: 1.5 + Math.random() * 1.5 };
      this.group.add(line);
      this.windStreams.push(line);
    }

    // 4. Tumbling Autumn Leaves / Airborne Particles
    const leafTex = createWindLeafTexture();
    const leafGeom = new THREE.PlaneGeometry(0.8, 0.8);
    const leafCount = isSoftwareGl ? 35 : 85;

    for (let i = 0; i < leafCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: leafTex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(leafGeom, mat);
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 20 + 2;
      const z = (Math.random() - 0.5) * 35 - 5;
      mesh.position.set(x, y, z);
      const sz = 0.5 + Math.random() * 0.5;
      mesh.scale.set(sz, sz, 1);
      this.group.add(mesh);

      this.leafParticles.push({
        mesh,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3
        ),
        flowSpeed: 12 + Math.random() * 10,
        flowOffset: Math.random() * Math.PI * 2,
      });
    }

    // 5. Fast-Drifting Wind Clouds
    const cloudTex = createCloudPuffTexture();
    const cloudCount = isSoftwareGl ? 5 : 9;

    for (let i = 0; i < cloudCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: cloudTex,
        color: 0xdae6f2,
        transparent: true,
        opacity: 0.35 + Math.random() * 0.25,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const x = (Math.random() - 0.5) * 70;
      const y = 8 + Math.random() * 8;
      const z = -10 - Math.random() * 20;
      sprite.position.set(x, y, z);
      const sz = 16 + Math.random() * 10;
      sprite.scale.set(sz, sz * 0.5, 1);
      this.group.add(sprite);
      this.clouds.push(sprite);
    }

    // 6. Rolling Wind Terrain
    const groundGeom = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111e2b,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -8;
    this.group.add(ground);
  }

  // Interactive Click: creates a sudden wind vortex, whipping adjacent foliage and swirling leaves
  public onPointerDown(point: THREE.Vector3) {
    for (const f of this.foliageClusters) {
      const dist = Math.hypot(f.baseX - point.x, f.baseZ - point.z);
      if (dist < 15) {
        // Bend foliage away from clicked position
        const force = Math.max(0, 1 - dist / 15) * 0.65;
        f.impulse += force;
      }
    }

    // Give adjacent leaves an upward and lateral gust boost
    for (const leaf of this.leafParticles) {
      const dist = Math.hypot(leaf.mesh.position.x - point.x, leaf.mesh.position.z - point.z);
      if (dist < 12) {
        leaf.mesh.position.y += (1 - dist / 12) * 4.0;
        leaf.flowSpeed += 15;
      }
    }
  }

  // Interactive Hover / Move: subtle foliage rustle when pointer sweeps near ground
  public onPointerMove(point: THREE.Vector3) {
    for (const f of this.foliageClusters) {
      const dist = Math.hypot(f.baseX - point.x, f.baseZ - point.z);
      if (dist < 8) {
        f.impulse += Math.max(0, 1 - dist / 8) * 0.18;
      }
    }
  }

  public setWindIntensity(intensity: number) {
    this.windIntensity = Math.max(0.3, Math.min(3.0, intensity));
  }

  public update(delta: number, elapsed: number) {
    const intensity = this.windIntensity;

    // 1. Environmental Foliage Swaying
    for (const f of this.foliageClusters) {
      // Natural sinusoidal wind bending + impulse decay
      const baseSway = Math.sin(elapsed * (2.8 * intensity) + f.phase) * (0.28 * intensity);
      const steadyBend = 0.18 * intensity; // lean in wind direction

      // Spring damping on user-induced impulse
      f.impulse *= Math.max(0, 1 - delta * 4.0);

      const totalAngle = baseSway + steadyBend + f.impulse;
      f.group.rotation.z = totalAngle * f.stiffness;
      f.group.rotation.x = Math.cos(elapsed * 1.5 + f.phase) * (0.08 * intensity);
    }

    // 2. Wind Streams
    for (const stream of this.windStreams) {
      const { baseY, baseZ, phase, speed } = stream.userData;
      const positions = stream.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      for (let p = 0; p < count; p++) {
        const x = positions[p * 3];
        const wave = Math.sin((x * 0.1) - (elapsed * speed * intensity) + phase) * (2.2 * intensity);
        positions[p * 3 + 1] = baseY + wave;
        positions[p * 3 + 2] = baseZ + Math.cos(x * 0.08 + elapsed) * (1.5 * intensity);
      }
      stream.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Tumbling Swirling Leaves
    for (const leaf of this.leafParticles) {
      const m = leaf.mesh;
      m.position.x += delta * leaf.flowSpeed * intensity;
      m.position.y += Math.sin(elapsed * 2 * intensity + leaf.flowOffset) * (0.08 * intensity);
      m.position.z += Math.cos(elapsed * 1.5 + leaf.flowOffset) * 0.04;

      m.rotation.x += delta * leaf.rotSpeed.x * intensity;
      m.rotation.y += delta * leaf.rotSpeed.y * intensity;
      m.rotation.z += delta * leaf.rotSpeed.z * intensity;

      if (m.position.x > 32) {
        m.position.x = -32;
        m.position.y = (Math.random() - 0.5) * 20 + 2;
        leaf.flowSpeed = (12 + Math.random() * 10);
      }
    }

    // 4. Swiftly Moving Clouds
    for (const c of this.clouds) {
      c.position.x += delta * 3.5 * intensity;
      if (c.position.x > 40) {
        c.position.x = -40;
      }
    }
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine || (obj as THREE.Sprite).isSprite) {
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
