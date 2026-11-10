import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WeatherType } from '../types/weather';
import { SunnyScene } from './SunnyScene';
import { CloudyScene } from './CloudyScene';
import { RainyScene } from './RainyScene';
import { StormScene } from './StormScene';
import { WindyScene } from './WindyScene';
import { SnowScene } from './SnowScene';

interface WeatherCanvasProps {
  weatherType: WeatherType;
  isDay?: boolean;
  windIntensity?: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  weatherType,
  isDay = true,
  windIntensity = 1.0,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeTypeRef = useRef<WeatherType>(weatherType);
  const isDayRef = useRef<boolean>(isDay);
  const windIntensityRef = useRef<number>(windIntensity);

  useEffect(() => {
    activeTypeRef.current = weatherType;
  }, [weatherType]);

  useEffect(() => {
    isDayRef.current = isDay;
  }, [isDay]);

  useEffect(() => {
    windIntensityRef.current = windIntensity;
  }, [windIntensity]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL to pace loop and scale quality
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      250
    );
    camera.position.set(0, 3, 24);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Initial fog
    const initialFogColor = isDayRef.current ? 0x1a365d : 0x0a111a;
    scene.fog = new THREE.FogExp2(initialFogColor, 0.012);
    renderer.setClearColor(initialFogColor, 1);

    container.appendChild(renderer.domElement);

    // 3. Current active weather scene management
    let currentSceneInstance: any = null;
    let currentSceneType: WeatherType | null = null;

    function buildScene(type: WeatherType) {
      if (currentSceneInstance) {
        scene.remove(currentSceneInstance.group);
        currentSceneInstance.dispose();
      }

      switch (type) {
        case 'sunny':
          currentSceneInstance = new SunnyScene(isSoftwareGl);
          break;
        case 'cloudy':
          currentSceneInstance = new CloudyScene(isSoftwareGl);
          break;
        case 'rainy':
          currentSceneInstance = new RainyScene(isSoftwareGl);
          break;
        case 'storm':
          currentSceneInstance = new StormScene(isSoftwareGl);
          break;
        case 'windy':
          currentSceneInstance = new WindyScene(isSoftwareGl);
          break;
        case 'snow':
          currentSceneInstance = new SnowScene(isSoftwareGl);
          break;
        default:
          currentSceneInstance = new SunnyScene(isSoftwareGl);
          break;
      }

      scene.add(currentSceneInstance.group);
      currentSceneType = type;

      // Update fog & clear color to match scene atmosphere
      if (scene.fog && currentSceneInstance.fogColor) {
        const fogColor = new THREE.Color(currentSceneInstance.fogColor);
        (scene.fog as THREE.FogExp2).color.copy(fogColor);
        (scene.fog as THREE.FogExp2).density = currentSceneInstance.fogDensity || 0.012;
        renderer.setClearColor(fogColor, 1);
      }
    }

    buildScene(activeTypeRef.current);

    // 4. Mouse interactive parallax & 3D raycast interaction
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 8); // y = -8
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    const getRayHit = (clientX: number, clientY: number): THREE.Vector3 | null => {
      ndc.x = (clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        return hitPoint;
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 3;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;

      const hit = getRayHit(e.clientX, e.clientY);
      if (hit && currentSceneInstance?.onPointerMove) {
        currentSceneInstance.onPointerMove(hit);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="dialog"]'))) {
        return;
      }
      const hit = getRayHit(e.clientX, e.clientY);
      if (hit && currentSceneInstance?.onPointerDown) {
        currentSceneInstance.onPointerDown(hit);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    // 5. Render Loop with software WebGL fence synchronization
    let frameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 6);
    }

    let isDisposed = false;

    function tick() {
      if (isDisposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += delta;

      // Check if weather type changed
      if (currentSceneType !== activeTypeRef.current) {
        buildScene(activeTypeRef.current);
      }

      // Smooth camera parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      camera.position.x = mouse.x;
      camera.position.y = 3 + mouse.y;
      camera.lookAt(0, 3, 0);

      // Update active weather scene particles / lighting
      if (currentSceneInstance) {
        if (currentSceneInstance.setWindIntensity) {
          currentSceneInstance.setWindIntensity(windIntensityRef.current);
        }
        currentSceneInstance.update(delta, elapsed);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 6. Handle Container Resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // 7. Cleanup
    return () => {
      isDisposed = true;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      resizeObserver.disconnect();
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      if (currentSceneInstance) {
        scene.remove(currentSceneInstance.group);
        currentSceneInstance.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="three-weather-canvas"
      className="absolute inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none"
    />
  );
};
