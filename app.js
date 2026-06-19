// ==========================================================
// RLC Circuit Dynamics - Three.js Scrollmation Controller
// ==========================================================

// --- State Variables ---
let scene, camera, renderer, clock;
let radioGroup, pcbGroup, componentsGroup;
let resistorMesh, inductorCoil, capacitorPlates;
let electrons = [];
let crtCanvas, crtContext, crtTexture;
let pointLightGlow;
let gaugeNeedle;

// Animation / Scroll Targets
let currentScrollFraction = 0;
let targetCameraPos = new THREE.Vector3(0, 0, 10);
let targetCameraLookAt = new THREE.Vector3(0, 0, 0);
let cameraPos = new THREE.Vector3(0, 0, 10);
let cameraLookAt = new THREE.Vector3(0, 0, 0);

// Physics state based on damping case
let dampingMode = 'intro'; // 'intro', 'pcb', 'under', 'critical', 'over'
let electronSpeedMultiplier = 1;
let wavePhase = 0;

// Text overlays mapping
const stateTitles = {
    'intro': 'Vintage Radio Receiver',
    'pcb': 'RLC Circuit Board Inside',
    'under': 'Underdamped State (R = 2 Ω)',
    'critical': 'Critically Damped State (R = 20 Ω)',
    'over': 'Overdamped State (R = 100 Ω)'
};

const stateDescs = {
    'intro': 'Scrolling down will reveal the inner workings of this vintage tuner.',
    'pcb': 'Resistor (R), Inductor (L), and Capacitor (C) wired in series on the main board.',
    'under': 'High oscillation (ringing) of electrons. Voltage swings back and forth decaying slowly.',
    'critical': 'Optimal damping. Current returns to steady state in minimal time without oscillating.',
    'over': 'Excessive resistance slows down charge accumulation. Sluggish rise, no oscillation.'
};

// --- Initialisation ---
function init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = null; // transparent background, let CSS handle it

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.copy(cameraPos);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0e172a, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x06b6d4, 1.0, 15);
    blueLight.position.set(-2, 3, 2);
    scene.add(blueLight);

    pointLightGlow = new THREE.PointLight(0xffffff, 0.0, 10);
    pointLightGlow.position.set(0, 0, 0);
    scene.add(pointLightGlow);

    // 5. Create 3D Models
    createCRTTexture();
    createModels();
    createElectrons();

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', handleScroll);

    // Initial trigger
    handleScroll();

    // 7. Start Animation Loop
    animate();
}

// --- Create Offscreen Canvas for Oscilloscope (CRT) Screen ---
function createCRTTexture() {
    crtCanvas = document.createElement('canvas');
    crtCanvas.width = 256;
    crtCanvas.height = 256;
    crtContext = crtCanvas.getContext('2d');
    
    crtTexture = new THREE.CanvasTexture(crtCanvas);
}

function updateCRT(deltaTime) {
    if (!crtContext) return;
    wavePhase += deltaTime * 5;

    // Draw background
    crtContext.fillStyle = '#020617';
    crtContext.fillRect(0, 0, 256, 256);

    // Draw grid
    crtContext.strokeStyle = '#0f172a';
    crtContext.lineWidth = 1;
    for (let i = 0; i < 256; i += 32) {
        // Vertical lines
        crtContext.beginPath();
        crtContext.moveTo(i, 0);
        crtContext.lineTo(i, 256);
        crtContext.stroke();
        // Horizontal lines
        crtContext.beginPath();
        crtContext.moveTo(0, i);
        crtContext.lineTo(256, i);
        crtContext.stroke();
    }

    // Draw crosshair
    crtContext.strokeStyle = '#1e293b';
    crtContext.beginPath();
    crtContext.moveTo(128, 0); crtContext.lineTo(128, 256);
    crtContext.moveTo(0, 128); crtContext.lineTo(256, 128);
    crtContext.stroke();

    // Draw wave
    crtContext.strokeStyle = '#22c55e';
    if (dampingMode === 'under') crtContext.strokeStyle = '#06b6d4';
    if (dampingMode === 'critical') crtContext.strokeStyle = '#10b981';
    if (dampingMode === 'over') crtContext.strokeStyle = '#ef4444';

    crtContext.lineWidth = 2.5;
    crtContext.shadowColor = crtContext.strokeStyle;
    crtContext.shadowBlur = 8;
    crtContext.beginPath();

    for (let x = 0; x < 256; x++) {
        let t = (x / 256) * 10; // 0 to 10 seconds represented
        let y = 0;

        switch (dampingMode) {
            case 'intro': // static noise
                y = Math.sin(t * 12 + wavePhase) * 5 + Math.sin(t * 40 + wavePhase * 3) * 2;
                break;
            case 'pcb': // base slow wave
                y = Math.sin(t * 2 + wavePhase) * 15;
                break;
            case 'under': // Underdamped AC/DC response. We render AC ringing
                // q(t) = 40 * sin(4*t + phase) * exp(-0.3*t)
                y = 40 * Math.sin(t * 6 - wavePhase) * Math.exp(-0.25 * t);
                break;
            case 'critical': // Critically damped response
                // q(t) = 80 * t * exp(-t)
                y = 80 * t * Math.exp(-0.7 * t) - 40; // shifted down
                break;
            case 'over': // Overdamped response
                // q(t) = 60 * (1 - exp(-0.4*t))
                y = 60 * (1 - Math.exp(-0.5 * t)) - 30; // shifted down
                break;
        }

        let canvasY = 128 - y; // invert because canvas y goes down
        if (x === 0) {
            crtContext.moveTo(x, canvasY);
        } else {
            crtContext.lineTo(x, canvasY);
        }
    }
    crtContext.stroke();
    crtContext.shadowBlur = 0; // reset shadow

    // Trigger texture update
    crtTexture.needsUpdate = true;
}

// --- Create 3D Models ---
function createModels() {
    radioGroup = new THREE.Group();
    scene.add(radioGroup);

    // ==========================================
    // 1. Radio Casing Model
    // ==========================================
    const casingGeo = new THREE.BoxGeometry(6, 4.5, 3.5);
    const casingMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b18, // Retro wood/metallic dark brown
        roughness: 0.6,
        metalness: 0.2
    });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.position.set(0, 0, 0);
    radioGroup.add(casing);

    // Bezel for front face
    const bezelGeo = new THREE.BoxGeometry(5.8, 4.3, 0.1);
    const bezelMat = new THREE.MeshStandardMaterial({
        color: 0x2d2a26,
        roughness: 0.4,
        metalness: 0.7
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, 0, 1.76);
    radioGroup.add(bezel);

    // Speaker mesh grill
    const grillGeo = new THREE.PlaneGeometry(3.0, 3.5);
    const grillMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    const grill = new THREE.Mesh(grillGeo, grillMat);
    grill.position.set(-1.1, 0, 1.82);
    radioGroup.add(grill);

    // Oscilloscope Bezel Ring
    const ringGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 32);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.3,
        metalness: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(1.4, 0.8, 1.82);
    radioGroup.add(ring);

    // Oscilloscope Screen (using our CRT Canvas texture!)
    const screenGeo = new THREE.CircleGeometry(0.82, 32);
    const screenMat = new THREE.MeshBasicMaterial({
        map: crtTexture,
        side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(1.4, 0.8, 1.91);
    radioGroup.add(screen);

    // Dials (Volume & Tuning)
    const dialGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    const dialMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.5,
        metalness: 0.6
    });
    
    const dialVol = new THREE.Mesh(dialGeo, dialMat);
    dialVol.rotation.x = Math.PI / 2;
    dialVol.position.set(0.9, -1.0, 1.85);
    radioGroup.add(dialVol);

    const dialTune = new THREE.Mesh(dialGeo, dialMat);
    dialTune.rotation.x = Math.PI / 2;
    dialTune.position.set(1.9, -1.0, 1.85);
    radioGroup.add(dialTune);

    // Dial Indicators
    const indGeo = new THREE.BoxGeometry(0.04, 0.12, 0.22);
    const indMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    
    const indVol = new THREE.Mesh(indGeo, indMat);
    indVol.position.set(0.9, -0.85, 1.88);
    radioGroup.add(indVol);

    const indTune = new THREE.Mesh(indGeo, indMat);
    indTune.position.set(1.9, -0.85, 1.88);
    radioGroup.add(indTune);

    // ==========================================
    // 2. PCB / Circuit Board (Mounted inside/on back)
    // ==========================================
    pcbGroup = new THREE.Group();
    pcbGroup.position.set(0, 0, -1.8); // Mount on the back of the radio
    pcbGroup.rotation.y = Math.PI; // Face the opposite direction
    radioGroup.add(pcbGroup);

    // PCB Board Plate
    const pcbPlateGeo = new THREE.BoxGeometry(5.4, 3.8, 0.1);
    const pcbPlateMat = new THREE.MeshStandardMaterial({
        color: 0x064e3b, // Dark green PCB color
        roughness: 0.7,
        metalness: 0.1
    });
    const pcbPlate = new THREE.Mesh(pcbPlateGeo, pcbPlateMat);
    pcbGroup.add(pcbPlate);

    // Components Group
    componentsGroup = new THREE.Group();
    pcbGroup.add(componentsGroup);

    // A. Resistor (Bottom segment of board)
    // Casing: Cylinder
    const resGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 16);
    const resMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Amber body color
        roughness: 0.4
    });
    resistorMesh = new THREE.Mesh(resGeo, resMat);
    resistorMesh.rotation.z = Math.PI / 2;
    resistorMesh.position.set(0, -1.0, 0.25);
    componentsGroup.add(resistorMesh);

    // Resistor stripes
    const stripeGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16);
    const stripeMats = [
        new THREE.MeshBasicMaterial({ color: 0xef4444 }), // red
        new THREE.MeshBasicMaterial({ color: 0x3b82f6 }), // blue
        new THREE.MeshBasicMaterial({ color: 0xeab308 }), // yellow
    ];
    for(let i=0; i<3; i++) {
        const stripe = new THREE.Mesh(stripeGeo, stripeMats[i]);
        stripe.rotation.z = Math.PI / 2;
        stripe.position.set(-0.25 + i * 0.25, -1.0, 0.25);
        componentsGroup.add(stripe);
    }

    // B. Inductor (Right segment of board - which is left from back view)
    // Procedural coil coil helix
    const coilPoints = [];
    const coils = 6;
    const segments = 120;
    const height = 1.2;
    const radius = 0.25;

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * (coils * Math.PI * 2);
        const y = (i / segments) * height - (height / 2);
        const x = Math.sin(theta) * radius;
        const z = Math.cos(theta) * radius;
        coilPoints.push(new THREE.Vector3(x, y, z));
    }

    const coilCurve = new THREE.CatmullRomCurve3(coilPoints);
    const coilGeo = new THREE.TubeGeometry(coilCurve, 64, 0.05, 8, false);
    const coilMat = new THREE.MeshStandardMaterial({
        color: 0xb45309, // Copper color
        roughness: 0.2,
        metalness: 0.9
    });
    inductorCoil = new THREE.Mesh(coilGeo, coilMat);
    inductorCoil.position.set(-1.8, 0, 0.3);
    componentsGroup.add(inductorCoil);

    // Core rod inside inductor
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 16);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Iron core grey
        metalness: 0.7,
        roughness: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(-1.8, 0, 0.3);
    componentsGroup.add(core);

    // C. Capacitor (Top segment of board)
    // Two parallel plates
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 1.0, 0.2);
    componentsGroup.add(capGroup);

    const plateGeo = new THREE.BoxGeometry(0.1, 0.6, 0.6);
    const plateMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Cool cyan metal plates
        metalness: 0.8,
        roughness: 0.3
    });
    
    const plateLeft = new THREE.Mesh(plateGeo, plateMat);
    plateLeft.position.set(-0.15, 0, 0);
    capGroup.add(plateLeft);

    const plateRight = new THREE.Mesh(plateGeo, plateMat);
    plateRight.position.set(0.15, 0, 0);
    capGroup.add(plateRight);

    // D. Interconnecting Wires on PCB
    // We draw flat metallic lines on the board to form a circuit loop
    const wirePoints = [
        new THREE.Vector3(-1.8, -1.0, 0.1), // from Inductor
        new THREE.Vector3(-0.6, -1.0, 0.1), // to Resistor
        new THREE.Vector3(0.6, -1.0, 0.1),  // from Resistor
        new THREE.Vector3(1.8, -1.0, 0.1),  // to Right side
        new THREE.Vector3(1.8, 1.0, 0.1),   // to Capacitor
        new THREE.Vector3(0.2, 1.0, 0.1),   // to Capacitor plate
        new THREE.Vector3(-0.2, 1.0, 0.1),  // from Capacitor plate
        new THREE.Vector3(-1.8, 1.0, 0.1),  // to Left side
        new THREE.Vector3(-1.8, -1.0, 0.1), // back to Inductor
    ];
    
    // Build actual 3D tubes for wires
    for(let i=0; i<wirePoints.length-1; i++) {
        const p1 = wirePoints[i];
        const p2 = wirePoints[i+1];
        
        // Skip crossing capacitor gap directly
        if(p1.x === 0.2 && p2.x === -0.2) continue;

        const distance = p1.distanceTo(p2);
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        
        const wireGeo = new THREE.CylinderGeometry(0.04, 0.04, distance, 8);
        const wireMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            metalness: 0.7,
            roughness: 0.4
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        
        wire.position.copy(midPoint);
        // Align cylinder with vector between points
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        const alignAxis = new THREE.Vector3(0, 1, 0);
        wire.quaternion.setFromUnitVectors(alignAxis, direction);
        
        componentsGroup.add(wire);
    }

    // ==========================================
    // 3. Analog Gauge (Charge Meter)
    // ==========================================
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(2.8, 0.5, 0.5); // Place to the right side of the PCB
    gaugeGroup.rotation.y = -Math.PI / 8; // Angle it slightly towards the camera
    pcbGroup.add(gaugeGroup);

    // Gauge backplate
    const gaugeBackGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
    const gaugeBackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.8 });
    const gaugeBack = new THREE.Mesh(gaugeBackGeo, gaugeBackMat);
    gaugeBack.rotation.x = Math.PI / 2;
    gaugeGroup.add(gaugeBack);

    // Gauge face
    const gaugeFaceGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.12, 32);
    const gaugeFaceMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const gaugeFace = new THREE.Mesh(gaugeFaceGeo, gaugeFaceMat);
    gaugeFace.rotation.x = Math.PI / 2;
    gaugeGroup.add(gaugeFace);

    // Target tick mark (Steady state = 1.0)
    const tickGeo = new THREE.BoxGeometry(0.06, 0.2, 0.14);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.set(0, 0.65, 0); // top center (target)
    gaugeGroup.add(tick);
    
    // Zero tick mark (q = 0)
    const tickZero = new THREE.Mesh(tickGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
    tickZero.position.set(-0.56, 0.32, 0);
    tickZero.rotation.z = -Math.PI / 3;
    gaugeGroup.add(tickZero);

    // Needle
    const needleGeo = new THREE.BoxGeometry(0.04, 0.7, 0.14);
    // Shift needle geometry so it pivots at the bottom
    needleGeo.translate(0, 0.35, 0);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    gaugeNeedle = new THREE.Mesh(needleGeo, needleMat);
    gaugeNeedle.position.set(0, -0.1, 0.08); // Pivot point
    gaugeNeedle.rotation.z = Math.PI / 3; // start at 0 charge
    gaugeGroup.add(gaugeNeedle);
}

// --- Create Electrons Particle System ---
// We create glowing spheres that travel along the loop wire
function createElectrons() {
    const electronCount = 20;
    
    // We define the closed path on the PCB loop
    // Coordinates relative to pcbGroup
    // Loop path coordinates: Inductor -> Resistor -> Right wire -> Capacitor -> Left wire -> Inductor
    const pathPoints = [
        new THREE.Vector3(-1.8, 0, 0.3),     // Inductor middle
        new THREE.Vector3(-1.8, -1.0, 0.15), // bottom left
        new THREE.Vector3(0, -1.0, 0.25),    // Resistor
        new THREE.Vector3(1.8, -1.0, 0.15),  // bottom right
        new THREE.Vector3(1.8, 1.0, 0.15),   // top right
        new THREE.Vector3(0.15, 1.0, 0.2),   // Capacitor right plate
        // jump capacitor gap
        new THREE.Vector3(-0.15, 1.0, 0.2),  // Capacitor left plate
        new THREE.Vector3(-1.8, 1.0, 0.15),  // top left
    ];

    const loopCurve = new THREE.CatmullRomCurve3(pathPoints, true); // true = closed loop

    const elGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const elMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan glow

    for(let i=0; i<electronCount; i++) {
        const mesh = new THREE.Mesh(elGeo, elMat.clone());
        pcbGroup.add(mesh);
        
        electrons.push({
            mesh: mesh,
            curve: loopCurve,
            progress: i / electronCount // spread evenly along loop
        });
    }
}

// --- Update Electron Positions along loop ---
function updateElectrons(deltaTime) {
    if (electrons.length === 0) return;

    electrons.forEach(el => {
        let speed = deltaTime * 0.05 * electronSpeedMultiplier;

        // Apply physics motion based on damping state
        switch(dampingMode) {
            case 'intro':
                // slow constant current
                el.progress += speed * 0.5;
                el.mesh.material.color.setHex(0x06b6d4); // base blue
                break;
                
            case 'pcb':
                // alternating slow current
                el.progress += speed * Math.sin(clock.getElapsedTime() * 1.5);
                el.mesh.material.color.setHex(0xa855f7); // purple
                break;
                
            case 'under':
                // rapid oscillation back & forth (decaying)
                // We model charge q(t) affecting velocity: v(t) = i(t) = dq/dt
                // Underdamped i(t) = A * exp(-t) * sin(omega*t)
                const t = clock.getElapsedTime() % 6; // repeat loop every 6s
                const ringOsc = Math.sin(t * 12) * Math.exp(-0.35 * t);
                el.progress += ringOsc * 0.1; // oscillating progress
                
                // Color pulse cyan
                el.mesh.material.color.setHex(0x06b6d4);
                break;
                
            case 'critical':
                // single rapid decay surge, then stops
                const tc = (clock.getElapsedTime() % 4); 
                const critCurrent = (10 - 10 * tc) * Math.exp(-1.5 * tc); // current flow
                el.progress += critCurrent * 0.015;
                
                // Color pulse green
                el.mesh.material.color.setHex(0x10b981);
                break;
                
            case 'over':
                // extremely slow crawl, creeping to a stop
                const to = (clock.getElapsedTime() % 5);
                const overCurrent = 2.0 * Math.exp(-0.4 * to);
                el.progress += overCurrent * 0.003;
                
                // Color pulse red
                el.mesh.material.color.setHex(0xef4444);
                break;
        }

        // keep progress in [0, 1] range
        if (el.progress < 0) el.progress += 1.0;
        if (el.progress > 1.0) el.progress -= 1.0;

        // Set position from curve
        const pos = el.curve.getPointAt(el.progress);
        el.mesh.position.copy(pos);
    });
}

// --- Scroll Handler: Calculate current scroll position and interpolate camera/physics ---
function handleScroll() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) return;
    
    currentScrollFraction = window.scrollY / totalHeight;

    // Adjust UI overlay state titles
    const titleOverlay = document.getElementById('overlay-state-title');
    const descOverlay = document.getElementById('overlay-state-desc');

    // Define 5 scroll phases:
    // 0.0 - 0.20: Intro (Vintage Radio front)
    // 0.20 - 0.40: PCB board inside
    // 0.40 - 0.60: Underdamped
    // 0.60 - 0.80: Critically Damped
    // 0.80 - 1.0: Overdamped

    if (currentScrollFraction < 0.20) {
        dampingMode = 'intro';
        targetCameraPos.set(0, 0, 8);
        targetCameraLookAt.set(0, 0, 0);
        
        // Front dials and CRT active
        radioGroup.rotation.y = 0;
        pointLightGlow.intensity = 0.0;
        
    } else if (currentScrollFraction >= 0.20 && currentScrollFraction < 0.40) {
        dampingMode = 'pcb';
        // Glide camera to the back (reveal PCB board)
        const localFraction = (currentScrollFraction - 0.20) / 0.20; // 0 to 1
        targetCameraPos.set(0, 0, 7.5);
        targetCameraLookAt.set(0, 0, 0);
        
        // Interpolate rotation to 180 deg (Math.PI)
        radioGroup.rotation.y = Math.PI * localFraction;
        pointLightGlow.intensity = 0.5 * localFraction;
        pointLightGlow.color.setHex(0xa855f7); // purple glow
        
    } else if (currentScrollFraction >= 0.40 && currentScrollFraction < 0.60) {
        dampingMode = 'under';
        // Focus closely on Resistor + board underdamped oscillation
        targetCameraPos.set(0, -0.6, 3.8); // zoom in
        targetCameraLookAt.set(0, -0.5, 0);
        
        radioGroup.rotation.y = Math.PI;
        pointLightGlow.intensity = 2.0;
        pointLightGlow.color.setHex(0x06b6d4); // cyan glow
        pointLightGlow.position.set(0, -1.0, 0.5); // centered on resistor
        
    } else if (currentScrollFraction >= 0.60 && currentScrollFraction < 0.80) {
        dampingMode = 'critical';
        // Move back to show full PCB damping speed comparison
        targetCameraPos.set(0, 0, 5.0);
        targetCameraLookAt.set(0, 0, 0);
        
        radioGroup.rotation.y = Math.PI;
        pointLightGlow.intensity = 2.0;
        pointLightGlow.color.setHex(0x10b981); // green glow
        pointLightGlow.position.set(0, 0, 0.5);
        
    } else {
        dampingMode = 'over';
        // Zoom in on Capacitor + sluggish electrons
        targetCameraPos.set(0, 0.6, 3.6); // zoom top
        targetCameraLookAt.set(0, 0.5, 0);
        
        radioGroup.rotation.y = Math.PI;
        pointLightGlow.intensity = 2.0;
        pointLightGlow.color.setHex(0xef4444); // red glow
        pointLightGlow.position.set(0, 1.0, 0.5); // centered on capacitor
    }

    if (titleOverlay && descOverlay) {
        titleOverlay.innerText = stateTitles[dampingMode];
        descOverlay.innerText = stateDescs[dampingMode];
    }
}

// --- Update Analog Gauge ---
function updateGauge() {
    if (!gaugeNeedle) return;
    
    let t = clock.getElapsedTime();
    let q = 0; // Charge relative to target 1.0
    
    switch(dampingMode) {
        case 'intro':
            q = 0;
            break;
        case 'pcb':
            q = 0.5 + 0.4 * Math.sin(t * 2);
            break;
        case 'under':
            t = t % 6; // repeat every 6s
            // Underdamped formula for step response: q(t) = 1 - exp(-at)*cos(wt)
            q = 1 - Math.exp(-0.8 * t) * Math.cos(5 * t);
            break;
        case 'critical':
            t = t % 4; // repeat every 4s
            // Critical formula: q(t) = 1 - (1+at)*exp(-at)
            q = 1 - (1 + 4 * t) * Math.exp(-4 * t);
            break;
        case 'over':
            t = t % 5;
            // Overdamped formula
            q = 1 - Math.exp(-0.8 * t);
            break;
    }
    
    // Map q to needle rotation: Target (q=1) is 0 radians (straight up)
    // q=0 is Math.PI/3 (left). Overshoot q>1 is < 0 radians (right).
    let targetAngle = (1 - q) * (Math.PI / 3);
    
    // Smooth the needle movement
    gaugeNeedle.rotation.z += (targetAngle - gaugeNeedle.rotation.z) * 0.15;
}

// --- Window Resize Handler ---
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // 1. Smoothly interpolate camera position and lookAt (lerping)
    cameraPos.lerp(targetCameraPos, 0.05);
    cameraLookAt.lerp(targetCameraLookAt, 0.05);

    camera.position.copy(cameraPos);
    camera.lookAt(cameraLookAt);

    // 2. Animate electrons along loop wire
    updateElectrons(deltaTime);

    // 3. Render and update the offscreen CRT canvas oscilloscope texture
    updateCRT(deltaTime);

    // 4. Subtle constant idling animation for radio
    if (radioGroup) {
        // Subtle hover wobble
        radioGroup.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.08;
    }

    // 5. Update Analog Gauge
    updateGauge();

    // 6. Render standard frame
    renderer.render(scene, camera);
}

// --- Launch on Document Load ---
window.addEventListener('DOMContentLoaded', () => {
    init();
});
