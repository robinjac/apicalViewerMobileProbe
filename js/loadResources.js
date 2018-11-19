import torsoURL from '../files/stl/torso.bin';
import heartURL from '../files/stl/heart.bin';
import probeURL from '../files/stl/probe.bin';

import pako from 'pako';
import STLBuilder from './STLBuilder.js';

import { LoadingManager, FileLoader } from 'three';

const // Initialize all the loaders
    manager = new LoadingManager(),
    file = new FileLoader(manager).setResponseType('arraybuffer');

// Initialize return object
const resources = {
    torsoGeometry: undefined,
    heartGeometry: undefined,
    probeGeometry: undefined
}

export default {
    loadAll: () => {

        // Load, uncompress and create the stl model of human torso
        file.load(torsoURL, (data) => {
            const torso = pako.inflate(data);
            resources.torsoGeometry = STLBuilder.parse(torso.buffer);
        });
        
        // Load, uncompress and create the stl model of human heart
        file.load(heartURL, (data) => {
            const heart = pako.inflate(data);
            resources.heartGeometry = STLBuilder.parse(heart.buffer);
        });
        
        // Load, uncompress and create the stl model of ultrasound probe
        file.load(probeURL, (data) => {
            const probe = pako.inflate(data);
            resources.probeGeometry = STLBuilder.parse(probe.buffer);
        });
    },

    // While loading notify of progress
    whileLoading: (fn) => {manager.onProgress = fn},

    // When done loading all resources, package everything as a object and send it
    whenDone: (fn) => {manager.onLoad = () => fn(resources)},
}

