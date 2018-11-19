import {
    Mesh,
    MeshPhongMaterial,
    MeshBasicMaterial,
    CircleGeometry,
    DoubleSide,
    Quaternion
} from 'three';

import { DegToRad } from './utilities.js';

export class Torso {

    constructor(geometry, scene) {
        // Initialize transparent to false
        this.transparent = false;

        this.body = new Mesh(geometry.body, new MeshPhongMaterial({ color: 0xfcb5bc, transparent: false, opacity: 0.30 }));
        this.body.position.set(-8, -130, -5);
        this.body.scale.set(2, 2, 2);

        this.heart = new Mesh(geometry.heart, new MeshPhongMaterial({ color: 0x990000, specular: 0x111111, shininess: 200 }));
        this.heart.position.set(-5, 7, 3);
        this.heart.rotation.set(-Math.PI / 2 - DegToRad * 15, 0, Math.PI);
        this.heart.scale.set(0.31, 0.29, 0.31);
        this.heart.material.visible = false;

        // Add to scene
        scene.add(this.heart);
        scene.add(this.body);
    }

    shiftY(Y) {
        this.body.position.set(-8, -130 + Y, -5);
        this.heart.position.set(-5, 7 + Y, 3);
    }

    transparency(on) {
        if (on === true) {
            this.body.material.depthWrite = false;
            this.body.material.transparent = true;
            this.heart.material.visible = true;
            this.transparent = true;
        } else if (on === false) {
            this.body.material.depthWrite = true;
            this.body.material.transparent = false;
            this.heart.material.visible = false;
            this.transparent = false;
        }
    }

    getBody() {
        return this.body;
    }

    isTransparent() {
        return this.transparent;
    }
}

export class Probe {

    constructor(TGeometry, scene, bcolor, scolor) {
        // Orient body of the transducer geometry

        TGeometry.translate(-10, -52.5, 1.3);
        TGeometry.rotateX(-Math.PI / 2 - DegToRad * 15);
        TGeometry.rotateZ(-DegToRad * 70);

        const SGeometry = new CircleGeometry(40, 5, Math.PI / 2, Math.PI / 3);
        SGeometry.rotateX(-Math.PI / 2);
        SGeometry.rotateY(-0.5);

        this.body = new Mesh(TGeometry, new MeshPhongMaterial({ color: bcolor, specular: 0x050505, shininess: 400, transparent: false, opacity: 0.30 }));
        this.body.position.set(-8, 0, 24);
        this.body.scale.set(3, 3, 3);

        this.sector = new Mesh(SGeometry, new MeshBasicMaterial({ color: scolor, transparent: false, opacity: 0.30 }));
        this.sector.material.side = DoubleSide;
        this.sector.material.visible = false;
        this.sector.position.set(-8, 0, 24)

        this.bodyOrientation = new Quaternion();
        this.sectorOrientation = new Quaternion();

        this.bodyOrientation.copy(this.body.quaternion);
        this.sectorOrientation.copy(this.sector.quaternion);

        scene.add(this.sector);
        scene.add(this.body);
    }

    shiftY(Y) {
        this.body.position.y = Y;
        this.sector.position.y = Y;
    }

    highlight(on = false) {
        if (on === true) {
            // Body becomes blue
            this.body.material.color.setHex(0x215db7);
        } else if (on === false) {
            // Body becomes gray
            this.body.material.color.setHex(0xa1a2a3);
        }
    }

    transparency(on) {
        if (on === true) {
            this.body.material.transparent = true;
            this.sector.material.transparent = true;
        } else if (on === false) {
            this.body.material.transparent = false;
            this.sector.material.transparent = false;
        }
    }

    sectorVisible(on) {
        if (on === true) {
            this.sector.material.visible = true
        } else if (on === false) {
            this.sector.material.visible = false
        }
    }

    rotateX(delta) {
        this.body.rotateX(delta);
        this.sector.rotateX(delta);

        this.bodyOrientation.copy(this.body.quaternion);
        this.sectorOrientation.copy(this.sector.quaternion);
    }

    rotateY(delta) {
        this.body.rotateY(delta);
        this.sector.rotateY(delta);

        this.bodyOrientation.copy(this.body.quaternion);
        this.sectorOrientation.copy(this.sector.quaternion);
    }

    rotateZ(delta) {
        this.body.rotateZ(delta);
        this.sector.rotateZ(delta);

        this.bodyOrientation.copy(this.body.quaternion);
        this.sectorOrientation.copy(this.sector.quaternion);
    }

    setRotationFromQuaternion(q = undefined) {

        if (q !== undefined) {
            this.body.quaternion.multiply(q);
            this.sector.quaternion.multiply(q);
        } else {
            this.body.setRotationFromQuaternion(this.bodyOrientation);
            this.sector.setRotationFromQuaternion(this.sectorOrientation);
        }
    }

    get position() {
        return this.body.position;
    }

    get rotation() {
        return this.body.rotation;
    }

    getBody() {
        return this.body;
    }

    setPosition(vector) {
        this.body.position.copy(vector);
        this.sector.position.copy(vector);
    }

    setOrientation(pitch, tilt, rotate) {
        this.body.rotation.set(pitch, tilt, rotate);
        this.sector.rotation.set(pitch, tilt, rotate);

        this.bodyOrientation.copy(this.body.quaternion);
        this.sectorOrientation.copy(this.sector.quaternion);
    }

    moveTo(intersects, onHold = false) {
        // Reset position, otherwise lookAt won't work
        this.body.position.set(0, 0, 0);
        this.sector.position.set(0, 0, 0);

        if (!onHold) {
            this.body.lookAt(intersects[0].face.normal);
            this.sector.lookAt(intersects[0].face.normal);

            this.bodyOrientation.copy(this.body.quaternion);
            this.sectorOrientation.copy(this.sector.quaternion);
        }

        this.body.position.copy(intersects[0].point);
        this.sector.position.copy(intersects[0].point);
    }

    show() {
        this.body.material.visible = true;
        this.sector.material.visible = true;
    }

    hide() {
        this.body.material.visible = false;
        this.sector.material.visible = false;
    }

}
