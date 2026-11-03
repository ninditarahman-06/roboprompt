/**
 * RoboPrompt 3D Robot Mascot Engine (Three.js)
 * Procedurally models and animates the cute white robot mascot with:
 * - Glossy white capsule head with curved dark LED visor
 * - Emissive cyan stadium/pill eyes with inward tilt and soft neon bloom
 * - Concentric headphone ear pods
 * - Segmented accordion neck
 * - Egg-shaped torso with recessed circular chest monitor & pulsating striped cyan heart
 * - Black curved arms with white socket cuffs & two silver metal plug prongs
 * - Thin black legs and rounded white shoes with dual dark accent grooves
 * - Interactive states: IDLE, EXPLAIN (speaking & pointing), CHEER, CONFUSE
 * - Interactive cursor tracking and tap reactions
 */

class Robot3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.robotGroup = null;
    this.torsoGroup = null;
    this.headGroup = null;
    this.leftArmGroup = null;
    this.rightArmGroup = null;
    this.leftHand = null;
    this.rightHand = null;
    this.chestHeartMat = null;
    this.visorCanvas = null;
    this.visorCtx = null;
    this.visorTexture = null;
    this.shadowMesh = null;

    // Animation & State
    this.state = 'IDLE'; // IDLE, EXPLAIN, CHEER, CONFUSE
    this.stateTimer = 0;
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.isSpeaking = false;
    this.speechWavePhase = 0;
    this.eyeMood = 'normal'; // 'normal', 'happy', 'confused'

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 340;
    const height = this.container.clientHeight || 480;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Well-balanced camera framing: showcases full character from shoes to plug prongs
    this.camera.position.set(0, 1.25, 5.2);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting (Studio Lighting matching reference render)
    this.setupLighting();

    // 4. Build Procedural Character
    this.buildRobot();

    // 5. Ground Contact Shadow
    this.createShadow();

    // 6. Interactive Event Listeners
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('click', (e) => this.onClick(e));

    // 7. Start Render Loop
    this.animate();
  }

  setupLighting() {
    // Soft Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Main Key Light (front-top-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(2.8, 4.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Soft Cyan Tech Fill Light (from left)
    const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.42);
    fillLight.position.set(-3.2, 2.0, 2.5);
    this.scene.add(fillLight);

    // Edge / Rim Light (from top-back)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.65);
    rimLight.position.set(0, 4.8, -3.5);
    this.scene.add(rimLight);
  }

  createVisorTexture() {
    this.visorCanvas = document.createElement('canvas');
    this.visorCanvas.width = 512;
    this.visorCanvas.height = 256;
    this.visorCtx = this.visorCanvas.getContext('2d');
    this.visorTexture = new THREE.CanvasTexture(this.visorCanvas);
    this.updateVisor();
    return this.visorTexture;
  }

  /**
   * Helper to draw a glowing stadium/pill LED element on the visor canvas
   */
  drawGlowingPill(ctx, cx, cy, w, h, angle, color, glowBlur) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const r = h / 2;
    const halfW = Math.max(0, (w - h) / 2);

    ctx.beginPath();
    ctx.arc(-halfW, 0, r, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(halfW, -r);
    ctx.arc(halfW, 0, r, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();

    // Outer Neon Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = glowBlur;
    ctx.fillStyle = color;
    ctx.fill();

    // Bright inner core for emissive OLED look
    const innerR = r * 0.55;
    const innerHalfW = halfW * 0.72;
    ctx.beginPath();
    ctx.arc(-innerHalfW, 0, innerR, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(innerHalfW, -innerR);
    ctx.arc(innerHalfW, 0, innerR, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#b8ffff';
    ctx.shadowBlur = 6;
    ctx.fill();

    ctx.restore();
  }

  updateVisor() {
    const ctx = this.visorCtx;
    if (!ctx) return;
    const w = this.visorCanvas.width;
    const h = this.visorCanvas.height;

    // Clear transparent canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Sleek Dark Rounded Visor Screen
    ctx.save();
    const xV = 24, yV = 22, wV = 464, hV = 212, radiusV = 65;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(xV, yV, wV, hV, radiusV);
    } else {
      // Manual rounded rect fallback
      ctx.moveTo(xV + radiusV, yV);
      ctx.lineTo(xV + wV - radiusV, yV);
      ctx.quadraticCurveTo(xV + wV, yV, xV + wV, yV + radiusV);
      ctx.lineTo(xV + wV, yV + hV - radiusV);
      ctx.quadraticCurveTo(xV + wV, yV + hV, xV + wV - radiusV, yV + hV);
      ctx.lineTo(xV + radiusV, yV + hV);
      ctx.quadraticCurveTo(xV, yV + hV, xV, yV + hV - radiusV);
      ctx.lineTo(xV, yV + radiusV);
      ctx.quadraticCurveTo(xV, yV, xV + radiusV, yV);
    }
    ctx.closePath();

    // Dark high-tech screen background
    ctx.fillStyle = '#060a12';
    ctx.fill();

    // Subtle glass gloss highlight
    const gloss = ctx.createLinearGradient(120, 20, 380, 200);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    gloss.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.fill();

    // Screen bezel stroke
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 2. Eye positions & tracking offsets
    const offsetX = this.mouse.x * 14;
    const offsetY = -this.mouse.y * 10;
    const leftEyeX = 175 + offsetX;
    const rightEyeX = 337 + offsetX;
    const eyeY = 120 + offsetY;

    if (this.isBlinking) {
      // Sleek horizontal blink slit pills
      this.drawGlowingPill(ctx, leftEyeX, eyeY, 48, 6, 0.10, '#00f0ff', 14);
      this.drawGlowingPill(ctx, rightEyeX, eyeY, 48, 6, -0.10, '#00f0ff', 14);
    } else if (this.eyeMood === 'happy') {
      // Cheerful inverted glowing arcs ^_^
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 22;

      // Left arc
      ctx.beginPath();
      ctx.arc(175 + offsetX * 0.5, 126 + offsetY * 0.5, 25, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Right arc
      ctx.beginPath();
      ctx.arc(337 + offsetX * 0.5, 126 + offsetY * 0.5, 25, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.restore();
    } else if (this.eyeMood === 'confused') {
      // Left eye normal pill, right eye question mark
      this.drawGlowingPill(ctx, leftEyeX, eyeY, 44, 32, 0.10, '#00f0ff', 20);

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(337 + offsetX * 0.5, 108 + offsetY * 0.5, 18, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(337 + offsetX * 0.5, 134 + offsetY * 0.5);
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(337 + offsetX * 0.5, 150 + offsetY * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Normal iconic Stadium / Pill eyes tilted inward (Exact match to character reference!)
      // Left eye tilted clockwise (+0.10 rad), Right eye tilted counter-clockwise (-0.10 rad)
      this.drawGlowingPill(ctx, leftEyeX, eyeY, 52, 34, 0.10, '#00f0ff', 22);
      this.drawGlowingPill(ctx, rightEyeX, eyeY, 52, 34, -0.10, '#00f0ff', 22);
    }

    // 3. Dynamic Digital Equalizer Mouth when Speaking
    if (this.isSpeaking) {
      ctx.save();
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;

      const numBars = 7;
      const startX = 216;
      const barSpacing = 12;
      const baseY = 196;

      for (let i = 0; i < numBars; i++) {
        const height = Math.abs(Math.sin(this.speechWavePhase + i * 0.85)) * 22 + 4;
        ctx.fillRect(startX + i * barSpacing, baseY - height / 2, 5, height);
      }
      ctx.restore();
    }

    if (this.visorTexture) {
      this.visorTexture.needsUpdate = true;
    }
  }

  createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Dark screen background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 256, 256);

    ctx.save();
    ctx.translate(128, 126);

    // Heart Path
    ctx.beginPath();
    const d = 58;
    ctx.moveTo(0, 38);
    ctx.bezierCurveTo(-d * 1.15, -8, -d * 1.35, -d, 0, -d * 0.65);
    ctx.bezierCurveTo(d * 1.35, -d, d * 1.15, -8, 0, 38);
    ctx.closePath();

    // Glowing Cyan fill
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    // Clip to heart and draw dark scanlines/stripes (Exact match to character reference!)
    ctx.clip();
    ctx.strokeStyle = '#060a12';
    ctx.lineWidth = 6;
    ctx.shadowBlur = 0;
    for (let y = -90; y <= 90; y += 13) {
      ctx.beginPath();
      ctx.moveTo(-110, y);
      ctx.lineTo(110, y);
      ctx.stroke();
    }
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  buildRobot() {
    this.robotGroup = new THREE.Group();
    // Balanced scale: comfortable framing, not overwhelming the viewport
    this.robotGroup.scale.set(0.78, 0.78, 0.78);
    this.robotGroup.position.y = -0.15;
    this.scene.add(this.robotGroup);

    // --- MATERIALS ---
    // Smooth glossy white ceramic body
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f6fa,
      roughness: 0.18,
      metalness: 0.05
    });

    // Dark matte rubber / metal joints & limbs
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.45,
      metalness: 0.25
    });

    // High-specular silver metal for plug prongs
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e6eb,
      roughness: 0.12,
      metalness: 0.95
    });

    // Curved Visor Material
    const visorMat = new THREE.MeshBasicMaterial({
      map: this.createVisorTexture(),
      transparent: true,
      depthWrite: false
    });

    // Glowing Chest Heart Monitor Material
    this.chestHeartMat = new THREE.MeshBasicMaterial({
      map: this.createHeartTexture(),
      transparent: true
    });

    // --- 1. TORSO ---
    this.torsoGroup = new THREE.Group();
    this.robotGroup.add(this.torsoGroup);

    // White Egg Body
    const bodyGeo = new THREE.SphereGeometry(0.72, 32, 28);
    bodyGeo.scale(0.95, 1.25, 0.92);
    const bodyMesh = new THREE.Mesh(bodyGeo, whiteMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.y = 1.05;
    this.torsoGroup.add(bodyMesh);

    // Hip nubs (curved leg socket bulges)
    const hipGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const leftHip = new THREE.Mesh(hipGeo, whiteMat);
    leftHip.position.set(-0.35, 0.45, 0);
    const rightHip = new THREE.Mesh(hipGeo, whiteMat);
    rightHip.position.set(0.35, 0.45, 0);
    this.torsoGroup.add(leftHip, rightHip);

    // Chest Screen Inset (Circular recessed dark monitor with glowing striped heart)
    const chestScreenGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32);
    chestScreenGeo.rotateX(Math.PI / 2);
    const chestScreenRim = new THREE.Mesh(chestScreenGeo, darkMat);
    chestScreenRim.position.set(0, 1.22, 0.66);

    const heartPlateGeo = new THREE.CircleGeometry(0.25, 32);
    const heartMesh = new THREE.Mesh(heartPlateGeo, this.chestHeartMat);
    heartMesh.position.set(0, 1.22, 0.70);
    this.torsoGroup.add(chestScreenRim, heartMesh);

    // --- 2. NECK ---
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 1.90, 0);
    this.torsoGroup.add(neckGroup);

    // Ribbed black accordion rings
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.16, 0.048, 12, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(ringGeo, darkMat);
      ringMesh.position.y = i * 0.085;
      neckGroup.add(ringMesh);
    }

    // --- 3. HEAD GROUP ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.25, 0);
    this.robotGroup.add(this.headGroup);

    // White Head Shell (Smooth glossy capsule)
    const headGeo = new THREE.SphereGeometry(0.72, 36, 32);
    headGeo.scale(1.22, 0.96, 1.05);
    const headMesh = new THREE.Mesh(headGeo, whiteMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Curved Visor Screen (Flush to front surface, UV mapped seamlessly)
    const visorGeo = new THREE.SphereGeometry(0.728, 32, 16, Math.PI * 0.22, Math.PI * 0.56, Math.PI * 0.34, Math.PI * 0.32);
    visorGeo.scale(1.225, 0.965, 1.055);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.headGroup.add(visorMesh);

    // Ear Pods (Concentric headphone-style cups on sides)
    this.buildEarPod(-0.89, whiteMat, darkMat);
    this.buildEarPod(0.89, whiteMat, darkMat);

    // --- 4. ARMS & PLUG-HANDS ---
    // Shoulder Spheres
    const shoulderGeo = new THREE.SphereGeometry(0.14, 16, 16);

    // Left Arm Hierarchy
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.65, 1.45, 0);
    this.robotGroup.add(this.leftArmGroup);

    const leftShoulder = new THREE.Mesh(shoulderGeo, whiteMat);
    this.leftArmGroup.add(leftShoulder);

    // Arm curve (Sweeping outwards and up into welcoming pose)
    const armCurveL = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.35, -0.05, 0.05),
      new THREE.Vector3(-0.62, 0.25, 0.05),
      new THREE.Vector3(-0.55, 0.65, 0.02)
    );
    const armGeoL = new THREE.TubeGeometry(armCurveL, 20, 0.062, 16, false);
    const leftArmMesh = new THREE.Mesh(armGeoL, darkMat);
    this.leftArmGroup.add(leftArmMesh);

    // Left Plug-Hand
    this.leftHand = new THREE.Group();
    this.leftHand.position.set(-0.55, 0.65, 0.02);
    this.leftHand.rotation.z = 0.24; // Tilted slightly inward
    this.leftArmGroup.add(this.leftHand);
    this.buildPlugHand(this.leftHand, whiteMat, silverMat);

    // Right Arm Hierarchy
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.65, 1.45, 0);
    this.robotGroup.add(this.rightArmGroup);

    const rightShoulder = new THREE.Mesh(shoulderGeo, whiteMat);
    this.rightArmGroup.add(rightShoulder);

    const armCurveR = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.35, -0.05, 0.05),
      new THREE.Vector3(0.62, 0.25, 0.05),
      new THREE.Vector3(0.55, 0.65, 0.02)
    );
    const armGeoR = new THREE.TubeGeometry(armCurveR, 20, 0.062, 16, false);
    const rightArmMesh = new THREE.Mesh(armGeoR, darkMat);
    this.rightArmGroup.add(rightArmMesh);

    // Right Plug-Hand
    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0.55, 0.65, 0.02);
    this.rightHand.rotation.z = -0.24; // Tilted slightly inward
    this.rightArmGroup.add(this.rightHand);
    this.buildPlugHand(this.rightHand, whiteMat, silverMat);

    // --- 5. LEGS & FEET ---
    const legGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.55, 16);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.set(-0.28, 0.38, 0);
    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.set(0.28, 0.38, 0);
    this.robotGroup.add(leftLeg, rightLeg);

    // Rounded white shoes with twin dark accent grooves
    this.buildFoot(-0.28, whiteMat, darkMat);
    this.buildFoot(0.28, whiteMat, darkMat);
  }

  buildEarPod(posX, whiteMat, darkMat) {
    const earGroup = new THREE.Group();
    earGroup.position.set(posX, 0, 0);
    this.headGroup.add(earGroup);

    // Outer white rim
    const outerGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 28);
    outerGeo.rotateZ(Math.PI / 2);
    const outerMesh = new THREE.Mesh(outerGeo, whiteMat);
    earGroup.add(outerMesh);

    // Dark recessed groove ring
    const grooveGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 28);
    grooveGeo.rotateZ(Math.PI / 2);
    const grooveMesh = new THREE.Mesh(grooveGeo, darkMat);
    earGroup.add(grooveMesh);

    // Center white disc
    const innerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 28);
    innerGeo.rotateZ(Math.PI / 2);
    const innerMesh = new THREE.Mesh(innerGeo, whiteMat);
    earGroup.add(innerMesh);
  }

  buildPlugHand(parentGroup, whiteMat, silverMat) {
    // White socket cup: bottom radius 0.13 (attaches to black arm), top radius 0.20 (rim)
    const cupGeo = new THREE.CylinderGeometry(0.20, 0.13, 0.28, 24);
    const cupMesh = new THREE.Mesh(cupGeo, whiteMat);
    cupMesh.position.y = 0.14;
    cupMesh.castShadow = true;
    parentGroup.add(cupMesh);

    // Rim torus accent around cup opening
    const rimGeo = new THREE.TorusGeometry(0.20, 0.018, 8, 24);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, whiteMat);
    rimMesh.position.y = 0.28;
    parentGroup.add(rimMesh);

    // Dark inset plate inside the socket
    const faceGeo = new THREE.CircleGeometry(0.19, 24);
    faceGeo.rotateX(-Math.PI / 2);
    const faceMesh = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.8 }));
    faceMesh.position.y = 0.278;
    parentGroup.add(faceMesh);

    // 2 Silver Metal Plug Prongs with rounded tips (Exact match to character reference!)
    const prongGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.24, 16);
    const capGeo = new THREE.SphereGeometry(0.036, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);

    // Prong 1 (Left pin)
    const prong1 = new THREE.Mesh(prongGeo, silverMat);
    prong1.position.set(-0.075, 0.40, 0);
    const cap1 = new THREE.Mesh(capGeo, silverMat);
    cap1.position.set(-0.075, 0.52, 0);
    prong1.castShadow = true;

    // Prong 2 (Right pin)
    const prong2 = new THREE.Mesh(prongGeo, silverMat);
    prong2.position.set(0.075, 0.40, 0);
    const cap2 = new THREE.Mesh(capGeo, silverMat);
    cap2.position.set(0.075, 0.52, 0);
    prong2.castShadow = true;

    parentGroup.add(prong1, cap1, prong2, cap2);
  }

  buildFoot(posX, whiteMat, darkMat) {
    const footGroup = new THREE.Group();
    footGroup.position.set(posX, 0.02, 0.02);
    this.robotGroup.add(footGroup);

    // Base circular white shoe
    const shoeGeo = new THREE.CylinderGeometry(0.19, 0.21, 0.14, 28);
    const shoeMesh = new THREE.Mesh(shoeGeo, whiteMat);
    shoeMesh.position.y = 0.07;
    shoeMesh.castShadow = true;
    footGroup.add(shoeMesh);

    // Rounded dome top
    const domeGeo = new THREE.SphereGeometry(0.19, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, whiteMat);
    domeMesh.position.y = 0.14;
    footGroup.add(domeMesh);

    // Dual horizontal dark groove lines running around rim
    const grooveGeo = new THREE.TorusGeometry(0.195, 0.012, 8, 28);
    grooveGeo.rotateX(Math.PI / 2);
    const groove1 = new THREE.Mesh(grooveGeo, darkMat);
    groove1.position.y = 0.09;
    const groove2 = new THREE.Mesh(grooveGeo, darkMat);
    groove2.position.y = 0.04;
    footGroup.add(groove1, groove2);
  }

  createShadow() {
    // Soft radial ground contact shadow
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(11, 42, 74, 0.38)');
    grad.addColorStop(0.5, 'rgba(11, 42, 74, 0.14)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = -0.14;
    this.scene.add(this.shadowMesh);
  }

  // --- Animation States & Speaking Control ---
  setSpeaking(speaking) {
    this.isSpeaking = speaking;
    if (speaking) {
      this.setState('EXPLAIN');
    } else {
      if (this.state === 'EXPLAIN') {
        this.setState('IDLE');
      }
    }
    this.updateVisor();
  }

  setState(newState, duration = 0) {
    this.state = newState;
    this.stateTimer = 0;

    if (newState === 'CHEER') {
      this.eyeMood = 'happy';
      if (window.audioMgr) window.audioMgr.successChime();
    } else if (newState === 'CONFUSE') {
      this.eyeMood = 'confused';
      if (window.audioMgr) window.audioMgr.errorBuzz();
    } else {
      this.eyeMood = 'normal';
    }

    this.updateVisor();

    if (duration > 0) {
      setTimeout(() => {
        if (this.state === newState) {
          this.setState('IDLE');
        }
      }, duration);
    }
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized mouse (-1 to 1)
    this.mouse.targetX = (x / rect.width) * 2 - 1;
    this.mouse.targetY = -(y / rect.height) * 2 + 1;
  }

  onClick(e) {
    if (window.audioMgr) window.audioMgr.stopSpeech();
    this.setSpeaking(false);
    if (window.app && typeof window.app.onRobotClicked === 'function') {
      window.app.onRobotClicked();
    } else {
      this.setState('CHEER', 2200);
      if (window.audioMgr) window.audioMgr.robotChirp();
      if (window.app) window.app.showRobotDialogue("Halo! Aku Robo-Prompt! Klik aku lagi untuk mendengarkan berbagai fakta seru seputar Rekayasa Prompt AI!");
    }
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth || 340;
    const height = this.container.clientHeight || 480;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Smooth cursor tracking interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // Natural blinking cycle (~3.5 seconds)
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.6) {
      this.isBlinking = true;
      this.updateVisor();
      if (this.blinkTimer > 3.75) {
        this.isBlinking = false;
        this.updateVisor();
        this.blinkTimer = 0;
      }
    }

    // Dynamic speaking wave animation
    if (this.isSpeaking) {
      this.speechWavePhase += delta * 15;
      this.updateVisor();
    }

    // Heart Monitor gentle breathing pulse
    if (this.chestHeartMat) {
      const pulseSpeed = this.state === 'CHEER' || this.isSpeaking ? 7.5 : 3.2;
      const pulse = 0.86 + Math.sin(time * pulseSpeed) * 0.14;
      this.chestHeartMat.opacity = pulse;
    }

    // --- State-based Posing & Animation ---
    switch (this.state) {
      case 'IDLE':
        // Gentle rhythmic breathing / bobbing
        const bob = Math.sin(time * 2.2) * 0.04;
        this.robotGroup.position.y = -0.15 + bob;
        if (this.shadowMesh) {
          const s = 1.0 - bob * 0.4;
          this.shadowMesh.scale.set(s, s, 1.0);
        }

        // Head smoothly tracks cursor with subtle breathing tilt
        this.headGroup.rotation.y = this.mouse.x * 0.42;
        this.headGroup.rotation.x = -this.mouse.y * 0.22;
        this.headGroup.rotation.z = Math.sin(time * 1.5) * 0.02;

        // Signature Welcoming Pose: Both arms curved up, swaying gently with breath
        this.leftArmGroup.rotation.z = Math.sin(time * 2.0) * 0.04;
        this.rightArmGroup.rotation.z = -Math.sin(time * 2.0) * 0.04;
        this.leftHand.rotation.y = Math.sin(time * 1.6) * 0.06;
        this.rightHand.rotation.y = -Math.sin(time * 1.6) * 0.06;
        break;

      case 'EXPLAIN':
        // Head turns toward content (left) and nods gently while speaking
        const speakNod = this.isSpeaking ? Math.sin(time * 6.5) * 0.07 : 0;
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, -0.42 + (this.mouse.x * 0.12), 0.1);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0.06 + speakNod, 0.1);
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, -0.05, 0.1);

        // Left arm gestures & points towards the learning module on the left!
        const armGesture = this.isSpeaking ? Math.sin(time * 3.8) * 0.10 : 0;
        this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0.68 + armGesture, 0.1);
        this.leftArmGroup.rotation.y = THREE.MathUtils.lerp(this.leftArmGroup.rotation.y, 0.38, 0.1);
        this.leftHand.rotation.z = THREE.MathUtils.lerp(this.leftHand.rotation.z, 0.32, 0.1);

        // Right arm subtle expressive balance
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -0.15 + (this.isSpeaking ? Math.cos(time * 3.0) * 0.06 : 0), 0.1);
        break;

      case 'CHEER':
        // Energetic celebratory bounce
        const cheerJump = Math.abs(Math.sin(time * 7.5)) * 0.18;
        this.robotGroup.position.y = -0.15 + cheerJump;

        // Both arms raised high, waving plug prongs excitedly!
        this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0.45 + Math.sin(time * 8.0) * 0.12, 0.15);
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -0.45 - Math.sin(time * 8.0) * 0.12, 0.15);
        this.leftHand.rotation.z = THREE.MathUtils.lerp(this.leftHand.rotation.z, 0.35, 0.15);
        this.rightHand.rotation.z = THREE.MathUtils.lerp(this.rightHand.rotation.z, -0.35, 0.15);

        // Head nods excitedly
        this.headGroup.rotation.x = Math.sin(time * 7.0) * 0.14;
        this.headGroup.rotation.y = 0;
        this.headGroup.rotation.z = Math.sin(time * 5.0) * 0.06;
        break;

      case 'CONFUSE':
        // Head tilted curiously
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0.32, 0.1);
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, 0.22, 0.1);

        // Right arm raises to scratch head
        this.rightArmGroup.rotation.z = THREE.MathUtils.lerp(this.rightArmGroup.rotation.z, -0.82, 0.1);
        this.rightArmGroup.rotation.y = THREE.MathUtils.lerp(this.rightArmGroup.rotation.y, 0.55, 0.1);
        this.rightHand.rotation.x = Math.sin(time * 6.0) * 0.18;

        // Left arm slightly puzzled
        this.leftArmGroup.rotation.z = THREE.MathUtils.lerp(this.leftArmGroup.rotation.z, 0.18, 0.1);
        break;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Robot3D = Robot3D;
