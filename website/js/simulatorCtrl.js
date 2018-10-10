simulator.controller('simulatorCtrl', function ($scope) {

	const socket = io.connect();
	let probeConnect = false;
	$scope.mouseDown = false;
	let initAlpha = 0, initBeta = 0, initGamma = 0;

	socket.on('connect', function () {
		socket.emit('desktop connect', { room: 'test' });
		socket.on('ip', function (data) {
			$scope.connectionString = data + ':8080/#/mobile/test';
		})
		console.log('Desktop connected!');
	});

	socket.on('probe connected', function () {
		console.log('probe connected');
		probeConnect = true;
		initAlpha = probe.rotation.y;
		initBeta = probe.rotation.x;
		initGamma = probe.rotation.z;
	})

	socket.on('probe disconnected', function () {
		console.log('probe disconnected');
		probeConnect = false;
	})

	socket.on('update position', function (data) {

		pitch = data.beta * (Math.PI / 180) + initBeta;
		tilt = data.alpha * (Math.PI / 180) + initAlpha;
		rotate = data.gamma * (-Math.PI / 180) + initGamma;

		probe.rotation.set(pitch, tilt, rotate);
		sector.rotation.set(pitch, tilt, rotate);

		if (!apicalRegion.containsPoint(probe.position)) {
			pitch = 0;
			tilt = 0;
			rotate = 0;
		}
		$scope.$apply();
	});

	$scope.loaded = false;

	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	const volume = [];

	// Setup renderer
	const container = document.getElementById('container');
	const renderer = new THREE.WebGLRenderer({ antialias: true });

	renderer.setSize(container.offsetWidth, container.offsetHeight);
	renderer.setClearColor(0x353535, 1);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.autoClear = false;

	container.appendChild(renderer.domElement);

	/**
	 * Handle window resize
	 */
	function onWindowResize() {
		camera.aspect = container.offsetWidth / container.offsetHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.offsetWidth, container.offsetHeight);
	}

	// Setup camera
	const camera = new THREE.PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 1, 1000);
	camera.position.z = 170;

	// Setup scene
	const scene = new THREE.Scene();
	scene.add(new THREE.HemisphereLight(0x443333, 0xb2b2c1));

	// World axis
	const axisHelper = new THREE.AxisHelper(20);
	scene.add(axisHelper);

	// Setup the slice view
	const scanvas = document.getElementById('slice');
	const ctx = scanvas.getContext('2d');
	const width = scanvas.width;
	const height = scanvas.height;

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	const dcanvas = document.getElementById('display');
	const ctx2 = dcanvas.getContext('2d');
	const dwidth = dcanvas.width;
	const dheight = dcanvas.height;

	const a = Math.round(width * 0.125);
	const b = width - a;
	const c = dheight * 0.885;
	const d = dwidth * 0.115 * 0.5;

	ctx2.strokeStyle = '#00000';
	ctx2.lineWidth = 7;

	ctx2.beginPath();
	ctx2.moveTo(dwidth / 2, 0);
	ctx2.lineTo(dwidth - d, c);
	ctx2.stroke();

	ctx2.beginPath();
	ctx2.moveTo(dwidth / 2, 0);
	ctx2.lineTo(d, c);
	ctx2.stroke();

	ctx2.lineWidth = 12;
	ctx2.beginPath();
	ctx2.ellipse(dwidth / 2, c, (dwidth) / 2 - d, dheight * 0.1, 0, 0, Math.PI);
	ctx2.stroke();

	ctx2.setLineDash([2,20]);
	ctx2.strokeStyle = 'yellow';
	ctx2.lineWidth = 3;
	ctx2.beginPath();
	ctx2.moveTo(dwidth / 2, 6);
	ctx2.lineTo(d, c + 6);
	ctx2.stroke();

	ctx2.setLineDash([]);
	ctx2.lineWidth = .5;
	ctx2.strokeText('V', dwidth/2 + 8, 15);

	let frame = 0;
	let numOfFrames = 0;

	const xDim = 140;
	const yDim = 203;
	const zDim = 140;

	const scale_x = xDim / width;
	const scale_y = yDim / width;
	const scale_z = zDim / width;

	let x_0 = 0;
	let y_0 = 0;
	let z_0 = 0;

	// Setup three.js loaders
	const manager = new THREE.LoadingManager();
	const stlLoader = new THREE.STLLoader(manager);
	const fileLoader = new THREE.FileLoader(manager);
	let torso, heart, bone, probe;

	/** function for reading the dicomfile **/

	function readDICOM(buf) {
		let byt = new Uint8Array(buf);
		try {
			// Parse the byte array to get a DataSet object that has the parsed contents
			const dataSet = dicomParser.parseDicom(byt);
			const xyDim = xDim * yDim;

			numOfFrames = dataSet.elements.x7fe12050.items.length;

			for (let n = 0; n < numOfFrames; n++)
				volume.push(ndarray(new Uint8Array(dataSet.byteArray.buffer, dataSet.elements.x7fe12050.items[n].dataOffset, dataSet.elements.x7fe12050.items[n].length), [xDim, yDim, zDim], [xyDim, zDim, 1], 80));

		} catch (ex) {
			console.log('Error parsing byte stream: ' + ex);
		}
	}

	/** functions for reading the dicomfile ends here**/

	const loadingBar = new ProgressBar.Circle('#loading', {
		color: '#aaa',
		// This has to be the same size as the maximum width to
		// prevent clipping
		strokeWidth: 6,
		trailWidth: 1,
		easing: 'easeInOut',
		duration: 1400,
		text: {
		  autoStyleContainer: false
		},
		from: { color: '#7de887', width: 1 },
		to: { color: '#7de887', width: 6 },
		// Set default step function for all animate calls
		step: function(state, circle) {
				circle.path.setAttribute('stroke', state.color);
				circle.path.setAttribute('stroke-width', state.width);
			
				var value = Math.round(circle.value() * 100);
				if (value === 0) {
					circle.setText('');
				} else {
					circle.setText(value);
				}
	  
			}
		});
	loadingBar.text.style.fontSize = '2rem';

	manager.onProgress = function (url, itemsLoaded, itemsTotal) {loadingBar.animate(itemsLoaded/itemsTotal)};
	manager.onLoad = function () {
		requestAnimationFrame(animate);
		$scope.loaded = true;
		$scope.$apply();
	};

	/** load files **/
	fileLoader.setResponseType('arraybuffer')
	fileLoader.load('./3d3', function (file) {readDICOM(file)});
	
	stlLoader.load('./torso.stl', function (geometry) {
		torso = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xfcb5bc, transparent: false, opacity: 0.30 }));

		torso.position.set(-8, -130, -5);
		torso.scale.set(2, 2, 2);
		scene.add(torso);


	});

	stlLoader.load('./heart.stl', function (geometry) {
		heart = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x990000, specular: 0x111111, shininess: 200 }));

		heart.position.set(-5, 7, 3);
		heart.rotation.set(-Math.PI / 2 - (Math.PI / 180) * 15, 0, Math.PI);
		heart.scale.set(0.31, 0.29, 0.31);
		scene.add(heart);

		let heartBoundingBox = new THREE.Box3().setFromObject(heart);

		heart.material.visible = false;

		axisHelper.position.x = -heartBoundingBox.getSize().x / 2;
		axisHelper.position.y = 60;
		axisHelper.position.z = -heartBoundingBox.getSize().z / 2;

	});

	stlLoader.load('./ribs_fixed2.stl', function (geometry) {
		bone = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 0 }));

		bone.rotation.set(-(Math.PI / 180) * 6, (Math.PI / 180) * 2, 0);
		bone.position.set(-9, -2, -23);
		bone.scale.set(1.25, 1.20, 1.23);
		scene.add(bone);

		bone.material.visible = false;

	});

	stlLoader.load('./probe.stl', function (geometry) {
		geometry.translate(-10, -52.5, 1.3);
		geometry.rotateX(-Math.PI / 2 - (Math.PI / 180) * 15);
		geometry.rotateZ(-(Math.PI / 180) * 70);

		probe = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xa1a2a3, specular: 0x050505, shininess: 400 }));

		probe.scale.set(3, 3, 3);

		scene.add(probe);

	});

	/** load files end **/

	window.addEventListener('keypress', function (event) {

		if (event.key.toLowerCase() == 't') {

			if (torso.material.transparent == true) {
				torso.material.transparent = false;
				sector.material.visible = false;
				heart.material.visible = false;
				bone.material.visible = false;
			} else {
				torso.material.transparent = true;
				sector.material.visible = true;
				heart.material.visible = true;
				bone.material.visible = true;
			}

		}

		if (event.key.toLowerCase() == 'b') {

			if (torso.material.transparent == true)
				if (bone.material.visible == true) {
					bone.material.visible = false;
				} else {
					bone.material.visible = true;
				}

		}
	});

	window.addEventListener('resize', onWindowResize, false);

	window.addEventListener('keydown', function (event) {

		if (probeConnect == false && $scope.mouseDown == false) {
			if (event.key.toLowerCase() == 'd' && pitch < (Math.PI/2 + apicalRotX)) {
				
				probe.rotateX(0.005 * Math.PI);
				sector.rotateX(0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					pitch  += 0.005 * Math.PI;
			}

			if (event.key.toLowerCase() == 'a' && pitch > (-Math.PI/2 + apicalRotX)) {

				probe.rotateX(-0.005 * Math.PI);
				sector.rotateX(-0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					pitch  -= 0.005 * Math.PI;
			}

			if (event.key.toLowerCase() == 'w' && tilt < (Math.PI/2 + apicalRotY)) {

				probe.rotateY(0.005 * Math.PI);
				sector.rotateY(0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					tilt += 0.005 * Math.PI;
			}

			if (event.key.toLowerCase() == 's' && tilt > (-Math.PI/2 + apicalRotY)) {

				probe.rotateY(-0.005 * Math.PI);
				sector.rotateY(-0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					tilt -= 0.005 * Math.PI;
			}

			if (event.key.toLowerCase() == 'e') {

				probe.rotateZ(0.005 * Math.PI);
				sector.rotateZ(0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					(rotate > 2*Math.PI || rotate < -2*Math.PI) ? rotate = 0 : rotate += 0.005 * Math.PI;
			}

			if (event.key.toLowerCase() == 'q') {

				probe.rotateZ(-0.005 * Math.PI);
				sector.rotateZ(-0.005 * Math.PI);

				if (apicalRegion.containsPoint(probe.position))
					(rotate > 2*Math.PI || rotate < -2*Math.PI) ? rotate = 0 : rotate -= 0.005 * Math.PI;
			}

			$scope.$apply();
		}
	})

	const sectorGeometry = new THREE.CircleGeometry(40, 5, Math.PI / 2, Math.PI / 3);
	sectorGeometry.rotateX(- Math.PI / 2);
	sectorGeometry.rotateY(- 0.5);

	const sectorMaterial = new THREE.MeshBasicMaterial({ color: 0x2b6944 });
	sectorMaterial.side = THREE.DoubleSide;
	const sector = new THREE.Mesh(sectorGeometry, sectorMaterial);

	scene.add(sector);
	sector.material.visible = false;

	//apical view
	const apicalRegion = new THREE.Sphere(new THREE.Vector3(13.9, -4.9, 20.9), 6)

	const apical = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshPhongMaterial({ color: 0x215db7, transparent: true, opacity: 0.70 }));
	apical.position.copy(apicalRegion.center);

	scene.add(apical);

	const apicalRotX = (Math.PI / 180) * 23;
	const apicalRotY = (Math.PI / 180) * 46;
	const apicalRotZ = -(Math.PI / 180) * 14;

	let tilt = 0;
	let pitch = 0;
	let rotate = 0;

	const apicalXAxis = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(apicalRotX, apicalRotY, apicalRotZ));
	const apicalYAxis = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(apicalRotX, apicalRotY, apicalRotZ));
	const apicalZAxis = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(apicalRotX, apicalRotY, apicalRotZ));

	const arrowHelperX = new THREE.ArrowHelper(apicalXAxis, apicalRegion.center.clone(), 20, 0xe85100);
	scene.add(arrowHelperX);

	const arrowHelperY = new THREE.ArrowHelper(apicalYAxis, apicalRegion.center.clone(), 20, 0x02e81d);
	scene.add(arrowHelperY);

	const arrowHelperZ = new THREE.ArrowHelper(apicalZAxis, apicalRegion.center.clone(), 20, 0x0105e8);
	scene.add(arrowHelperZ);

	// Setup controls
	const controls = new THREE.OrbitControls(camera, container);
	controls.enablePan = false;
	controls.enableZoom = false;
	controls.target = new THREE.Vector3(-8, 0, -5);

	/*
	$scope.getAngles = function () {
		return { x: Math.round(pitch * (180 / Math.PI)), y: Math.round(tilt * (180 / Math.PI)), z: Math.round(rotate * (180 / Math.PI)) };
	}

	$scope.getIntersection = function () {
		return { x: Math.round(x_0), y: Math.round(y_0), z: Math.round(z_0) };
	}*/

	$scope.coordinates = function (e) {

		mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
		mouse.y = - (e.clientY / container.clientHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);

		let intersects = raycaster.intersectObject(torso);

		if (intersects.length > 0) {

			if ($scope.mouseDown == false) {
				probe.position.set(0, 0, 0);
				sector.position.set(0, 0, 0);

				if (probeConnect == false) {
					probe.lookAt(intersects[0].face.normal);
					sector.lookAt(intersects[0].face.normal);
				}

				probe.position.copy(intersects[0].point);
				sector.position.copy(intersects[0].point);
			}

			if (apicalRegion.containsPoint(probe.position)) {
				let normP = probe.position.clone().sub(apicalRegion.center.clone());

				x_0 = normP.dot(apicalYAxis.clone()) * (xDim / (2 * apicalRegion.radius)) + xDim / 2;
				z_0 = normP.dot(apicalXAxis.clone()) * (zDim / (2 * apicalRegion.radius)) + zDim / 2;

				pitch = sector.rotation.x;
				tilt = sector.rotation.y;
				rotate = sector.rotation.z;
			} else {
				x_0 = 0;
				y_0 = 0;
				z_0 = 0;

				pitch = 0;
				tilt = 0;
				rotate = 0;

			}
		}

	}

	/**
	 * Start animation loop
	 */

	function animate() {
		if (frame > numOfFrames - 1)
			frame = 0;

		let imageData = ctx.getImageData(0, 0, width, height);
		let data = imageData.data;

		let i = 0, j = 0; // screen pixel coordinates
		let x1 = 0, y1 = 0, z1 = 0; // camera coordinates
		let start = 0, end = 0; // start/end of each row

		const cZ = Math.cos(pitch - apicalRotX);
		const sZ = Math.sin(pitch - apicalRotX);
		const cY = Math.cos(rotate - apicalRotZ);
		const sY = Math.sin(rotate - apicalRotZ);
		const cX = Math.cos(tilt - apicalRotY);
		const sX = Math.sin(tilt - apicalRotY);

		for (i = 0; i < height; ++i) { // draws along height	
			y1 = i;

			if (i < b) {
				start = Math.floor(width / 2 - i / 2);
				end = Math.floor(width / 2 + i / 2);
			} else {
				start = Math.floor(a / 2 + 0.5 * (b / (a * a)) * (i - b) * (i - b));
			 	end = Math.floor((width - a / 2) - 0.5 * (b / (a * a)) * (i - b) * (i - b));
			}

			for (j = start; j < end; ++j) { // draws rows
				z1 = j - width / 2;

				// camera matrix calculations
				const x = scale_x * (cY * (sZ * y1 + cZ * x1) - sY * z1) + x_0;
				const y = scale_y * (sX * (sY * (sZ * y1 + cZ * x1) + cY * z1) + cX * (cZ * y1 - sZ * x1)) + y_0;
				const z = scale_z * (cX * (sY * (sZ * y1 + cZ * x1) + cY * z1) - sX * (cZ * y1 - sZ * x1)) + z_0;

				// trilinear interpolation
				const ix = Math.floor(x)
					, fx = x - ix
					, s0 = 0 <= ix && ix < xDim
					, s1 = 0 <= ix + 1 && ix + 1 < xDim
					, iy = Math.floor(y)
					, fy = y - iy
					, t0 = 0 <= iy && iy < yDim
					, t1 = 0 <= iy + 1 && iy + 1 < yDim
					, iz = Math.floor(z)
					, fz = z - iz
					, u0 = 0 <= iz && iz < zDim
					, u1 = 0 <= iz + 1 && iz + 1 < zDim
					, w000 = s0 && t0 && u0 ? volume[frame].get(ix, iy, iz) : 0.0
					, w010 = s0 && t1 && u0 ? volume[frame].get(ix, iy + 1, iz) : 0.0
					, w100 = s1 && t0 && u0 ? volume[frame].get(ix + 1, iy, iz) : 0.0
					, w110 = s1 && t1 && u0 ? volume[frame].get(ix + 1, iy + 1, iz) : 0.0
					, w001 = s0 && t0 && u1 ? volume[frame].get(ix, iy, iz + 1) : 0.0
					, w011 = s0 && t1 && u1 ? volume[frame].get(ix, iy + 1, iz + 1) : 0.0
					, w101 = s1 && t0 && u1 ? volume[frame].get(ix + 1, iy, iz + 1) : 0.0
					, w111 = s1 && t1 && u1 ? volume[frame].get(ix + 1, iy + 1, iz + 1) : 0.0;

				let val = (1.0 - fz) * ((1.0 - fy) * ((1.0 - fx) * w000 + fx * w100) + fy * ((1.0 - fx) * w010 + fx * w110)) + fz * ((1.0 - fy) * ((1.0 - fx) * w001 + fx * w101) + fy * ((1.0 - fx) * w011 + fx * w111));
				let index = (i * width + j) * 4;

				// fill missing pixels with gaussian noise
				if (val <= 50)
					val = 20 * ((Math.random() + Math.random() + Math.random() + Math.random()) / 4 - 0.5) + 50;

				data[index] = val;
				data[++index] = val;
				data[++index] = val;
				data[++index] = 255;

			}

		}

		ctx.putImageData(imageData, 0, 0);

		frame++;
	
		renderer.clear();
		renderer.render(scene, camera);
		
		requestAnimationFrame(animate);
	}
})