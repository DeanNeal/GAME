/**
 * @author James Baicoianu / http://www.baicoianu.com/
 */
import  * as THREE from 'three';

export default function flyControls( object, container) {

	this.object = object;
	// camera.position.set(0, 50, 40);
	// this.cameraInitPosition = camera.position.clone();

	this.domElement = container || /*( domElement !== undefined ) ? domElement : */document;
/*	if ( domElement ) this.domElement.setAttribute( 'tabindex', -1 );*/

	// API

	// this.direction = undefined;

	this.viewMode = 0;
	this.disabled = false;

	// this.movementSpeed = 0;
	this.rollSpeed = 0.005;

	this.dragToLook = false;
	this.isMoving = false;
	// this.autoForward = false;

	this.movementSpeedMultiplier = 0;
	// disable default target object behavior


	// internals
	this.maxSpeed = 100;
	this.acceleration = 0.6;
	this.tmpQuaternion = new THREE.Quaternion();

	this.mouseStatus = 0;

	this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0, freeze: 0};
	this.moveVector = new THREE.Vector3( 0, 0, 0 );
	this.rotationVector = new THREE.Vector3( 0, 0, 0 );



	var movementKeyCodes = [87,83,65,68,82,70,38,40]

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	this.keydown = function( event ) {

		if ( event.altKey ) {
			return
		}

 // console.log( event.keyCode);
		// event.preventDefault();

		switch ( event.keyCode ) {
			
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
		if(movementKeyCodes.indexOf(event.keyCode) > -1) {
			this.isMoving = true;
		}
		
		// this.updateMovementVector();
		this.updateRotationVector();

	};

	this.keypress = function(event) {
		// console.log( event.keyCode);
	}

	this.keyup = function( event ) {

		switch ( event.keyCode ) {
			
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
		if(movementKeyCodes.indexOf(event.keyCode) > -1) {
			this.isMoving = false;
		}
		// this.updateMovementVector();
		this.updateRotationVector();

	};

	this.mousedown = function( event ) {
		//if (!document.querySelector('.chatRoom').contains(event.target)) {
	

			// if ( this.domElement !== document ) {

			// 	this.domElement.focus();

			// }

			// event.preventDefault();
			// event.stopPropagation();

			if ( this.dragToLook ) {

				this.mouseStatus ++;

			} else {

				// switch ( event.button ) {

				// 	case 0: this.moveState.forward = 1; break;
				// 	case 2: this.moveState.back = 1; break;

				// }
			
				this.updateMovementVector();

			}
		//}
	};

	this.setViewMode = function(mode) {
		this.viewMode = mode;
	};

	this.mousemove = function( event ) {

		if ( (!this.dragToLook || this.mouseStatus > 0 )) {

			var container = this.getContainerDimensions();
			var halfWidth  = container.size[ 0 ] / 2;
			var halfHeight = container.size[ 1 ] / 2;

			this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
			this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

			this.updateRotationVector();
		}

	};

	this.mouseup = function( event ) {
		//if (!document.querySelector('.chatRoom').contains(event.target)) {
			// event.preventDefault();
			// event.stopPropagation();

			if ( this.dragToLook ) {

				this.mouseStatus --;

				this.moveState.yawLeft = this.moveState.pitchDown = 0;

			} else {

				// switch ( event.button ) {

				// 	case 0: this.moveState.forward = 0; break;
				// 	case 2: this.moveState.back = 0; break;

				// }

				this.updateMovementVector();

			}

			this.updateRotationVector();
		//}

	};

	this.mousewheel = function() {

	};

	this.update = function( delta ) {
		if (this.isMoving){
			this.updateMovementVector();
		}

		if(this.moveState.forward) {
			this.movementSpeedMultiplier += this.movementSpeedMultiplier < this.maxSpeed ? this.acceleration : 0;
		}
		if(this.moveState.back) {
			this.movementSpeedMultiplier -= this.movementSpeedMultiplier > -this.maxSpeed ? this.acceleration : 0;
		}

		if(!this.moveState.forward  && !this.moveState.back) {
			if(!this.moveState.freeze) {
				if(this.movementSpeedMultiplier > 0) {
					this.movementSpeedMultiplier -= this.movementSpeedMultiplier > 0 ? (this.acceleration / 3) : 0;
				} else {
					this.movementSpeedMultiplier += this.movementSpeedMultiplier < 0 ? (this.acceleration / 3) : 0;
				}
			}
		}

		this.movementSpeedMultiplier = Math.round(this.movementSpeedMultiplier * 100) / 100;


		var moveMult = Math.round(delta /** this.movementSpeed*/ + Math.abs(this.movementSpeedMultiplier));
		var rotMult = delta * this.rollSpeed;


		// console.log(moveMult, this.moveVector.z);	
		this.object.translateX( this.moveVector.x * moveMult );
		this.object.translateY( this.moveVector.y * moveMult );
		this.object.translateZ( this.moveVector.z * moveMult );

		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
	
		// if(!this.moveState.freeze) {
		this.object.quaternion.multiply(this.tmpQuaternion );

		// expose the rotation vector for convenience
		this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );

		// this.cameraUpdate();

		//smooth stop
		if(this.viewMode === 1 || this.disabled) {
			this.moveState.yawLeft = Math.abs(this.moveState.yawLeft) > 0.0005  ? this.moveState.yawLeft/1.04 : 0
			this.moveState.pitchDown  = Math.abs(this.moveState.pitchDown) > 0.0005 ? this.moveState.pitchDown /1.04 : 0

			this.updateRotationVector();
		}
		
		return moveMult;
	};

	this.cameraUpdate = function () {
		camera.position.z = this.cameraInitPosition.z+ (this.movementSpeedMultiplier >= 0  ? this.movementSpeedMultiplier / 3 : 0);
	}

	this.updateMovementVector = function() {

		// var forward = (this.moveState.forward && !this.moveState.back) ? 1 : 0;
		// forward = (!this.moveState.forward && this.moveState.back) ? -1 : 0;

			var forward = this.movementSpeedMultiplier >= 1 ? 1 : -1;


			// console.log(this.movementSpeedMultiplier);
			//( this.moveState.forward || ( /*this.autoForward */ false && !this.moveState.back ) ) ? 1 : 0;

			this.moveVector.x = ( -this.moveState.left    + this.moveState.right );
			this.moveVector.y = ( -this.moveState.down    + this.moveState.up );
			this.moveVector.z = ( -forward /*+ this.moveState.back */);

			// this.direction = !this.direction;

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.updateRotationVector = function() {

		this.rotationVector.x = ( -this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( -this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( -this.moveState.rollRight + this.moveState.rollLeft );

		//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

	};

	this.getContainerDimensions = function() {

		// if ( this.domElement != document ) {

		// 	return {
		// 		size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
		// 		offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
		// 	};

		// } else {

			return {
				// size	: [ container.innerWidth, container.innerHeight ],
				size: [container.width, container.height],
				offset	: [ 0, 0 ]
			};

		// }

	};

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	// this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
	// this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
	// this.domElement.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );

	// container.addEventListener( 'keydown', bind( this, this.keydown ), false );
	// container.addEventListener( 'keyup',   bind( this, this.keyup ), false );
	// container.addEventListener( 'keypress',   bind( this, this.keypress ), false );

	this.updateMovementVector();
	this.updateRotationVector();


	this.reset = function() {
		this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
	}


	// container.addEventListener('visibilitychange', ()=> {
	// 	this.reset();
	// }, false);
};
