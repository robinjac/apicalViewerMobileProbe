
import io from 'socket.io-client';

const socket = io.connect('http://192.168.137.1:8080');

let sending = false;
// let first = true;

const RAD = Math.PI / 180;

document.getElementById('footer').style.display = 'none';

socket.on('connect', function () {
    socket.emit('probe connect', { room: 'test' });
});

const el_mobileProbe = document.getElementById('mobile_probe');
el_mobileProbe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%';

el_mobileProbe.innerHTML =
    `<div style="position: absolute; top: 40%; width: 300px; left: calc(50% - 150px); color:white; text-align: center">
    <div id="position"></div>
    <br>
    <button id="start" style="background-color: rgba(224, 56, 22, 0.5); color: white; height: 60px; width: 200px; border-radius: 100px; font-size: 25px">connect</button>
</div>`

const el_position = document.getElementById('position');
const el_startBtn = document.getElementById('start');

el_startBtn.addEventListener('click', () => {
    if (sending) {
        el_startBtn.innerText = 'start';
        sending = false;
        sendOrientation(sending);
        socket.emit('stopped sending');
    } else {
        el_startBtn.innerText = 'stop';
        sending = true;
        sendOrientation(sending);
        socket.emit('started sending');
    }
});

// Complementary filter: angle = 0.98 * (angle + gyrData * dt) + 0.02 * accData

function updateOrientation(e) {
    const Q = { x: 0, y: 0, z: 0, w: 1 };
    // Convert msec to sec
    const rate = e.interval * 0.001;

    // One step integration and conversion to radians
    // const alpha = 0.998 * e.rotationRate.beta * rate * RAD + 0.002 * e.acceleration.y;
    // const beta = 0.998 * e.rotationRate.alpha * rate * RAD + 0.002 * e.acceleration.x;
    // const gamma = 0.998 * e.rotationRate.gamma * rate * RAD + 0.002 * e.acceleration.z;

    const alpha = e.rotationRate.beta * rate * RAD;
    const beta = e.rotationRate.alpha * rate * RAD;
    const gamma = e.rotationRate.gamma * rate * RAD;

    el_position.innerHTML = `<div style="text-align: left; width: 50%; margin-left: 25%">Pitch: ${beta.toFixed(2)} <br> Tilt: ${gamma.toFixed(2)} <br> Rotation: ${alpha.toFixed(2)}</div>`;

    Q.x = beta / 2;
    Q.y = gamma / 2;
    Q.z = alpha / 2;
    Q.w = 1;

    const norm = Math.sqrt(Q.x ** 2 + Q.y ** 2 + Q.z ** 2 + 1);

    Q.x = Q.x / norm, Q.y = Q.y / norm, Q.z = Q.z / norm, Q.w = Q.w / norm;

    socket.emit('update', Q, 'test');
}

function sendOrientation(sending) {
    if (sending) {
        window.addEventListener('devicemotion', updateOrientation, true);
    } else {
        window.removeEventListener('devicemotion', updateOrientation, true);
    }
}




