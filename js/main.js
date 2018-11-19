import {
	Vector2,
	Vector3,
	Quaternion,
	Raycaster,
	Sphere,
	Euler
} from 'three';

import {
	DegToRad,
	xDim, zDim,
	numOfFrames,
	createCamera,
	createControls,
	createRenderer,
	createScene,
	createGUI,
	drawBorder,
	createLoadingBar
} from './utilities';

import { Judge } from './feedback';

import resources from './loadResources';
import { Torso, Probe } from './sceneObjects';

import io from 'socket.io-client';

const socket = io.connect('http://localhost:8080');

socket.on('connect', () => {
	socket.emit('desktop connect', { room: 'test' });
	console.log('%cDesktop connected!', 'color: green');
});

socket.on('probe connected', () => {
	console.log('%cProbe connected!', 'color: green');
});

/* Initial starting orientation q1 and current orientation q2. 
/* These are used to calculate the difference in rotation */
let change = new Quaternion();
let change2 = new Quaternion();

socket.on('update orientation', (data) => {
	change.set(-data.x, data.y, data.z, data.w);
	change2.set(data.x, data.y, -data.z, data.w);

	probe.setRotationFromQuaternion(change2);
});

socket.on('started sending', () => {
	change = new Quaternion();
	change2 = new Quaternion();

	orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));

	probe.setRotationFromQuaternion();

	console.log('%cReceiving orientation!', 'color: purple');
});

socket.on('stopped sending', () => {
	change = new Quaternion();
	change2 = new Quaternion();

	orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));

	probe.setRotationFromQuaternion();

	console.log('%cStopped receiving orientation.', 'color: purple');
});

let mouseDown = false, mouseGrab = false, onHold = false, correct = false, lock = false,
	x_0 = 0, y_0 = 0, z_0 = 0,
	tilt = 0, pitch = 0, rotate = 0,
	prevX = 0, prevY = 0, prevZ = 0,
	frame = 0,
	orientation = new Quaternion(),
	touchSphere = new Sphere(undefined, 10),
	torso, probe, correctProbe;

let aquiredImage = {
	pitch: 0,
	tilt: 0,
	rotate: 0,
	x_0: 0,
	z_0: 0
}

const w = new Worker('./sectorViewWorker.js');

const canvas = document.getElementById('slice');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

w.onmessage = () => {
	updateProgress();
}

drawBorder();

// Apical reagion    
const apicalRegion = new Sphere(new Vector3(13.9, -4.9, 20.9), 6),
	apicalRotX = DegToRad * 23,
	apicalRotY = DegToRad * 46,
	apicalRotZ = -DegToRad * 14,
	apicalXAxis = new Vector3(1, 0, 0).applyEuler(new Euler(apicalRotX, apicalRotY, apicalRotZ)),
	apicalYAxis = new Vector3(0, 1, 0).applyEuler(new Euler(apicalRotX, apicalRotY, apicalRotZ));

const judge = new Judge(apicalRotX, apicalRotY, apicalRotZ, xDim / 2, zDim / 2);

// Mouse positioning
const raycaster = new Raycaster(),
	mouse = new Vector2();

const bodyView = document.getElementById('bodyView'),
	correctButton = document.getElementById('correct'),
	displayBg = document.getElementById('displayBg'),
	sectorIcon = document.getElementById('sectorIcon'),
	apicalStatus = document.getElementById('apicalStatus'),
	probeStatus = document.getElementById('probeStatus'),
	status = document.getElementById('status'),
	objectiveSign = document.getElementById('objectiveSign');

const loadingBar = createLoadingBar("#loading"),
	scene = createScene(),
	renderer = createRenderer(bodyView),
	camera = createCamera(bodyView),
	controls = createControls(camera, bodyView),
	probeGUI = createGUI();


document.getElementById('tryAgain').addEventListener('click', () => {
	status.style.opacity = '1';
	bodyView.classList.remove('adjust-width');
	adjustRenderer();

	displayBg.style.borderColor = '#2861bf';
	correctButton.style.background = "rgb(14, 206, 14, 0.25)";

	correctButton.style.cssText = `
		#correct:hover {
			background-color: rgba(11, 99, 11, 0.562);
		}`;

	//objectiveSign.childNodes[0].childNodes[0].textContent = 'Find the Apical Four Chamber View';
	objectiveSign.style.background = 'rgb(40, 97, 191, 0.25)';
	lock = false;
	correct = false;
	({ pitch, tilt, rotate, x_0, z_0 } = aquiredImage);
	judge.showFeedback(false);
	torso.transparency(false);
	probe.transparency(false);
	probe.sectorVisible(false);
	correctProbe.hide();
});

correctButton.addEventListener('click', () => {

	if (correct === false) {
		displayBg.style.borderColor = "#0ece0e";
		//objectiveSign.childNodes[0].childNodes[0].textContent = 'Correct View';

		objectiveSign.style.backgroundColor = 'rgba(14, 206, 14, 0.25)';

		correctButton.style.backgroundColor = "rgb(14, 206, 14)";

		pitch = 0, tilt = 0, rotate = 0;
		x_0 = xDim / 2, z_0 = zDim / 2;
		correct = true;
		correctProbe.transparency(false);
		probe.transparency(true);
	} else if (correct === true) {
		displayBg.style.borderColor = "#2861bf";
		//objectiveSign.childNodes[0].childNodes[0].textContent = 'Aquired View';
		objectiveSign.style.backgroundColor = 'rgba(40, 97, 191, 0.25)';
		({ pitch, tilt, rotate, x_0, z_0 } = aquiredImage);

		correctButton.style.backgroundColor = "rgba(14, 206, 14, 0.25)";

		correctButton.style.cssText = `
			#correct:hover {
				background-color: rgba(11, 99, 11, 0.562);
			}`;

		correct = false;
		correctProbe.transparency(true);
		probe.transparency(false);
	}
});

// Add evenlisteners for mouse positioning on torso
bodyView.addEventListener('mousedown', () => {
	mouseDown = true
	if (mouseGrab) {
		probeIcon.className = "fas fa-hand-rock";
		probeStatus.style.color = "#0ece0e";
	}
});
bodyView.addEventListener('mouseup', () => {
	mouseDown = false
	probeIcon.className = "fas fa-hand-paper";
	probeStatus.style.color = "red";
});
bodyView.addEventListener('touchmove', probePositionTouch, { passive: true });
bodyView.addEventListener('mousemove', probePositionMouse, { passive: true });
bodyView.addEventListener('touchstart', probeTouchStart, { passive: true });
bodyView.addEventListener('touchend', probeTouchEnd);

window.addEventListener('resize', adjustRenderer);

function adjustRenderer() {
	camera.aspect = bodyView.offsetWidth / bodyView.offsetHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(bodyView.offsetWidth, bodyView.offsetHeight);
}

const objects = 51;
let count = 0;
let res = {};

function updateProgress() {

	count++
	loadingBar.animate(count / objects, { duration: 100 });

	if (count === 51) {
		w.onmessage = (e) => {
			imageData.data.set(e.data);
			ctx.putImageData(imageData, 0, 0);
		}

		// Run the application
		run();
		document.getElementById('loadingScreen').style.display = 'none';
		document.getElementById('simulator').style.visibility = 'visible';
		document.getElementById('footer').style.display = 'none';
	}
}

resources.whileLoading(() => {
	updateProgress();
});

// Start loading all files.
resources.loadAll();

resources.whenDone((e) => {
	res = e;
});

function animate() {
	if (frame > numOfFrames - 1) {
		frame = 0;
	}

	// orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));

	orientation.multiply(change);

	w.postMessage({
		quaternion: orientation,
		x: z_0,
		y: y_0,
		z: x_0,
		frame: frame,
		norm: 1 / orientation.length()
	});

	frame++;

	renderer.clear();
	renderer.render(scene, camera);

	requestAnimationFrame(animate);
}

function placeProbe(raycaster) {
	if (!lock) {
		const intersects = raycaster.intersectObject(torso.getBody());
		if (intersects.length > 0) {

			if (!onHold) {
				probeGUI.pitch.setValue(0);
				probeGUI.tilt.setValue(0);
				probeGUI.rotate.setValue(0);
				prevX = 0, prevY = 0, prevZ = 0;
			}

			probe.moveTo(intersects, onHold);
			x_0 = 0, z_0 = 0;

			if (apicalRegion.containsPoint(probe.position)) {
				sectorIcon.className = "far fa-eye";
				apicalStatus.style.color = "#0ece0e";
				let normP = probe.position.clone().sub(apicalRegion.center.clone());

				x_0 = normP.dot(apicalYAxis.clone()) * (xDim / (2 * apicalRegion.radius)) + xDim / 2;
				z_0 = normP.dot(apicalXAxis.clone()) * (zDim / (2 * apicalRegion.radius)) + zDim / 2;

				pitch = probe.rotation.x - apicalRotX;
				tilt = probe.rotation.y - apicalRotY;
				rotate = probe.rotation.z - apicalRotZ;

				orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));
			} else {
				sectorIcon.className = "far fa-eye-slash";
				apicalStatus.style.color = "red";
			}
		}
	}
}


function probePositionTouch(e) {
	if (!lock) {
		if (!controls.enabled) {
			mouse.x = (e.touches[0].clientX / bodyView.clientWidth) * 2 - 1;
			mouse.y = - (e.touches[0].clientY / bodyView.clientHeight) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);
			placeProbe(raycaster);
		}
	}
}

function probePositionMouse(e) {
	if (!lock) {
		mouse.x = (e.clientX / bodyView.clientWidth) * 2 - 1;
		mouse.y = - (e.clientY / bodyView.clientHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);

		const mouseHover = raycaster.intersectObject(probe.getBody());

		if ((mouseHover.length > 0 && !mouseDown) || (mouseGrab && mouseDown)) {
			controls.enabled = false;
			mouseGrab = true;

			if (mouseDown) {
				placeProbe(raycaster);
			}

			probe.highlight(true);
		} else if (mouseGrab) {
			controls.enabled = true;
			mouseGrab = false;
			probe.highlight(false);
		}
	}
}

function probeTouchStart(e) {
	if (!lock) {
		mouse.x = (e.touches[0].clientX / bodyView.clientWidth) * 2 - 1;
		mouse.y = - (e.touches[0].clientY / bodyView.clientHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObject(torso.getBody());

		if (intersects.length > 0) {

			touchSphere.center.copy(intersects[0].point);
			if (touchSphere.containsPoint(probe.position)) {
				probeIcon.className = "fas fa-hand-rock";
				probeStatus.style.color = "#0ece0e";

				controls.enabled = false;
				probe.highlight(true);
			}
		}
	}
}

function probeTouchEnd() {
	if (!lock) {
		if (!controls.enabled) {
			probeIcon.className = "fas fa-hand-paper";
			probeStatus.style.color = "red";

			controls.enabled = true;
			probe.highlight(false);
		}
	}
}

function run() {

	const probeGeometry1 = res.probeGeometry.clone(),
		probeGeometry2 = res.probeGeometry.clone();

	torso = new Torso({ body: res.torsoGeometry, heart: res.heartGeometry }, scene);
	probe = new Probe(probeGeometry1, scene, 0xa1a2a3, 0x2861bf);
	correctProbe = new Probe(probeGeometry2, scene, 0xece0e, 0xece0e);

	// Place the correct probe example on body
	correctProbe.setPosition(apicalRegion.center);
	correctProbe.setOrientation(apicalRotX, apicalRotY, apicalRotZ);
	correctProbe.hide();

	probeGUI.pitch.onChange((angle) => {
		const delta = (prevX - angle) * DegToRad;
		prevX = angle;

		if (Math.abs(pitch + delta) <= Math.PI / 2) {
			probe.rotateX(-delta);
			apicalRegion.containsPoint(probe.position) ? pitch += delta : pitch = 0;

			orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));
		}

	});

	probeGUI.tilt.onChange((angle) => {
		const delta = (prevY - angle) * DegToRad;
		prevY = angle;

		if (Math.abs(tilt + delta) <= Math.PI / 2) {
			probe.rotateY(delta);
			apicalRegion.containsPoint(probe.position) ? tilt += delta : tilt = 0;

			orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));
		}
	});

	probeGUI.rotate.onChange((angle) => {
		const delta = (prevZ - angle) * DegToRad;
		prevZ = angle;

		if (Math.abs(rotate + delta) <= Math.PI / 2) {
			probe.rotateZ(-delta);
			apicalRegion.containsPoint(probe.position) ? rotate += delta : rotate = 0;

			orientation.setFromEuler(new Euler(pitch, tilt, rotate + Math.PI / 2, 'ZYX'));
		}
	});

	probeGUI.hold.onChange((value) => {
		onHold = value;
	});

	probeGUI.aquire.onChange(() => {
		status.style.opacity = '0';
		bodyView.classList.add('adjust-width');
		//objectiveSign.childNodes[0].childNodes[0].textContent = 'Aquired View';
		adjustRenderer();

		aquiredImage = { pitch, tilt, rotate, x_0, z_0 };
		lock = true;
		correct = false;
		if (apicalRegion.containsPoint(probe.position)) {
			judge.showFeedback(true, pitch, tilt, rotate, x_0, z_0);
		} else {
			judge.showFeedback(true, 0.2, 0.5, 0.6, 30, 30);
		}
		torso.transparency(true);
		correctProbe.transparency(true);
		probe.sectorVisible(true);
		correctProbe.show();
	});

	requestAnimationFrame(animate);
}



