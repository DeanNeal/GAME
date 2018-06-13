import * as THREE from 'three'

// import './threejs/loaders/ObjectLoader';

// import * as THREE  from './threejs/Three';
var loader = new THREE.ObjectLoader();

function loadStarship(cb: Function) {
	// load a resource
	loader.load(
		// resource URL
		'models/fast-ship.json',
		// called when resource is loaded
		function ( object ) {
			var obj;
			// scene.add( object );
			var group = new THREE.Group();
			object.children.forEach(r=> {
				if(r.type === 'Mesh') {				
					r.scale.set(10,10,10);
					// group.add(r);
					obj  = r;
				}
			});
			
			cb(obj);

		},
		// called when loading is in progresses
		function ( xhr ) {

			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

		},
		// called when loading has errors
		function ( error ) {

			console.log( 'An error happened' );

		}
	);
}

export {
	loadStarship
}