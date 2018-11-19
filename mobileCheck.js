const el_mobileCheck = document.getElementById('mobile_check');
const btnStyle = 'width: 80px; border: 1px solid white; border-radius: 5px; background-color: rgba(224, 56, 22, 0.5); color: white; margin: 0 0.6em';

// Don't know if adding to window is a good idea...
window.choice = function (c) {
    el_mobileCheck.style.display = 'none';

    if (c === 'mobile') {
        import('./mobileProbe.js').then( /* run the script */);
    } else {
        import('./js/main.js').then( /* run the script */);
    }
}

// Check device
if (screen.availWidth > 420) {
    el_mobileCheck.style.display = 'none';
    // Dynamically import the app
    import('./js/main.js').then( /* run the script */);
} else {
    el_mobileCheck.style.cssText = 'position: absolute; top: 25%; left: 0; width: 100%; height: 30%';
    el_mobileCheck.innerHTML =
        '<center><h4 style="color: white">Your on a mobile device, would you like to contine in probe mode?</h4>' +
        `<span><button onclick="choice('mobile')" style="background-color: rgba(224, 56, 22, 0.5); color: white; margin-right: 10px">yes</button><button onclick="choice('desktop')" style="background-color: rgba(224, 56, 22, 0.5); color: white">no</button></span></center>`;
}