
export default function (camera, ship, domElement) {
	var stirLeft, stirRight, speedUp, slowDown = false;
	var spaceshipSpeed = 0;
	const topSpeed = 1;
	const maxSpaceshipRotation = Math.PI/4;
	var spaceship = null;
	var startfield = null;
	// var block = null;
	var spaceship = ship;


	this.domElement = ( domElement !== undefined ) ? domElement : document;

	registerKeyboardEvents();


	function onKeyDown(e) {
		const left = 65;//37;
		const up = 87;//38;
		const right = 68;//39;
		const down = 83;//40;

		switch(e.keyCode) {
			case left:

			stirLeft = true;
			break;
			
			case right:
			stirRight = true;
			break;

			case up:				
			speedUp = true;
			break;

			case down:
			slowDown = true;
			break;
		}
	}

	function onKeyUp(e) {
		// const left = 37;
		// const up = 38;
		// const right = 39;
		// const down = 40;
		const left = 65;//37;
		const up = 87;//38;
		const right = 68;//39;
		const down = 83;//40;
		const space = 32;

		switch(e.keyCode) {
			case left:					
			stirLeft = false;
			break;
			
			case right:
			stirRight = false;
			break;

			case up:				
			speedUp = false;
			break;

			case down:
			slowDown = false;
			break;

			// case space:
			// jump();
			break;
		}
	}


	function registerKeyboardEvents() {
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);
	}

	function updateMovementVector() {
		// var forward = ( this.moveState.forward || ( this.autoForward && !this.moveState.back ) ) ? 1 : 0;

		// this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
		// this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
		// this.moveVector.z = ( -forward + this.moveState.back );

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );
	}

	function updateShip() {
		if(stirLeft) {
			spaceship.position.x -= 1;
			// spaceship.rotation.z = Math.min(maxSpaceshipRotation, spaceship.rotation.z + Math.PI / 135);

		} else if(stirRight) {
			spaceship.position.x += 1;
			// spaceship.rotation.z = Math.max(-maxSpaceshipRotation, spaceship.rotation.z - Math.PI / 135);
		} else {
			// Restore rotation
			// if(Math.abs(spaceship.rotation.z) > Math.PI / 90 ) {
			// 	if(spaceship.rotation.z > 0) {
			// 		spaceship.rotation.z -= Math.PI / 90
			// 	} else {
			// 		spaceship.rotation.z += Math.PI / 90
			// 	}
			// }
		}

		// if(speedUp) {
		// 	spaceshipSpeed = Math.min(topSpeed, spaceshipSpeed + 0.1);
		// } else if(slowDown) {
		// 	spaceshipSpeed = Math.max(0.3, spaceshipSpeed - 0.2);
		// }

		spaceship.position.z -= spaceshipSpeed;

		// camera.position.z = spaceship.position.z + 0.5;
		camera.position.z = spaceship.position.z  + 50 + spaceshipSpeed*4;


		camera.lookAt(new THREE.Vector3(0, 0, camera.position.z -1));

		// Sync with Physics
		// spaceship.position.y = block.position.y;

		// block.position.z = spaceship.position.z;
		// block.position.x = spaceship.position.x;
		// block.__dirtyPosition = true;
	}


	this.updateShip = updateShip;

}
		