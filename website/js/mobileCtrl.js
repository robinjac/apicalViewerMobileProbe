simulator.controller('mobileCtrl',function($scope,$routeParams){
	const noSleep = new NoSleep();
	const roomID = $routeParams.id;
	const socket = io.connect();
	const gn = new GyroNorm();
	
	$scope.console = 'initializing';
	
	const sensorConfig = {
		frequency:60,					// ( How often the object sends the values - milliseconds )
		gravityNormalized:true,			// ( If the gravity related values to be normalized )
		orientationBase:GyroNorm.GAME,	// ( Can be GyroNorm.GAME or GyroNorm.WORLD. gn.GAME returns orientation values with respect to the head direction of the device. gn.WORLD returns the orientation values with respect to the actual north direction of the world. )
		decimalCount:1,					// ( How many digits after the decimal point will there be in the return values )
		screenAdjusted:false
	};
	
	$scope.label = 'connect';
	
	function enableNoSleep() {
		noSleep.enable();
		document.removeEventListener('click', enableNoSleep, false);
	}
	
	$scope.connect = function(){
		if($scope.label == 'connect'){
			$scope.label = 'disconnect';
			socket.connect();
			
			socket.emit('probe connect', {room: roomID});
			$scope.room = roomID;
			
			if(gn.isRunning() == true)
				gn.setHeadDirection();
			
			document.addEventListener('click', enableNoSleep, false);
			
		}else{
			$scope.label = 'connect';
			socket.disconnect();
			noSleep.disable();
		}
	}
	
	gn.init(sensorConfig).then(function(){
		gn.start(function(data){

			if($scope.label == 'disconnect')
				socket.emit('update movement', {alpha: data.do.alpha, beta: data.do.beta, gamma: data.do.gamma}, roomID);
	
		});
	}).catch(function(e){
		// Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
		console.error('Sorry this device does not have DeviceOrientation or DeviceMotion support.')
	});

	})