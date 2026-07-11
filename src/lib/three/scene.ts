// scene.ts — plan Task 6.1. Faithful port of 2A source `_buildScene`
// (Foundry 2A - Crucible Light.dc.html:658-952): renderer setup (ACES tone
// mapping, exposure 1.12, DPR capped at 2 / 1.25 degraded), molten-core
// icosahedron + CPU vertex displacement, halo sprites, instrument rings, 9
// orbiting ingots seeded deterministically at 20260711, 90-particle ember
// system, bellows pulse, pointer parallax, scroll-cooling, fps-degrade
// watchdog, IO-based hero-visibility pause, resize handling, and
// `applyTheme(dark)` re-palette (2A:793-807).
//
// Dropped per Global Constraints (plan `docs/plans/2026-07-11-foundry-site-2a-implementation.md`):
//   - `console.log('[foundry] applyTheme dark=', dark)` in applyTheme
//   - the rAF-liveness watchdog `setInterval` fallback inside `syncRun`
//     (kept: the fps-*degrade* watchdog — frames/slowFrames/degraded — which
//     is a distinct mechanism)
//   - `preserveDrawingBuffer: true` on the WebGLRenderer
//
// The DC-runtime editor props referenced in 2A (`comp.props.scrollCooling`,
// `comp.props.embers`, `comp.props.cardTilt`, `comp.props.webglHero`, all
// `?? true`) have no equivalent here — there is no DC runtime — so they
// collapse to their `true` defaults, matching the precedent already set in
// `src/lib/tilt.ts` for `cardTilt`.
//
// Molten core color (#ff4a1c emissive / #1a1108 base) does not change with
// theme — only ambient/environment values re-palette, per 2A's `applyTheme`.

export interface HeroScene {
	setTheme(dark: boolean): void;
	setEnabled(on: boolean): void;
	dispose(): void;
}

interface IngotParams {
	r: number;
	a0: number;
	sp: number;
	wob: number;
	eul: InstanceType<typeof import('three').Euler>;
	rx: number;
	ry: number;
	srx: number;
	sry: number;
}

export function createHeroScene(
	THREE: typeof import('three'),
	mount: HTMLElement,
	hero: HTMLElement,
	opts: { reducedMotion: boolean }
): HeroScene | null {
	let renderer: InstanceType<typeof THREE.WebGLRenderer>;
	try {
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
	} catch {
		return null;
	}

	const scene = new THREE.Scene();
	const sceneBackground = new THREE.Color(0x1b1814);
	scene.background = sceneBackground;
	const sceneFog = new THREE.FogExp2(0x17130e, 0.048);
	scene.fog = sceneFog;
	const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
	camera.position.set(0, 0.32, 8.6);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.12;
	renderer.setClearColor(0x000000, 0);
	const canvas = renderer.domElement;
	canvas.style.cssText =
		'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1400ms cubic-bezier(0.4,0,0.2,1)';
	mount.appendChild(canvas);

	const grp = new THREE.Group();
	scene.add(grp);

	// ---- lights ----
	const hemi = new THREE.HemisphereLight(0x9a8a68, 0x0c0a07, 0.7);
	scene.add(hemi);
	const dir = new THREE.DirectionalLight(0xaeb8cc, 0.85);
	dir.position.set(-5, 7, 4);
	scene.add(dir);
	const forge = new THREE.PointLight(0xff7a3d, 55, 0, 2);
	grp.add(forge);

	// ---- molten core ----
	const coreGeo = new THREE.IcosahedronGeometry(0.8, 4);
	const coreBase = coreGeo.attributes.position.array.slice();
	const coreMat = new THREE.MeshStandardMaterial({
		color: 0x1a1108,
		emissive: new THREE.Color(0xff4a1c),
		emissiveIntensity: 1,
		roughness: 0.42,
		metalness: 0.12,
		flatShading: true,
	});
	const core = new THREE.Mesh(coreGeo, coreMat);
	grp.add(core);

	// ---- halo sprites ----
	const glowTex = (stops: Array<[number, string]>) => {
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const g = c.getContext('2d')!;
		const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
		stops.forEach((s) => gr.addColorStop(s[0], s[1]));
		g.fillStyle = gr;
		g.fillRect(0, 0, 256, 256);
		return new THREE.CanvasTexture(c);
	};
	const haloTex = glowTex([
		[0, 'rgba(255,176,112,0.9)'],
		[0.22, 'rgba(255,110,50,0.38)'],
		[0.55, 'rgba(190,60,22,0.10)'],
		[1, 'rgba(0,0,0,0)'],
	]);
	const mkHalo = (scale: number, op: number) => {
		const m = new THREE.SpriteMaterial({
			map: haloTex,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			opacity: op,
		});
		const s = new THREE.Sprite(m);
		s.scale.setScalar(scale);
		grp.add(s);
		return s;
	};
	const halo1 = mkHalo(5, 0.55);
	const halo2 = mkHalo(9.5, 0.14);

	// ---- instrument rings (orrery guides) ----
	const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x544a3a, transparent: true, opacity: 0.7, fog: false });
	const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.008, 6, 180), ringMat1);
	ring1.rotation.set(Math.PI / 2 - 0.42, 0, 0.18);
	grp.add(ring1);
	const ringMat2 = ringMat1.clone();
	ringMat2.opacity = 0.4;
	const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.007, 6, 180), ringMat2);
	ring2.rotation.set(Math.PI / 2 - 0.18, 0, -0.35);
	grp.add(ring2);

	// ---- forged ingots in orbit ----
	let seed = 20260711;
	const rand = () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const ingotGeo = new THREE.BoxGeometry(1.5, 0.42, 0.62);
	{
		const p = ingotGeo.attributes.position;
		for (let i = 0; i < p.count; i++) {
			if (p.getY(i) < 0) {
				p.setX(i, p.getX(i) * 0.78);
				p.setZ(i, p.getZ(i) * 0.7);
			}
		}
		p.needsUpdate = true;
		ingotGeo.computeVertexNormals();
	}
	const ingotMats = [0x4a4136, 0x423a30, 0x554a3c].map(
		(c, i) =>
			new THREE.MeshStandardMaterial({
				color: c,
				metalness: 0.45,
				roughness: 0.48 + i * 0.06,
				flatShading: true,
				emissive: 0x201812,
				emissiveIntensity: 1,
			})
	);
	const planes = [
		{ x: Math.PI / 2 - 0.42, z: 0.18 },
		{ x: Math.PI / 2 - 0.18, z: -0.35 },
	];
	const ingots: Array<{ m: InstanceType<typeof THREE.Mesh>; p: IngotParams }> = [];
	for (let i = 0; i < 9; i++) {
		const m = new THREE.Mesh(ingotGeo, ingotMats[i % 3]);
		const pl = planes[i % 2];
		const r = 1.9 + rand() * 1.5;
		const p: IngotParams = {
			r,
			a0: rand() * Math.PI * 2,
			sp: (0.1 + rand() * 0.08) * (3.2 / r),
			wob: 0.14 + rand() * 0.22,
			eul: new THREE.Euler(pl.x + (rand() - 0.5) * 0.14, 0, pl.z + (rand() - 0.5) * 0.14),
			rx: rand() * Math.PI * 2,
			ry: rand() * Math.PI * 2,
			srx: (rand() - 0.5) * 0.5,
			sry: (rand() - 0.5) * 0.6,
		};
		m.scale.setScalar(0.32 + rand() * 0.3);
		ingots.push({ m, p });
		grp.add(m);
	}

	// ---- drifting embers ----
	const N = 90;
	const epos = new Float32Array(N * 3);
	const evel = new Float32Array(N);
	const eph = new Float32Array(N);
	const ew = new Float32Array(N);
	const respawn = (i: number) => {
		const r = 1.15 + rand() * 1.1;
		const a = rand() * Math.PI * 2;
		epos[i * 3] = Math.cos(a) * r;
		epos[i * 3 + 1] = -0.6 + rand() * 1.2;
		epos[i * 3 + 2] = Math.sin(a) * r * 0.8;
		evel[i] = 0.22 + rand() * 0.4;
		eph[i] = rand() * Math.PI * 2;
		ew[i] = 0.6 + rand() * 1.4;
	};
	for (let i = 0; i < N; i++) {
		respawn(i);
		epos[i * 3 + 1] = -0.6 + rand() * 3.8;
	}
	const egeo = new THREE.BufferGeometry();
	egeo.setAttribute('position', new THREE.BufferAttribute(epos, 3));
	const etex = glowTex([
		[0, 'rgba(255,190,130,1)'],
		[0.4, 'rgba(255,120,60,0.5)'],
		[1, 'rgba(0,0,0,0)'],
	]);
	const emat = new THREE.PointsMaterial({
		size: 0.085,
		map: etex,
		color: 0xffb27a,
		transparent: true,
		opacity: 0.85,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		sizeAttenuation: true,
	});
	const embers = new THREE.Points(egeo, emat);
	grp.add(embers);

	// ---- theme palettes ----
	let haloBase1 = 0.5;
	let haloBase2 = 0.14;
	let emberBase = 0.85;
	const applyTheme = (dark: boolean) => {
		sceneBackground.set(dark ? 0x1b1814 : 0xf4efe6);
		sceneFog.color.set(dark ? 0x17130e : 0xefe9dc);
		ringMat1.color.set(dark ? 0x544a3a : 0xa89e88);
		ringMat2.color.set(dark ? 0x544a3a : 0xa89e88);
		hemi.color.set(dark ? 0x9a8a68 : 0xfff3d8);
		hemi.groundColor.set(dark ? 0x0c0a07 : 0x9a8a68);
		hemi.intensity = dark ? 0.7 : 1.0;
		dir.color.set(dark ? 0xaeb8cc : 0xffffff);
		dir.intensity = dark ? 0.85 : 1.2;
		haloBase1 = dark ? 0.5 : 0.36;
		haloBase2 = dark ? 0.14 : 0.06;
		emberBase = dark ? 0.85 : 0.62;
	};
	applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');

	// ---- state / loop ----
	let running = false;
	let rafId = 0;
	let enabled = true;
	let visible = true;
	let pageVisible = !document.hidden;
	let px = 0;
	let py = 0;
	let shownOnce = false;
	let t = 0;
	let lastNow = performance.now();
	let frames = 0;
	let slowFrames = 0;
	let degraded = false;
	const ringsSvg = document.getElementById('fy-poster-rings');
	const v3 = new THREE.Vector3();
	const shouldAnimate = !opts.reducedMotion;

	const sizeIt = () => {
		const w = mount.clientWidth || 1;
		const h = mount.clientHeight || 1;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, degraded ? 1.25 : 2));
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		const wide = w / h > 1.05;
		grp.position.set(wide ? 2.1 : 0, wide ? -0.05 : 0.62, 0);
	};
	sizeIt();
	const ro = new ResizeObserver(sizeIt);
	ro.observe(mount);

	const frame = (now: number) => {
		if (rafId) cancelAnimationFrame(rafId);
		rafId = running ? requestAnimationFrame(frame) : 0;
		const dt = Math.min(0.05, (now - lastNow) / 1000 || 0.016);
		lastNow = now;
		t += dt;
		frames++;
		if (!degraded && frames <= 240) {
			if (dt > 0.03) slowFrames++;
			if (frames === 240 && slowFrames > 90) {
				degraded = true;
				sizeIt();
			}
		}
		const cooling = Math.min(1, Math.max(0, window.scrollY / ((hero.offsetHeight || window.innerHeight) * 0.85)));
		const heat = 1 - 0.78 * cooling;
		const pulse = 0.82 + 0.14 * Math.sin(t * 1.35) + 0.05 * Math.sin(t * 4.3);

		const pa = coreGeo.attributes.position.array;
		for (let i = 0; i < pa.length; i += 3) {
			const x = coreBase[i];
			const y = coreBase[i + 1];
			const z = coreBase[i + 2];
			const n1 = Math.sin(x * 1.7 + t * 0.8) * Math.sin(y * 1.9 - t * 0.6) * Math.sin(z * 1.6 + t * 0.5);
			const n2 = Math.sin(x * 3.9 - t * 1.2) * Math.sin(y * 3.6 + t * 0.9);
			const d = 1 + 0.17 * n1 + 0.05 * n2;
			pa[i] = x * d;
			pa[i + 1] = y * d;
			pa[i + 2] = z * d;
		}
		coreGeo.attributes.position.needsUpdate = true;
		core.rotation.y = t * 0.12;
		core.rotation.x = Math.sin(t * 0.1) * 0.1;
		coreMat.emissiveIntensity = (0.52 + 0.48 * pulse) * heat + 0.05;
		forge.intensity = 55 * pulse * heat + 4;
		halo1.material.opacity = haloBase1 * pulse * heat;
		halo2.material.opacity = haloBase2 * heat;

		for (const it of ingots) {
			const p = it.p;
			const a = p.a0 + t * p.sp;
			v3.set(Math.cos(a) * p.r, Math.sin(a) * p.r, Math.sin(a * 1.7 + p.a0) * p.wob).applyEuler(p.eul);
			it.m.position.copy(v3);
			it.m.rotation.set(p.rx + t * p.srx, p.ry + t * p.sry, 0);
		}

		embers.visible = true;
		if (embers.visible) {
			for (let i = 0; i < N; i++) {
				epos[i * 3 + 1] += evel[i] * dt * (1 - 0.55 * cooling);
				epos[i * 3] += Math.sin(t * ew[i] + eph[i]) * 0.32 * dt;
				if (epos[i * 3 + 1] > 3.6) respawn(i);
			}
			egeo.attributes.position.needsUpdate = true;
			emat.opacity = emberBase * heat;
		}

		grp.rotation.y = t * 0.05;
		camera.position.x += (px * 0.55 - camera.position.x) * 0.045;
		camera.position.y += (0.32 - py * 0.3 - cooling * 0.7 - camera.position.y) * 0.05;
		camera.lookAt(grp.position.x * 0.3, grp.position.y * 0.5, 0);
		renderer.render(scene, camera);
		if (!shownOnce) {
			shownOnce = true;
			canvas.style.opacity = '1';
			if (ringsSvg) ringsSvg.style.opacity = '0';
		}
	};

	const syncRun = () => {
		// rAF self-throttles in hidden tabs; IO handles scroll-past. No pageVisible gate.
		const should = enabled && visible && shouldAnimate;
		if (should && !running) {
			running = true;
			lastNow = performance.now();
			rafId = requestAnimationFrame(frame);
		} else if (!should && running) {
			running = false;
			if (rafId) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
		}
	};
	const io = new IntersectionObserver(
		(es) => {
			visible = es[0] ? es[0].isIntersecting : true;
			syncRun();
		},
		{ threshold: 0 }
	);
	io.observe(hero);
	const onVis = () => {
		pageVisible = !document.hidden;
		syncRun();
	};
	document.addEventListener('visibilitychange', onVis);
	const onPtr = (e: PointerEvent) => {
		const w = window.innerWidth || 1;
		const h = window.innerHeight || 1;
		px = e.clientX / w - 0.5;
		py = e.clientY / h - 0.5;
	};
	window.addEventListener('pointermove', onPtr, { passive: true });
	syncRun();
	frame(performance.now()); // paint one frame immediately, even in throttled contexts

	return {
		setTheme(dark: boolean) {
			applyTheme(dark);
		},
		setEnabled(on: boolean) {
			enabled = !!on;
			canvas.style.opacity = on && shownOnce ? '1' : '0';
			if (ringsSvg) ringsSvg.style.opacity = on ? '0' : '0.55';
			syncRun();
		},
		dispose() {
			running = false;
			if (rafId) cancelAnimationFrame(rafId);
			io.disconnect();
			ro.disconnect();
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('pointermove', onPtr);
			[coreGeo, ingotGeo, egeo, ring1.geometry, ring2.geometry].forEach((g) => g.dispose());
			[coreMat, emat, ringMat1, ringMat2, halo1.material, halo2.material].concat(ingotMats).forEach((m) => m.dispose());
			haloTex.dispose();
			etex.dispose();
			renderer.dispose();
			if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
		},
	};
}
