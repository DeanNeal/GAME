import * as THREE from 'three';
import { Vector3, Camera, Mesh, Quaternion, Object3D } from 'three';
import { ViewMode } from '../../services/global.service';

export class PlayerControls {
	// API
	public object;
	public camera;
	public initPosition: Vector3;
	public container;
	public viewMode = 0;
	public disabled = false;
	// movementSpeed = 0;
	public rollSpeed = Math.PI / 3.5;

	public dragToLook = false;
	private isMoving = false;
	// autoForward = false;

	private movementSpeedMultiplier = 0;
	public maxSpeed = 100;
	public acceleration = 0.6;

	private rotationSpeedMultiplier = 0;
	public maxRotationSpeed = 1;
	public rotationAcceleration = 0.04;

	private tmpQuaternion: Quaternion = new THREE.Quaternion();
	private mouseStatus = 0;
	private moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0, freeze: 0 };
	private moveVector: Vector3 = new THREE.Vector3(0, 0, 0);
	private rotationVector: Vector3 = new THREE.Vector3(0, 0, 0);


	movementKeyCodes = [87, 83, 65, 68, 82, 70, 38, 40]

	constructor(object: Mesh | Object3D, container: HTMLCanvasElement, camera: Camera) {

		this.object = object;
		this.camera = camera;
		this.container = container;
		this.initPosition = camera.position.clone();


		this.updateMovementVector();
		this.updateRotationVector();
	}

	keydown(event: KeyboardEvent) {

		if (event.altKey) {
			return
		}

		// console.log( event.keyCode);
		// event.preventDefault();

		switch (event.keyCode) {

			// case 16: /* shift */ this.movementSpeedMultiplier = .1; break;

			case 16: this.moveState.freeze = 1; break;

			case 87: /*W*/ this.moveState.forward = 1; break;
			case 83: /*S*/ this.moveState.back = 1; break;

			// case 65: /*A*/ this.moveState.left = 1; break;
			// case 68: /*D*/ this.moveState.right = 1; break;

			// case 82: /*R*/ this.moveState.up = 1; break;
			// case 70: /*F*/ this.moveState.down = 1; break;

			case 38: /*up*/ this.moveState.pitchUp = 1; break;
			case 40: /*down*/ this.moveState.pitchDown = 1; break;

			case 37: /*left*/ this.moveState.yawLeft = 1; break;
			case 39: /*right*/ this.moveState.yawRight = 1; break;

			case 81: /*Q*/ this.moveState.rollLeft = 1; break;
			case 69: /*E*/ this.moveState.rollRight = 1; break;

		}
		if (this.movementKeyCodes.indexOf(event.keyCode) > -1) {
			this.isMoving = true;
		}

		// this.updateMovementVector();
		// this.updateRotationVector();

	}

	keypress(event: KeyboardEvent) {
		// console.log( event.keyCode);
	}

	keyup(event: KeyboardEvent) {

		switch (event.keyCode) {

			// case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

			case 16: this.moveState.freeze = 0; break;

			case 87: /*W*/ this.moveState.forward = 0; break;
			case 83: /*S*/ this.moveState.back = 0; break;

			// case 65: /*A*/ this.moveState.left = 0; break;
			// case 68: /*D*/ this.moveState.right = 0; break;

			// case 82: /*R*/ this.moveState.up = 0; break;
			// case 70: /*F*/ this.moveState.down = 0; break;

			case 38: /*up*/ this.moveState.pitchUp = 0; break;
			case 40: /*down*/ this.moveState.pitchDown = 0; break;

			case 37: /*left*/ this.moveState.yawLeft = 0; break;
			case 39: /*right*/ this.moveState.yawRight = 0; break;

			case 81: /*Q*/ this.moveState.rollLeft = 0; break;
			case 69: /*E*/ this.moveState.rollRight = 0; break;

		}
		if (this.movementKeyCodes.indexOf(event.keyCode) > -1) {
			this.isMoving = false;
		}


		// this.updateMovementVector();
		// this.updateRotationVector();

	}

	mousedown(event: MouseEvent) {
		//if (!document.querySelector('.chatRoom').contains(event.target)) {


		// if ( this.domElement !== document ) {

		// 	this.domElement.focus();

		// }

		// event.preventDefault();
		// event.stopPropagation();

		if (this.dragToLook) {

			this.mouseStatus++;

		} else {

			// switch ( event.button ) {

			// 	case 0: this.moveState.forward = 1; break;
			// 	case 2: this.moveState.back = 1; break;

			// }

			this.updateMovementVector();

		}
		//}
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;

		this.initPosition = this.camera.position.clone();
	}

	mousemove(event: MouseEvent) {

		if ((!this.dragToLook || this.mouseStatus > 0)) {

			var container = this.getContainerDimensions();
			var halfWidth = container.size[0] / 2;
			var halfHeight = container.size[1] / 2;

			this.moveState.yawLeft = - ((event.pageX - container.offset[0]) - halfWidth) / halfWidth;
			this.moveState.pitchDown = ((event.pageY - container.offset[1]) - halfHeight) / halfHeight;

			// this.updateRotationVector();
		}

	}

	mouseup(event: MouseEvent) {
		//if (!document.querySelector('.chatRoom').contains(event.target)) {
		// event.preventDefault();
		// event.stopPropagation();

		if (this.dragToLook) {

			this.mouseStatus--;

			this.moveState.yawLeft = this.moveState.pitchDown = 0;

		} else {

			// switch ( event.button ) {

			// 	case 0: this.moveState.forward = 0; break;
			// 	case 2: this.moveState.back = 0; break;

			// }

			this.updateMovementVector();

		}

		// this.updateRotationVector();
		//}

	}

	mousewheel() {

	}

	_rotation() {
		if (this.moveState.rollLeft) {
			this.rotationSpeedMultiplier += this.rotationSpeedMultiplier < this.maxRotationSpeed ? this.rotationAcceleration : 0;
		}
		if (this.moveState.rollRight) {
			this.rotationSpeedMultiplier -= this.rotationSpeedMultiplier > -this.maxRotationSpeed ? this.rotationAcceleration : 0;
		}

		if (!this.moveState.rollLeft && !this.moveState.rollRight) {
			if (this.rotationSpeedMultiplier > 0) {
				this.rotationSpeedMultiplier -= this.rotationSpeedMultiplier > 0 ? this.rotationAcceleration / 2 : 0;
			} else {
				this.rotationSpeedMultiplier += this.rotationSpeedMultiplier < 0 ? this.rotationAcceleration / 2 : 0;
			}
		}
	}

	_movement() {
		if (this.moveState.forward) {
			this.movementSpeedMultiplier += this.movementSpeedMultiplier < this.maxSpeed ? this.acceleration : 0;
		}
		if (this.moveState.back) {
			this.movementSpeedMultiplier -= this.movementSpeedMultiplier > -this.maxSpeed ? this.acceleration : 0;
		}

		if (!this.moveState.forward && !this.moveState.back) {
			if (!this.moveState.freeze) {
				if (this.movementSpeedMultiplier > 0) {
					this.movementSpeedMultiplier -= this.movementSpeedMultiplier > 0 ? (this.acceleration / 3) : 0;
				} else {
					this.movementSpeedMultiplier += this.movementSpeedMultiplier < 0 ? (this.acceleration / 3) : 0;
				}
			}
		}

		this.movementSpeedMultiplier = Math.round(this.movementSpeedMultiplier * 100) / 100;
	}

	update(delta: number) {
		if (this.isMoving) this.updateMovementVector();
		this.updateRotationVector();


		this._movement();
		this._rotation();



		var moveMult = Math.round(delta /** this.movementSpeed*/ + Math.abs(this.movementSpeedMultiplier));
		var rotMult = delta * this.rollSpeed;
		// console.log(rotMult);	

		// console.log(moveMult, this.moveVector.z);	
		this.object.translateX(this.moveVector.x * moveMult);
		this.object.translateY(this.moveVector.y * moveMult);
		this.object.translateZ(this.moveVector.z * moveMult);

		this.tmpQuaternion.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1).normalize();

		// if(!this.moveState.freeze) {
		this.object.quaternion.multiply(this.tmpQuaternion);

		// expose the rotation vector for convenience
		this.object.rotation.setFromQuaternion(this.object.quaternion, this.object.rotation.order);

		this.cameraUpdate();

		//smooth stop
		if (this.disabled) {
			this.moveState.yawLeft = Math.abs(this.moveState.yawLeft) > 0.0005 ? this.moveState.yawLeft / 1.04 : 0
			this.moveState.pitchDown = Math.abs(this.moveState.pitchDown) > 0.0005 ? this.moveState.pitchDown / 1.04 : 0

			this.updateRotationVector();
		}

		return moveMult;
	}

	cameraUpdate() {
		const factor = this.viewMode === 0 ? 0.1 : 5;
		this.camera.position.z = this.initPosition.z + (this.movementSpeedMultiplier >= 0 ? this.movementSpeedMultiplier * factor : 0);
	}

	updateMovementVector() {

		// var forward = (this.moveState.forward && !this.moveState.back) ? 1 : 0;
		// forward = (!this.moveState.forward && this.moveState.back) ? -1 : 0;

		var forward = this.movementSpeedMultiplier >= 1 ? 1 : -1;


		// console.log(this.movementSpeedMultiplier);
		//( this.moveState.forward || ( /*this.autoForward */ false && !this.moveState.back ) ) ? 1 : 0;

		this.moveVector.x = (-this.moveState.left + this.moveState.right);
		this.moveVector.y = (-this.moveState.down + this.moveState.up);
		this.moveVector.z = (-forward /*+ this.moveState.back */);

		// this.direction = !this.direction;

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	}

	updateRotationVector() {
		this.rotationVector.x = (-this.moveState.pitchDown + this.moveState.pitchUp);
		this.rotationVector.y = (-this.moveState.yawRight + this.moveState.yawLeft);
		this.rotationVector.z = this.rotationSpeedMultiplier;//( -this.moveState.rollRight + this.moveState.rollLeft) ;

		//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

	}

	getContainerDimensions() {

		// if ( this.domElement != document ) {

		// 	return {
		// 		size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
		// 		offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
		// 	};

		// } else {

		return {
			// size	: [ container.innerWidth, container.innerHeight ],
			size: [this.container.width, this.container.height],
			offset: [0, 0]
		};

		// }

	}

	// this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	reset() {
		this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0, freeze: 0 };
	}
}
