simulator.controller('homeCtrl',function($scope, $location){
	
	if(MobileEsp.DetectAndroid() == true){
		$location.path('/mobile/');
	}else{
		$location.path('/simulator/');
	}
	
})