import { Scene, 
         HemisphereLight,
         PerspectiveCamera,
         WebGLRenderer,
         Vector3,
         Color } from 'three';
         
import OrbitControls from 'three-orbitcontrols';

import dat from './lib/dat.gui.min.js';
import ProgressBar from './lib/progressbar.min.js';

export const DegToRad = Math.PI/180,
             xDim = 140, 
             yDim = 203, 
             zDim = 140,
             numOfFrames = 48;

export function createCamera(container){
    const camera = new PerspectiveCamera(70, container.offsetWidth / container.offsetHeight, 1, 1000);
    camera.position.z = 160;
    return camera;
}

export function createRenderer(container){
    //const renderer = new WebGLRenderer({ antialias: true });
    const renderer = new WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x353535, 1.0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;

    container.appendChild(renderer.domElement);

    return renderer;
}

export function createControls(camera, container){
    const controls = new OrbitControls(camera, container);
    controls.enablePan = false;
    //controls.enableZoom = true;
    controls.minDistance = 90;
    controls.maxDistance = 160;
    controls.target = new Vector3(-8, 0, -5);
    controls.update();
    return controls;
}

export function createScene(){
    const scene = new Scene();
    scene.background = new Color(0x353535);
    scene.add(new HemisphereLight(0x443333, 0xb2b2c1));
    return scene;
}

export function createGUI(){
    const controls = {
        Pitch: 0,
        Tilt: 0,
        Rotate: 0,
        Hold: false,
        Aquire: () => {}
    }

    const gui = new dat.GUI({autoPlace:false, width: 320}),
          pitchCtrl = gui.add(controls, 'Pitch', -90, 90),
          tiltCtrl = gui.add(controls, 'Tilt', -90, 90),
          rotateCtrl = gui.add(controls, 'Rotate',-90, 90),
          holdCtrl =  gui.add(controls, 'Hold'),
          aquireCtrl = gui.add(controls, 'Aquire');

    gui.closed = true;

    document.getElementById('gui').appendChild(gui.domElement);

    const buttons = gui.domElement.getElementsByClassName('property-name');

    buttons[0].innerHTML = '<i class="fas fa-arrows-alt-v"></i> &nbsp Pitch';
    buttons[1].innerHTML = '<i class="fas fa-arrows-alt-h"></i> &nbsp Tilt';
    buttons[2].innerHTML = '<i class="fas fa-sync-alt"></i> &nbsp Rotate';
    buttons[3].innerHTML = '<i class="fas fa-lock"></i> &nbsp Hold';
    buttons[4].innerHTML = '<i class="fas fa-check"></i> &nbsp Aquire';

    return {gui: gui, pitch: pitchCtrl, tilt: tiltCtrl, rotate: rotateCtrl, hold: holdCtrl, aquire: aquireCtrl};
}

// Draws the 2D slice display
export function drawBorder(){

    const canvas = document.getElementById('display');
    const ctx = canvas.getContext('2d');
    const dwidth = canvas.width;
    const dheight = canvas.height;

    const c = dheight * 0.879;
    const d = dwidth * 0.115 * 0.5;

    ctx.strokeStyle = '#00000';
    ctx.lineWidth = 9;

    ctx.beginPath();
    ctx.moveTo(dwidth / 2, 0);
    ctx.lineTo(dwidth - d, c);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dwidth / 2, 0);
    ctx.lineTo(d, c);
    ctx.stroke();

    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.ellipse(dwidth / 2, c, (dwidth) / 2 - d, dheight * 0.09, 0, 0, Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, dheight);
    ctx.lineTo(dwidth, dheight);
    ctx.stroke();
};

// Create the loadingbar animation
export function createLoadingBar(element){ 

    document.getElementById('loadingScreen').innerHTML = 
       `<div id="heartBox" class="human-heart" style="z-index:1; position: absolute; top: -120px; left: -120px">
            <i class="fas fa-heart fa-8x" style="color: #f2373d; position: absolute; top: 60px; left: 60px"></i>
        </div>
        <div style="z-index:2" id="loading"></div>`

    const loadingBar = new ProgressBar.Circle(element, {
        color: '#aaa',
        // This has to be the same size as the maximum width to
        // Prevent clipping
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
                    circle.setText('0');
                } else {
                    circle.setText(value);
                }
    
            }
        });

        loadingBar.text.style.fontSize = '2rem';
        loadingBar.text.style.color = 'white';
    
    return loadingBar;
};

export function createAndInitializefeedback(){

    const style = {
        strokeWidth: 4,
        easing: 'easeInOut',
        duration: 1400,
        color: '#FFEA82',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: {width: '100%', height: '100%'},
        step: (state, bar) => {
          bar.path.setAttribute('stroke', state.color);
        }
      }

    const orientationBar = new ProgressBar.Line('#orientation', style);  
    const positionBar = new ProgressBar.Line('#position', style);

    return {orientationBar, positionBar};
}

export function initModal(msg) {
    new QRCode(document.getElementById("qrcode"), {text: msg, width: 300, height: 300, correctLevel : QRCode.CorrectLevel.L});

    // Get the modal
    const modal = document.getElementById('myModal');

    // Get the button that opens the modal
    const btn = document.getElementById("qr");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0];

    // When the user clicks on the button, open the modal 
    btn.onclick = function() {
        modal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}