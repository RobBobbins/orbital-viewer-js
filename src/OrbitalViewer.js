import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Analytical Math Engine (units of Bohr radius a_0) ---
function radialR(n, l, r) {
  if (r < 0) return 0;
  const rho = (2 * r) / n;
  if (n === 1 && l === 0) return 2 * Math.exp(-r);
  if (n === 2 && l === 0) return (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2);
  if (n === 2 && l === 1) return (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2);
  if (n === 3 && l === 0) return (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
  if (n === 3 && l === 1) return (4 / (81 * Math.sqrt(6))) * (6 * r - r * r) * Math.exp(-r / 3);
  if (n === 3 && l === 2) return (4 / (81 * Math.sqrt(30))) * (r * r) * Math.exp(-r / 3);
  if (n === 4 && l === 0) return (1 / 96) * (96 - 72 * r + 12 * r * r - r * r * r / 2) * Math.exp(-r / 4);
  if (n === 4 && l === 1) return (1 / (32 * Math.sqrt(15))) * (80 * r - 20 * r * r + r * r * r) * Math.exp(-r / 4);
  if (n === 4 && l === 2) return (1 / (96 * Math.sqrt(5))) * (12 * r * r - r * r * r) * Math.exp(-r / 4);
  if (n === 4 && l === 3) return (1 / (768 * Math.sqrt(35))) * Math.pow(r, 3) * Math.exp(-r / 4);
  return Math.pow(rho, l) * Math.exp(-rho / 2);
}

function realSphericalHarmonic(l, m, nx, ny, nz) {
  if (l === 0) return 1 / Math.sqrt(4 * Math.PI);
  if (l === 1) {
    const norm = Math.sqrt(3 / (4 * Math.PI));
    if (m === 0) return norm * nz;
    if (m === 1) return norm * nx;
    if (m === -1) return norm * ny;
  }
  if (l === 2) {
    if (m === 0) return Math.sqrt(5 / (16 * Math.PI)) * (3 * nz * nz - 1);
    if (m === 1) return Math.sqrt(15 / (4 * Math.PI)) * nx * nz;
    if (m === -1) return Math.sqrt(15 / (4 * Math.PI)) * ny * nz;
    if (m === 2) return Math.sqrt(15 / (16 * Math.PI)) * (nx * nx - ny * ny);
    if (m === -2) return Math.sqrt(15 / (4 * Math.PI)) * nx * ny;
  }
  if (l === 3) {
    if (m === 0) return Math.sqrt(7 / (16 * Math.PI)) * nz * (5 * nz * nz - 3);
    if (m === 1) return Math.sqrt(21 / (32 * Math.PI)) * nx * (5 * nz * nz - 1);
    if (m === -1) return Math.sqrt(21 / (32 * Math.PI)) * ny * (5 * nz * nz - 1);
    if (m === 2) return Math.sqrt(105 / (16 * Math.PI)) * nz * (nx * nx - ny * ny);
    if (m === -2) return Math.sqrt(105 / (4 * Math.PI)) * nx * ny * nz;
    if (m === 3) return Math.sqrt(35 / (32 * Math.PI)) * nx * (nx * nx - 3 * ny * ny);
    if (m === -3) return Math.sqrt(35 / (32 * Math.PI)) * ny * (3 * nx * nx - ny * ny);
  }
  return 1;
}

function psi(n, l, m, x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 1e-6) return l === 0 ? radialR(n, 0, 0) / Math.sqrt(4 * Math.PI) : 0;
  const R = radialR(n, l, r);
  const Y = realSphericalHarmonic(l, m, x / r, y / r, z / r);
  return R * Y;
}

function findMaxAmp(n, l, m, boxSize) {
  let maxA = 0;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const z = (i / steps) * boxSize - (boxSize / 2);
    for (let j = 0; j <= steps; j++) {
      const x = (j / steps) * boxSize - (boxSize / 2);
      const amp = Math.abs(psi(n, l, m, x, 0, z));
      if (amp > maxA) maxA = amp;
    }
  }
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * boxSize - (boxSize / 2);
    for (let j = 0; j <= steps; j++) {
      const x = (j / steps) * boxSize - (boxSize / 2);
      const amp = Math.abs(psi(n, l, m, x, y, 0));
      if (amp > maxA) maxA = amp;
    }
  }
  return maxA === 0 ? 1 : maxA;
}

function getDensityColor(val, maxVal, colorCurve = 0.70) {
  const norm = Math.min(1.0, Math.abs(val) / maxVal);
  const t = Math.pow(norm, colorCurve);
  let r = 0, g = 0, b = 0;
  if (t < 0.35) {
    const f = t / 0.35; r = 50 * f; g = 0; b = 90 * f;
  } else if (t < 0.75) {
    const f = (t - 0.35) / 0.40; r = 50 + 205 * f; g = 140 * f; b = 90 - 90 * f;
  } else {
    const f = (t - 0.75) / 0.25; r = 255; g = 140 + 115 * f; b = 255 * f;
  }
  return { r: Math.floor(r), g: Math.floor(g), b: Math.floor(b) };
}

const vertexShader = `
  varying vec3 vOrigin;
  varying vec3 vDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vOrigin = cameraPosition;
    vDirection = position; 
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  varying vec3 vOrigin;
  varying vec3 vDirection;
  
  uniform int u_n;
  uniform int u_l;
  uniform int u_m;
  uniform float u_maxAmp;
  uniform float u_boxSize;
  uniform mat4 u_inverseModelMatrix;

  float radialR(int n_val, int l_val, float r) {
      if (r < 0.0) return 0.0;
      if (n_val == 1 && l_val == 0) return 2.0 * exp(-r);
      if (n_val == 2 && l_val == 0) return (1.0 / (2.0 * sqrt(2.0))) * (2.0 - r) * exp(-r / 2.0);
      if (n_val == 2 && l_val == 1) return (1.0 / (2.0 * sqrt(6.0))) * r * exp(-r / 2.0);
      if (n_val == 3 && l_val == 0) return (2.0 / (81.0 * sqrt(3.0))) * (27.0 - 18.0 * r + 2.0 * r * r) * exp(-r / 3.0);
      if (n_val == 3 && l_val == 1) return (4.0 / (81.0 * sqrt(6.0))) * (6.0 * r - r * r) * exp(-r / 3.0);
      if (n_val == 3 && l_val == 2) return (4.0 / (81.0 * sqrt(30.0))) * (r * r) * exp(-r / 3.0);
      if (n_val == 4 && l_val == 0) return (1.0 / 96.0) * (96.0 - 72.0 * r + 12.0 * r * r - 0.5 * r * r * r) * exp(-r / 4.0);
      if (n_val == 4 && l_val == 1) return (1.0 / (32.0 * sqrt(15.0))) * (80.0 * r - 20.0 * r * r + r * r * r) * exp(-r / 4.0);
      if (n_val == 4 && l_val == 2) return (1.0 / (96.0 * sqrt(5.0))) * (12.0 * r * r - r * r * r) * exp(-r / 4.0);
      if (n_val == 4 && l_val == 3) return (1.0 / (768.0 * sqrt(35.0))) * r * r * r * exp(-r / 4.0);
      return 0.0;
  }

  float realSphericalHarmonic(int l_val, int m_val, float nx, float ny, float nz) {
      float PI = 3.14159265359;
      if (l_val == 0) return 1.0 / sqrt(4.0 * PI);
      if (l_val == 1) {
          float norm = sqrt(3.0 / (4.0 * PI));
          if (m_val == 0) return norm * nz;
          if (m_val == 1) return norm * nx;
          if (m_val == -1) return norm * ny;
      }
      if (l_val == 2) {
          if (m_val == 0) return sqrt(5.0 / (16.0 * PI)) * (3.0 * nz * nz - 1.0);
          if (m_val == 1) return sqrt(15.0 / (4.0 * PI)) * nx * nz;
          if (m_val == -1) return sqrt(15.0 / (4.0 * PI)) * ny * nz;
          if (m_val == 2) return sqrt(15.0 / (16.0 * PI)) * (nx * nx - ny * ny);
          if (m_val == -2) return sqrt(15.0 / (4.0 * PI)) * nx * ny;
      }
      if (l_val == 3) {
          if (m_val == 0) return sqrt(7.0 / (16.0 * PI)) * nz * (5.0 * nz * nz - 3.0);
          if (m_val == 1) return sqrt(21.0 / (32.0 * PI)) * nx * (5.0 * nz * nz - 1.0);
          if (m_val == -1) return sqrt(21.0 / (32.0 * PI)) * ny * (5.0 * nz * nz - 1.0);
          if (m_val == 2) return sqrt(105.0 / (16.0 * PI)) * nz * (nx * nx - ny * ny);
          if (m_val == -2) return sqrt(105.0 / (4.0 * PI)) * nx * ny * nz;
          if (m_val == 3) return sqrt(35.0 / (32.0 * PI)) * nx * (nx * nx - 3.0 * ny * ny);
          if (m_val == -3) return sqrt(35.0 / (32.0 * PI)) * ny * (3.0 * nx * nx - ny * ny);
      }
      return 1.0;
  }

  uniform float u_brightness;
  uniform float u_shadowBoost;
  uniform float u_coreExposure;
  uniform float u_colorCurve;

  vec3 getDensityColor(float val, float maxVal) {
      float norm = min(1.0, abs(val) / maxVal);
      float t = pow(norm, u_colorCurve);
      float r = 0.0, g = 0.0, b = 0.0;
      if (t < 0.35) {
          float f = t / 0.35; r = 50.0 * f; g = 0.0; b = 90.0 * f;
      } else if (t < 0.75) {
          float f = (t - 0.35) / 0.40; r = 50.0 + 205.0 * f; g = 140.0 * f; b = 90.0 - 90.0 * f;
      } else {
          float f = (t - 0.75) / 0.25; r = 255.0; g = 140.0 + 115.0 * f; b = 255.0 * f;
      }
      return vec3(r, g, b) / 255.0;
  }

  vec3 ACESFilm(vec3 x) {
      float a = 2.51; float b = 0.03; float c = 2.43; float d = 0.59; float e = 0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
  }

  void main() {
      vec4 localOrigin = u_inverseModelMatrix * vec4(vOrigin, 1.0);
      vec3 rayDir = normalize(vDirection - localOrigin.xyz);
      vec3 p = localOrigin.xyz;
      
      float radius = 30.0;
      float b_val = dot(p, rayDir);
      float c_val = dot(p, p) - radius * radius;
      float h = b_val * b_val - c_val;
      
      if (h < 0.0) discard;
      h = sqrt(h);
      float t0 = -b_val - h;
      float t1 = -b_val + h;
      t0 = max(t0, 0.0);
      if (t1 < 0.0) discard;
      
      int steps = 70;
      float stepSize = (t1 - t0) / float(steps);
      p += rayDir * t0;
      
      vec4 accum = vec4(0.0);
      float maxD = u_maxAmp * u_coreExposure;
      
      for (int i = 0; i < 70; i++) {
          float r_local = length(p);
          if (r_local > 0.001 && r_local < radius) {
              float r_phys = r_local * (u_boxSize / 60.0);
              float R = radialR(u_n, u_l, r_phys);
              float Y = realSphericalHarmonic(u_l, u_m, p.x/r_local, p.y/r_local, p.z/r_local);
              float val = R * Y;
              
              float density = (val * val) / (u_maxAmp * u_maxAmp);
              if (density > 0.0005) {
                  vec3 col = getDensityColor(val, maxD);
                  float alpha = pow(density, u_shadowBoost) * stepSize * 1.5;
                  accum.rgb += col * alpha;
                  accum.a += alpha;
              }
          }
          p += rayDir * stepSize;
      }
      
      vec3 mappedColor = ACESFilm(accum.rgb * u_brightness);
      gl_FragColor = vec4(mappedColor, 1.0);
  }
`;

export default class OrbitalViewer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      n: 4, l: 2, m: 0,
      brightness: 0.10,
      shadowBoost: 0.45,
      coreExposure: 0.60,
      colorCurve: 0.70,
      autoRotateSpeed: 1.5,
      ...options
    };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#050508');

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 65);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false; 
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = this.options.autoRotateSpeed;

    this.uniforms = {
      u_n: { value: this.options.n },
      u_l: { value: this.options.l },
      u_m: { value: this.options.m },
      u_maxAmp: { value: 1.0 },
      u_boxSize: { value: 30.0 },
      u_inverseModelMatrix: { value: new THREE.Matrix4() },
      u_brightness: { value: this.options.brightness },
      u_shadowBoost: { value: this.options.shadowBoost },
      u_coreExposure: { value: this.options.coreExposure },
      u_colorCurve: { value: this.options.colorCurve }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    const geometry = new THREE.SphereGeometry(30, 32, 32);
    this.volumeMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.volumeMesh);

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this.setQuantumNumbers(this.options.n, this.options.l, this.options.m);

    this._animationId = null;
    this._animate = this._animate.bind(this);
    this._animate();
  }

  setTuning(tuning) {
    if (tuning.brightness !== undefined) this.uniforms.u_brightness.value = tuning.brightness;
    if (tuning.shadowBoost !== undefined) this.uniforms.u_shadowBoost.value = tuning.shadowBoost;
    if (tuning.coreExposure !== undefined) this.uniforms.u_coreExposure.value = tuning.coreExposure;
    if (tuning.colorCurve !== undefined) this.uniforms.u_colorCurve.value = tuning.colorCurve;
  }

  setQuantumNumbers(n, l, m) {
    this.options.n = n;
    this.options.l = l;
    this.options.m = m;

    const boxSize = Math.max(14, n * n * 2.8);
    const maxAmp = findMaxAmp(n, l, m, boxSize);

    this.uniforms.u_n.value = n;
    this.uniforms.u_l.value = l;
    this.uniforms.u_m.value = m;
    this.uniforms.u_maxAmp.value = maxAmp;
    this.uniforms.u_boxSize.value = boxSize;
  }

  _onResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  _animate() {
    this._animationId = requestAnimationFrame(this._animate);
    this.controls.update();
    this.uniforms.u_inverseModelMatrix.value.copy(this.volumeMesh.matrixWorld).invert();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this._animationId);
    window.removeEventListener('resize', this._onResize);
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  /**
   * Generates a 2D probability density slice thumbnail for an orbital.
   * Very useful for creating interactive HTML galleries.
   */
  static generateThumbnail(n, l, m, resolution = 60) {
    const boxSize = Math.max(14, n * n * 2.8);
    const maxAmp = findMaxAmp(n, l, m, boxSize);
    const colorMax = maxAmp * 0.85;

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(resolution, resolution);
    
    let pIdx = 0;
    for (let py = 0; py < resolution; py++) {
      const z = ((resolution / 2 - py) / (resolution / 2)) * (boxSize / 2);
      for (let px = 0; px < resolution; px++) {
        const x = ((px - resolution / 2) / (resolution / 2)) * (boxSize / 2);
        
        const val = psi(n, l, m, x, 0, z); // XZ slice
        const color = getDensityColor(val, colorMax);
        
        imgData.data[pIdx++] = color.r;
        imgData.data[pIdx++] = color.g;
        imgData.data[pIdx++] = color.b;
        imgData.data[pIdx++] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }
}
