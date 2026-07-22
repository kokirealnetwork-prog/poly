"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Face = {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  vertices: THREE.Vector3[];
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);

function getFaces(geometry: THREE.BufferGeometry): Face[] {
  const position = geometry.getAttribute("position");
  const clusters: { normal: THREE.Vector3; vertices: THREE.Vector3[] }[] = [];

  for (let index = 0; index < position.count; index += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(position, index);
    const b = new THREE.Vector3().fromBufferAttribute(position, index + 1);
    const c = new THREE.Vector3().fromBufferAttribute(position, index + 2);
    const normal = new THREE.Vector3()
      .crossVectors(b.clone().sub(a), c.clone().sub(a))
      .normalize();
    let cluster = clusters.find((face) => face.normal.dot(normal) > 0.999);

    if (!cluster) {
      cluster = { normal, vertices: [] };
      clusters.push(cluster);
    }

    for (const vertex of [a, b, c]) {
      if (!cluster.vertices.some((point) => point.distanceToSquared(vertex) < 1e-8)) {
        cluster.vertices.push(vertex);
      }
    }
  }

  return clusters.map(({ normal, vertices }) => {
    const center = vertices
      .reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3())
      .multiplyScalar(1 / vertices.length);
    const horizontal = vertices[0].clone().sub(center).normalize();
    const vertical = new THREE.Vector3().crossVectors(normal, horizontal);
    const sortedVertices = vertices.toSorted(
      (a, b) =>
        Math.atan2(
          a.clone().sub(center).dot(vertical),
          a.clone().sub(center).dot(horizontal),
        ) -
        Math.atan2(
          b.clone().sub(center).dot(vertical),
          b.clone().sub(center).dot(horizontal),
        ),
    );

    return { center, normal, vertices: sortedVertices };
  });
}

export function Dodecahedron() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const geometry = new THREE.DodecahedronGeometry(2, 0);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf2a7bd,
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0,
      flatShading: true,
    });
    const solid = new THREE.Mesh(geometry, material);

    const edgeGeometry = new THREE.EdgesGeometry(geometry, 12);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x4e2834,
      transparent: true,
      opacity: 0.3,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

    const shape = new THREE.Group();
    shape.add(solid, edges);
    shape.rotation.set(-0.28, 0.5, 0.08);
    scene.add(shape);

    const faces = getFaces(geometry);
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xff2f87 });
    const outline = new THREE.Group();
    const outlineEdges = Array.from({ length: 5 }, () => {
      const edge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 1, 8),
        outlineMaterial,
      );
      outline.add(edge);
      return edge;
    });
    shape.add(outline);

    const showSelectedFace = (face: Face) => {
      const offset = face.normal.clone().multiplyScalar(0.018);

      outlineEdges.forEach((edge, index) => {
        const start = face.vertices[index]
          .clone()
          .lerp(face.center, 0.055)
          .add(offset);
        const end = face.vertices[(index + 1) % face.vertices.length]
          .clone()
          .lerp(face.center, 0.055)
          .add(offset);
        const direction = end.clone().sub(start);

        edge.position.copy(start).add(end).multiplyScalar(0.5);
        edge.scale.set(1, direction.length(), 1);
        edge.quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
      });
    };

    let selectedFaceIndex = 0;
    const updateSelectedFace = (vibrate = true) => {
      shape.updateMatrixWorld();
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestIndex = selectedFaceIndex;

      faces.forEach((face, index) => {
        const worldCenter = face.center.clone().applyMatrix4(shape.matrixWorld);
        const distance = worldCenter.distanceToSquared(camera.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex !== selectedFaceIndex) {
        selectedFaceIndex = nearestIndex;
        showSelectedFace(faces[selectedFaceIndex]);
        if (vibrate) navigator.vibrate?.(18);
      }
    };
    updateSelectedFace(false);
    showSelectedFace(faces[selectedFaceIndex]);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x5b674b, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x95aaff, 2.2);
    rimLight.position.set(5, -2, -3);
    scene.add(rimLight);

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;

      velocityX = event.clientX - previousX;
      velocityY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;

      const horizontal = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        velocityX * 0.009,
      );
      const vertical = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        velocityY * 0.009,
      );
      shape.quaternion.premultiply(horizontal).premultiply(vertical);
    };

    const stopDragging = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.classList.remove("is-dragging");
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", stopDragging);
    renderer.domElement.addEventListener("pointercancel", stopDragging);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animationFrame = 0;
    const animate = () => {
      if (!dragging && Math.abs(velocityX) + Math.abs(velocityY) > 0.02) {
        const horizontal = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          velocityX * 0.009,
        );
        const vertical = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          velocityY * 0.009,
        );
        shape.quaternion.premultiply(horizontal).premultiply(vertical);
        velocityX *= 0.94;
        velocityY *= 0.94;
      }

      updateSelectedFace();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", stopDragging);
      renderer.domElement.removeEventListener("pointercancel", stopDragging);
      geometry.dispose();
      edgeGeometry.dispose();
      material.dispose();
      edgeMaterial.dispose();
      outlineEdges.forEach((edge) => edge.geometry.dispose());
      outlineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="dodecahedron"
      role="img"
      aria-label="ドラッグして360度回転できる正十二面体"
    />
  );
}
