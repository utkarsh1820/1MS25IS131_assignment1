import * as THREE from 'three';
import { createRippleTexture } from './textureGenerators';

interface Ripple {
  mesh: THREE.Mesh;
  scale: number;
  maxScale: number;
  opacity: number;
  speed: number;
  active: boolean;
}

interface SplashDroplet {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class RainyScene {
  public group: THREE.Group;
  public fogColor = 0x121b28;
  public fogDensity = 0.018;

  private rainLines: THREE.LineSegments;
  private rainPositions: Float32Array;
  private rainVelocities: Float32Array;
  private rainDropCount: number;
  private ripples: Ripple[] = [];
  private splashPoints: THREE.Points;
  private splashPositions: Float32Array;
  private splashDroplets: SplashDroplet[] = [];
  private splashCount = 60;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ground: THREE.Mesh;

  constructor(isSoftwareGl: boolean) {
    this.group = new THREE.Group();

    // 1. Moody Rainy Lighting
    this.keyLight = new THREE.DirectionalLight(0x7ba2cc, 1.2);
    this.keyLight.position.set(5, 18, 5);
    this.group.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x40556b, 0x0c1219, 0.9);
    this.group.add(this.hemiLight);

    // 2. Falling Raindrops (LineSegments)
    this.rainDropCount = isSoftwareGl ? 600 : 1800;
    const lineGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainDropCount * 6);
    this.rainVelocities = new Float32Array(this.rainDropCount);

    const slantX = -0.15; // wind slant
    const dropLength = 0.75;

    for (let i = 0; i < this.rainDropCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 40 + 5;
      const z = (Math.random() - 0.5) * 40 - 5;
      const speed = 25 + Math.random() * 15;
      this.rainVelocities[i] = speed;

      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;
      this.rainPositions[idx + 3] = x + slantX * dropLength;
      this.rainPositions[idx + 4] = y - dropLength;
      this.rainPositions[idx + 5] = z;
    }

    lineGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xa8c8ec,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.rainLines = new THREE.LineSegments(lineGeom, lineMat);
    this.group.add(this.rainLines);

    // 3. Water Splashing Ripples on Ground
    const rippleCount = isSoftwareGl ? 14 : 30;
    const rippleTex = createRippleTexture();
    const rippleGeom = new THREE.PlaneGeometry(1, 1);

    for (let i = 0; i < rippleCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: rippleTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(rippleGeom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        (Math.random() - 0.5) * 45,
        -7.98,
        (Math.random() - 0.5) * 35 - 5
      );
      this.group.add(mesh);

      this.ripples.push({
        mesh,
        scale: 0.1,
        maxScale: 1.8 + Math.random() * 1.5,
        speed: 1.5 + Math.random() * 1.5,
        opacity: 0.8,
        active: false,
      });
    }

    // 4. Interactive Droplet Splash Particles
    const splashGeom = new THREE.BufferGeometry();
    this.splashPositions = new Float32Array(this.splashCount * 3);
    for (let i = 0; i < this.splashCount; i++) {
      this.splashPositions[i * 3] = 0;
      this.splashPositions[i * 3 + 1] = -100; // start off-screen
      this.splashPositions[i * 3 + 2] = 0;

      this.splashDroplets.push({
        position: new THREE.Vector3(0, -100, 0),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        active: false,
      });
    }
    splashGeom.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

    const splashMat = new THREE.PointsMaterial({
      color: 0xcde8ff,
      size: 0.45,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.splashPoints = new THREE.Points(splashGeom, splashMat);
    this.group.add(this.splashPoints);

    // 5. Wet Ground Surface with Specular Sheen
    const groundGeom = new THREE.PlaneGeometry(160, 160, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x091018,
      roughness: 0.25,
      metalness: 0.4,
    });
    this.ground = new THREE.Mesh(groundGeom, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -8;
    this.group.add(this.ground);
  }

  // Interactive Click / Tap Handler: creates localized water ripples and droplet burst
  public onPointerDown(point: THREE.Vector3) {
    const targetX = point.x;
    const targetZ = point.z;

    // Trigger 2 overlapping expanding ripples at the clicked point
    for (let k = 0; k < 2; k++) {
      const ripple = this.ripples.find((r) => !r.active);
      if (ripple) {
        ripple.active = true;
        ripple.scale = 0.1 + k * 0.15;
        ripple.maxScale = 2.4 + Math.random() * 1.2;
        ripple.speed = 2.2 + k * 0.6;
        ripple.opacity = 0.95;
        ripple.mesh.position.set(
          targetX + (Math.random() - 0.5) * 0.4,
          -7.96,
          targetZ + (Math.random() - 0.5) * 0.4
        );
      }
    }

    // Spawn 8-12 localized splash droplets jumping upward
    const dropletsToSpawn = 10;
    let spawned = 0;

    for (let i = 0; i < this.splashCount && spawned < dropletsToSpawn; i++) {
      const drop = this.splashDroplets[i];
      if (!drop.active) {
        drop.active = true;
        drop.life = 0;
        drop.maxLife = 0.35 + Math.random() * 0.25;
        drop.position.set(targetX, -7.8, targetZ);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 3.5;
        drop.velocity.set(
          Math.cos(angle) * speed,
          4.0 + Math.random() * 4.0, // upward pop
          Math.sin(angle) * speed
        );
        spawned++;
      }
    }
  }

  public update(delta: number) {
    const pos = this.rainPositions;
    const vels = this.rainVelocities;
    const slantX = -0.15;
    const dropLength = 0.75;

    // Raindrops falling
    for (let i = 0; i < this.rainDropCount; i++) {
      const idx = i * 6;
      const dy = vels[i] * delta;
      const dx = slantX * dy;

      pos[idx] += dx;
      pos[idx + 1] -= dy;
      pos[idx + 3] = pos[idx] + slantX * dropLength;
      pos[idx + 4] = pos[idx + 1] - dropLength;

      if (pos[idx + 1] < -8) {
        if (Math.random() < 0.08) {
          const inactive = this.ripples.find((r) => !r.active);
          if (inactive) {
            inactive.active = true;
            inactive.scale = 0.1;
            inactive.opacity = 0.75;
            inactive.mesh.position.x = pos[idx];
            inactive.mesh.position.z = pos[idx + 2];
          }
        }

        pos[idx] = (Math.random() - 0.5) * 60;
        pos[idx + 1] = 20 + Math.random() * 10;
        pos[idx + 3] = pos[idx] + slantX * dropLength;
        pos[idx + 4] = pos[idx + 1] - dropLength;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;

    // Ripples animation
    for (const r of this.ripples) {
      if (r.active) {
        r.scale += delta * r.speed;
        r.opacity -= delta * (r.speed * 0.55);
        r.mesh.scale.set(r.scale, r.scale, 1);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, r.opacity);

        if (r.scale >= r.maxScale || r.opacity <= 0) {
          r.active = false;
          (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      } else if (Math.random() < 0.03) {
        r.active = true;
        r.scale = 0.1;
        r.opacity = 0.7;
        r.mesh.position.x = (Math.random() - 0.5) * 45;
        r.mesh.position.z = (Math.random() - 0.5) * 35 - 5;
      }
    }

    // Interactive splash droplets physics (gravity & velocity)
    const splashPos = this.splashPositions;
    for (let i = 0; i < this.splashCount; i++) {
      const drop = this.splashDroplets[i];
      if (drop.active) {
        drop.life += delta;
        drop.velocity.y -= 18.0 * delta; // gravity
        drop.position.addScaledVector(drop.velocity, delta);

        splashPos[i * 3] = drop.position.x;
        splashPos[i * 3 + 1] = drop.position.y;
        splashPos[i * 3 + 2] = drop.position.z;

        if (drop.life >= drop.maxLife || drop.position.y < -8) {
          drop.active = false;
          splashPos[i * 3 + 1] = -100; // hide
        }
      } else {
        splashPos[i * 3 + 1] = -100;
      }
    }
    this.splashPoints.geometry.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.LineSegments).isLineSegments || (obj as THREE.Points).isPoints) {
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
