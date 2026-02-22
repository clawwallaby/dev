// app.js - Missile Command Clone with Three.js

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x000000);

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Bases
const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const base1 = new THREE.Mesh(baseGeometry, baseMaterial);
base1.position.set(-20, 0.5, 0);
scene.add(base1);

const base2 = new THREE.Mesh(baseGeometry, baseMaterial);
base2.position.set(20, 0.5, 0);
scene.add(base2);

const bases = [base1, base2];

camera.position.y = 20;
camera.position.z = 50;
camera.lookAt(0, 0, 0);

// Game variables
let score = 0;
let missiles = [];
let lasers = [];
let explosions = [];
let gameOver = false;

// High scores
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Update high scores display
function updateHighScores() {
    const highScoresDiv = document.getElementById('highScores');
    highScoresDiv.innerHTML = 'High Scores:<br>' + highScores.map((hs, i) => `${i+1}. ${hs.initials} - ${hs.score}`).join('<br>');
}
updateHighScores();

// Spawn missiles
function spawnMissile() {
    if (gameOver) return;
    const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    missile.position.set(THREE.MathUtils.randFloat(-50, 50), 50, THREE.MathUtils.randFloat(-50, 50));
    missile.velocity = new THREE.Vector3(0, -0.5, 0);
    scene.add(missile);
    missiles.push(missile);
}

// Shoot laser
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (gameOver) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(ground);

    if (intersects.length > 0) {
        const target = intersects[0].point;

        // Find nearest base
        let nearestBase = bases[0];
        let minDist = nearestBase.position.distanceTo(target);
        for (let i = 1; i < bases.length; i++) {
            const dist = bases[i].position.distanceTo(target);
            if (dist < minDist) {
                minDist = dist;
                nearestBase = bases[i];
            }
        }

        // Create laser
        const laserGeometry = new THREE.BufferGeometry().setFromPoints([nearestBase.position, target]);
        const laserMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const laser = new THREE.Line(laserGeometry, laserMaterial);
        scene.add(laser);
        lasers.push({ line: laser, end: target, speed: 2 });
    }
});

// Explosion
function createExplosion(position) {
    const explosion = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    explosion.position.copy(position);
    explosion.scale.set(0.1, 0.1, 0.1);
    scene.add(explosion);
    explosions.push(explosion);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!gameOver) {
        // Update missiles
        missiles = missiles.filter(m => {
            m.position.add(m.velocity);
            if (m.position.y <= 0) {
                gameOver = true;
                document.getElementById('gameOver').style.display = 'block';
                document.getElementById('finalScore').textContent = score;
                scene.remove(m);
                return false;
            }
            return true;
        });

        // Update lasers
        lasers = lasers.filter(l => {
            // Simple laser animation (remove after reaching target)
            scene.remove(l.line);
            return false; // For now, lasers are instant
        });

        // Check intersections
        for (let i = missiles.length - 1; i >= 0; i--) {
            for (let j = lasers.length - 1; j >= 0; j--) {
                // Simplified intersection (distance check)
                if (missiles[i].position.distanceTo(lasers[j].end) < 2) {
                    createExplosion(missiles[i].position);
                    scene.remove(missiles[i]);
                    missiles.splice(i, 1);
                    score += 10;
                    document.getElementById('score').textContent = `Score: ${score}`;
                    break;
                }
            }
        }

        // Update explosions
        explosions = explosions.filter(e => {
            e.scale.multiplyScalar(1.1);
            if (e.scale.x > 5) {
                scene.remove(e);
                return false;
            }
            return true;
        });
    }

    renderer.render(scene, camera);
}
animate();

// Spawn missiles periodically
setInterval(spawnMissile, 1000);

// Save score
window.saveScore = function() {
    const initials = document.getElementById('initials').value.toUpperCase();
    if (initials.length === 3) {
        highScores.push({ initials, score });
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 10);
        localStorage.setItem('highScores', JSON.stringify(highScores));
        updateHighScores();
        document.getElementById('gameOver').style.display = 'none';
        gameOver = false;
        score = 0;
        document.getElementById('score').textContent = `Score: 0`;
    }
};