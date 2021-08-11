/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable default-case */
import React, { useEffect } from 'react'
import * as THREE from '../../node_modules/three/build/three.module'
import { PointerLockControls } from '../controls/PointerLockControls'

function WalkingZone() {
    // const [cameraPosSnapshot, setCameraPosSnapshot] = useState()

    let furthestX = 0
    let furthestY = 0
    let furthestZ = 0

    let camera, scene, renderer, controls;
    let objects = [];
    let raycaster;

    let crouchToggle = false;
    let sprintToggle = false;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let canJump = false;

    let prevTime = performance.now();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    const color = new THREE.Color();

    const addNewItems = () => {
        // floor
        let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );

        // vertex displacement
        let position = floorGeometry.attributes.position;
        floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
        position = floorGeometry.attributes.position;

        // objects
        const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 ).toNonIndexed();

        position = boxGeometry.attributes.position;
        const colorsBox = [];

        for ( let i = 0, l = position.count; i < l; i ++ ) {
            color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            colorsBox.push( color.r, color.g, color.b );
        }

        boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

        const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );

        const amountObjectsAddedAtOnce = 500

        let furthestXInner = 0
        let furthestYInner = 0
        let furthestZInner = 0
        for ( let i = 0; i < amountObjectsAddedAtOnce; i ++ ) {
            boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    
            const box = new THREE.Mesh( boxGeometry, boxMaterial );
            
            box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20 + camera.position.x; // x pos is -10 - 10 + (current position) so it's always within this range of values away from current pos
            box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10 + camera.position.y; // y pos is 10 - 4000 + (current position)
            box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20 + camera.position.z; // z pos is -10 - 10 + (current position)
              
            if (Math.abs(furthestXInner) < Math.abs(box.position.x) ) furthestXInner = box.position.x
            if (Math.abs(furthestYInner) < Math.abs(box.position.y) ) furthestYInner = box.position.y
            if (Math.abs(furthestZInner) < Math.abs(box.position.z) ) furthestZInner = box.position.z



            scene.add( box );
            objects.push( box );
        }

        furthestX = furthestXInner
        furthestY = furthestYInner
        furthestZ = furthestZInner

        // remove previous boxes from 5 gens ago
        if (amountObjectsAddedAtOnce * 6 <= objects.length) {
            const objectsToRemove = objects.slice(0, amountObjectsAddedAtOnce + 1)
            objects = objects.slice(amountObjectsAddedAtOnce + 1)
            scene.remove(objectsToRemove)
        }
    }

    // initial placement of scene + objects
    async function init() {
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.y = 10;

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xffffff );
        scene.fog = new THREE.Fog( 0xffffff, 0, 100 );

        const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
        light.position.set( 0.5, 1, 0.75 );
        scene.add( light );

        controls = new PointerLockControls( camera, document.body );

        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );

        instructions.addEventListener( 'click', function () {
            controls.lock();
        } );

        controls.addEventListener( 'lock', function () {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        } );

        controls.addEventListener( 'unlock', function () {
            blocker.style.display = 'block';
            instructions.style.display = '';
        } );

        scene.add( controls.getObject() );

        const onKeyDown = function ( event ) {
            switch ( event.code ) {
                case 'ControlLeft':
                case 'ControlRight':
                    if (!crouchToggle) crouchToggle = true
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    if (!sprintToggle) sprintToggle = true 
                    break;

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = true;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = true;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = true;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = true;
                    break;

                case 'Space':
                    if ( canJump === true ) velocity.y += 350;
                    canJump = false;
                    break;
            }
        };

        const onKeyUp = function ( event ) {
            switch ( event.code ) {
                case 'ControlLeft':
                case 'ControlRight':
                    if (crouchToggle) crouchToggle = false 
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    if (sprintToggle) sprintToggle = false
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;
            }
        };

        document.addEventListener( 'keydown', onKeyDown );
        document.addEventListener( 'keyup', onKeyUp );

        raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        addNewItems() // adds the initial objects at index 0

        window.addEventListener( 'resize', onWindowResize );
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    // animate function creates an infinite loop to req new animation frames for scene
    function animate() {

        requestAnimationFrame( animate );

        const time = performance.now();

        if ( controls.isLocked === true ) {

            raycaster.ray.origin.copy( controls.getObject().position );
            raycaster.ray.origin.y -= 10;

            const intersections = raycaster.intersectObjects( objects );

            const onObject = intersections.length > 0;

            const delta = ( time - prevTime ) / 1000;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            direction.z = Number( moveForward ) - Number( moveBackward );
            direction.x = Number( moveRight ) - Number( moveLeft );
            direction.normalize(); // this ensures consistent movements in all directions

            if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
            if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;
            if (sprintToggle) {
                const maxCombinedVelocity = 160
                const combinedvelocity = Math.abs(velocity.x) + Math.abs(velocity.z)
                const isUnderSpeedLimit = combinedvelocity < maxCombinedVelocity

                velocity.x = velocity.x *  (isUnderSpeedLimit ? 1.2 : 1)
                velocity.z = velocity.z * (isUnderSpeedLimit ? 1.2 : 1)

                console.log('SPRINT', { x: Math.abs(velocity.x), z: Math.abs(velocity.z) })
            }

            if (crouchToggle) {
                sprintToggle = false
                camera.position.y -= 5
            }

            if ( onObject === true ) {
                velocity.y = Math.max( 0, velocity.y );
                canJump = true;
            }

            controls.moveRight( - velocity.x * delta );
            controls.moveForward( - velocity.z * delta );
            
            controls.getObject().position.y += ( velocity.y * delta ); // new behavior

            let isNearEdge = false

            // creates values to see if unit has travelled X units in some direction

            const { x, y, z } = camera.position

            const is3UnitsAwayEdgeX =  Math.abs(furthestX) - Math.abs(x) <= 4 // if its within 4 units of edge of x
            const is3UnitsAwayEdgeY =  Math.abs(furthestY) - Math.abs(y) <= 4 // if its within 4 units of edge of y
            const is3UnitsAwayEdgeZ =  Math.abs(furthestZ) - Math.abs(z) <= 4 // if its within 4 units of edge of z

            isNearEdge = is3UnitsAwayEdgeX || is3UnitsAwayEdgeY || is3UnitsAwayEdgeZ
            console.log('isNear Edge', { isNearEdge, objects, sceneChil: scene.children })


            if (isNearEdge) {
                // snapshot creates a new area of blocks + returns a snapshot of the current furthest units spawned
                addNewItems()
            }


            if ( controls.getObject().position.y < 10 ) {

                velocity.y = 0;
                controls.getObject().position.y = crouchToggle ? 5 : 10;

                canJump = true;

            }

        }

        prevTime = time;

        renderer.render( scene, camera );

    }

    // first/last render
    useEffect(async () => {
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }

        // mounting
        await init().then(() => animate())
        
        window.addEventListener('resize', handleResize, false)

        // unmounting
        return () => {
            window.removeEventListener('resize', handleResize, false)
        }
    }, [])

    return (
        <div id="blocker">
            <div id="instructions">
                <p className='playText'>
                    Click to play
                </p>
                <p>
                    Move: WASD<br/>
                    Jump: SPACE<br/>
                    Look: MOUSE
                    Sprint: HOLD SHIFT
                    Crouch: HOLD CTRL
                </p>
            </div>
        </div>
    )
}

export default WalkingZone
