import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { SceneModel, SceneNode } from './model';

interface Actor { group: THREE.Group; body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; face: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; descriptor: SceneNode; target: THREE.Vector3; scale: THREE.Vector3; texture?: THREE.CanvasTexture; }
interface Connection { mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>; from: string; to: string; }

function labelTexture(label: string) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, 512, 512); context.fillStyle = '#243e4b'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = '600 300px Segoe UI, Arial';
  const width = context.measureText(label).width;
  if (width > 440) context.font = `600 ${Math.floor(300 * 440 / width)}px Segoe UI, Arial`;
  context.fillText(label, 256, 272);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createScene(host: HTMLElement, initial: SceneModel, reducedMotion: boolean, onHover: (caption: string) => void, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor('#f0f5f7');
  const canvas = renderer.domElement; canvas.className = 'algorithm-canvas'; canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Mô hình 3D thuật toán');
  host.appendChild(canvas);
  const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, .1, 160);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = !reducedMotion;
  controls.dampingFactor = .09; controls.enablePan = false; controls.minZoom = .65; controls.maxZoom = 2.6;
  controls.minPolarAngle = .25; controls.maxPolarAngle = 1.15; controls.autoRotateSpeed = .65;
  controls.listenToKeyEvents(canvas);
  scene.add(new THREE.HemisphereLight('#ffffff', '#9baebb', 1.3));
  const light = new THREE.DirectionalLight('#ffffff', 2.8); light.position.set(-4, 12, 7); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024); light.shadow.camera.left = -15; light.shadow.camera.right = 15;
  light.shadow.camera.top = 15; light.shadow.camera.bottom = -15; light.shadow.normalBias = .035;
  light.shadow.bias = -.0002; light.shadow.blurSamples = 6; scene.add(light);
  const fill = new THREE.DirectionalLight('#cce8f5', .7); fill.position.set(8, 3, -5); scene.add(fill);
  const floorGeometry = new THREE.PlaneGeometry(200, 200), floorMaterial = new THREE.MeshStandardMaterial({ color: '#f0f5f7', roughness: .96 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial); floor.rotation.x = -Math.PI / 2; floor.position.y = -.035; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(60, 60, '#cadce5', '#dce7ed'); grid.position.y = -.025;
  (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = .5; scene.add(grid);
  const geometry = new RoundedBoxGeometry(1, 1, 1, 3, .075), faceGeometry = new THREE.PlaneGeometry(1, 1);
  const linkGeometry = new THREE.CylinderGeometry(.025, .025, 1, 8);
  const actors = new Map<string, Actor>(); let connections: Connection[] = [], animationFrame = 0, visible = true, disposed = false, dirty = true;
  let spin = false, settledFrames = 0, lastTime = performance.now(), shape = '', frameCount = 0;
  let pendingStep = 0;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), up = new THREE.Vector3(0, 1, 0);
  let hovered: Actor | undefined;

  function fit() {
    const bounds = new THREE.Box3();
    actors.forEach(actor => {
      const half = new THREE.Vector3(...actor.descriptor.size).multiplyScalar(.5), point = new THREE.Vector3(...actor.descriptor.position);
      bounds.expandByPoint(point.clone().sub(half)); bounds.expandByPoint(point.clone().add(half));
    });
    if (bounds.isEmpty()) bounds.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(3, 1, 3));
    const gridOnly = [...actors.keys()].every(key => key.startsWith('cell-') || key.startsWith('axis-'));
    bounds.max.y = Math.max(bounds.max.y + .35, gridOnly ? .95 : 2.3);
    const center = bounds.getCenter(new THREE.Vector3()); center.y = gridOnly ? .18 : .65;
    camera.position.copy(center).add(new THREE.Vector3(5.5, 10, 9)); camera.lookAt(center); controls.target.copy(center);
    camera.updateMatrixWorld();
    let maxX = 0, maxY = 0;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [0, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      maxX = Math.max(maxX, Math.abs(point.x)); maxY = Math.max(maxY, Math.abs(point.y));
    }
    const aspect = Math.max(.2, host.clientWidth / Math.max(1, host.clientHeight));
    const height = Math.max(maxY, maxX / aspect, 1.8) * 1.18;
    camera.top = height; camera.bottom = -height; camera.left = -height * aspect; camera.right = height * aspect;
    camera.zoom = 1; camera.updateProjectionMatrix(); controls.update(); dirty = true;
  }

  function removeActor(actor: Actor) {
    world.remove(actor.group); actor.body.material.dispose(); actor.face.material.dispose(); actor.texture?.dispose();
  }

  function update(model: SceneModel, animate = true, step = 0) {
    pendingStep = step;
    const keys = new Set(model.nodes.map(node => node.key));
    for (const [key, actor] of actors) if (!keys.has(key)) { removeActor(actor); actors.delete(key); }
    for (const node of model.nodes) {
      let actor = actors.get(node.key);
      if (!actor) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: node.color, roughness: .38, metalness: .08 }));
        body.castShadow = true; body.receiveShadow = true;
        const face = new THREE.Mesh(faceGeometry, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        face.rotation.x = -Math.PI / 2; group.add(body, face); world.add(group);
        actor = { group, body, face, descriptor: node, target: new THREE.Vector3(...node.position), scale: new THREE.Vector3(...node.size) };
        group.position.copy(actor.target); if (!reducedMotion && animate) group.position.y -= .7;
        body.scale.copy(actor.scale); actors.set(node.key, actor);
      }
      if (actor.descriptor.label !== node.label || !actor.texture) {
        actor.texture?.dispose(); actor.texture = labelTexture(node.label); actor.face.material.map = actor.texture; actor.face.material.needsUpdate = true;
      }
      actor.descriptor = node; actor.target.set(...node.position); actor.scale.set(...node.size);
      if (reducedMotion || !animate) { actor.group.position.copy(actor.target); actor.body.scale.copy(actor.scale); actor.body.material.color.set(node.color); }
      actor.face.scale.set(Math.min(node.size[0] * .88, 2.2), .82, 1);
      actor.group.userData.caption = node.caption;
    }
    for (const connection of connections) { world.remove(connection.mesh); connection.mesh.material.dispose(); }
    connections = model.links.filter(link => actors.has(link.from) && actors.has(link.to)).map(link => {
      const mesh = new THREE.Mesh(linkGeometry, new THREE.MeshStandardMaterial({ color: link.highlighted ? '#139d84' : '#a5c0cf', roughness: .4, emissive: link.highlighted ? '#136a56' : '#000000', emissiveIntensity: .2 }));
      world.add(mesh); return { mesh, from: link.from, to: link.to };
    });
    const nextShape = model.nodes.map(node => `${node.key}:${node.position[0]}:${node.position[2]}`).join('|');
    if (nextShape !== shape) { shape = nextShape; fit(); }
    if (hovered && !actors.has(hovered.descriptor.key)) { hovered = undefined; onHover(''); }
    else if (hovered) onHover(hovered.descriptor.caption);
    dirty = true; settledFrames = 0; wake();
  }

  function draw(now: number) {
    animationFrame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = Math.min(.05, Math.max(.001, (now - lastTime) / 1000)); lastTime = now;
    let moving = false; const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 11);
    const targetColor = new THREE.Color();
    actors.forEach(actor => {
      const hoverOffset = hovered === actor ? .13 : 0, target = actor.target.clone(); target.y += hoverOffset;
      if (actor.group.position.distanceTo(target) > .002 || actor.body.scale.distanceTo(actor.scale) > .002) moving = true;
      actor.group.position.lerp(target, blend); actor.body.scale.lerp(actor.scale, blend);
      targetColor.set(actor.descriptor.color);
      const currentColor = actor.body.material.color;
      if (Math.abs(currentColor.r - targetColor.r) + Math.abs(currentColor.g - targetColor.g) + Math.abs(currentColor.b - targetColor.b) > .004) moving = true;
      actor.body.material.color.lerp(targetColor, blend);
      actor.face.position.y = actor.body.scale.y / 2 + .008;
    });
    connections.forEach(({ mesh, from, to }) => {
      const a = actors.get(from)!, b = actors.get(to)!;
      const start = a.group.position.clone(), end = b.group.position.clone(); start.y += a.body.scale.y / 2 + .035; end.y += b.body.scale.y / 2 + .035;
      const direction = end.clone().sub(start), distance = direction.length();
      mesh.position.copy(start.add(end).multiplyScalar(.5)); mesh.scale.y = distance;
      if (distance > 0) mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    });
    controls.autoRotate = spin && !reducedMotion; const cameraMoved = controls.update(delta);
    renderer.render(scene, camera); frameCount++; canvas.dataset.frames = String(frameCount); canvas.dataset.ready = 'true';
    canvas.dataset.nodes = String(actors.size); canvas.dataset.motion = reducedMotion ? 'reduced' : 'full';
    canvas.dataset.step = String(pendingStep);
    if (moving || cameraMoved || spin || dirty) { dirty = false; settledFrames = 0; }
    else settledFrames++;
    if (settledFrames < 3) wake();
  }

  function wake() { if (!animationFrame && !disposed && visible && !document.hidden) animationFrame = requestAnimationFrame(draw); }
  const resize = new ResizeObserver(() => { renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight)); fit(); wake(); }); resize.observe(host);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { lastTime = performance.now(); dirty = true; wake(); } }); observer.observe(host);
  const onVisibility = () => { lastTime = performance.now(); dirty = true; wake(); };
  const onChange = () => { dirty = true; wake(); }; controls.addEventListener('change', onChange);
  const onPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects([...actors.values()].map(actor => actor.body))[0];
    const next = hit ? [...actors.values()].find(actor => actor.body === hit.object) : undefined;
    if (next !== hovered) { hovered = next; onHover(next?.descriptor.caption ?? ''); dirty = true; wake(); }
  };
  const onLeave = () => { hovered = undefined; onHover(''); dirty = true; wake(); };
  const onLost = (event: Event) => { event.preventDefault(); onFailure(); };
  document.addEventListener('visibilitychange', onVisibility); canvas.addEventListener('pointermove', onPointer); canvas.addEventListener('pointerleave', onLeave); canvas.addEventListener('webglcontextlost', onLost);
  renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight)); update(initial);
  return {
    update,
    reset: () => { fit(); wake(); },
    zoom: (factor: number) => { camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, .65, 2.6); camera.updateProjectionMatrix(); dirty = true; wake(); },
    spin: (enabled: boolean) => { spin = enabled && !reducedMotion; dirty = true; wake(); },
    dispose: () => {
      disposed = true; cancelAnimationFrame(animationFrame); resize.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility); canvas.removeEventListener('pointermove', onPointer); canvas.removeEventListener('pointerleave', onLeave); canvas.removeEventListener('webglcontextlost', onLost);
      controls.removeEventListener('change', onChange); controls.dispose(); actors.forEach(removeActor);
      connections.forEach(c => c.mesh.material.dispose()); geometry.dispose(); faceGeometry.dispose(); linkGeometry.dispose(); floorGeometry.dispose(); floorMaterial.dispose();
      grid.geometry.dispose(); (grid.material as THREE.Material).dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
