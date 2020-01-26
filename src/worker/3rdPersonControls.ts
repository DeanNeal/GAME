import * as THREE from "three";

export class ThirdPersonControl {
  public camera;
  public player;
  public center;
  public startDragX = null;
  public startDragY = null;
  readonly minZoom = 800;
  readonly maxZoom = 3000;

  constructor(camera, player) {
    this.camera = camera;
    this.player = player;
    this.center = new THREE.Vector3();
    this.camera.position.set(
      this.player.position.x - this.minZoom,
      this.player.position.y,
      this.player.position.z
    );

 

  }

  drag(deltaX, deltaY) {
   var radPerPixel = (Math.PI / 450),
         deltaPhi = radPerPixel * deltaX,
         deltaTheta = radPerPixel * deltaY,
         pos = this.camera.position.sub(this.center),
         radius = pos.length(),
         theta = Math.acos(pos.z / radius),
         phi = Math.atan2(pos.y, pos.x);

      // Subtract deltaTheta and deltaPhi
      theta = Math.min(Math.max(theta - deltaTheta, 0), Math.PI);
      phi -= deltaPhi;

      // Turn back into Cartesian coordinates
      pos.x = radius * Math.sin(theta) * Math.cos(phi);
      pos.y = radius * Math.sin(theta) * Math.sin(phi);
      pos.z = radius * Math.cos(theta);
      
      // this.camera.rotation.set(this.player.rotation.clone());

      // this.camera.quaternion.copy(this.player.quaternion);

      this.camera.position.add(this.center);
  }

  mousedown(e) {
    this.startDragX = e.clientX;
    this.startDragY = e.clientY;
  }

  mousemove(e) {
    if (this.startDragX === null || this.startDragY === null) return;

    if (this.drag)
      this.drag(e.clientX - this.startDragX, e.clientY - this.startDragY);

    this.startDragX = e.clientX;
    this.startDragY = e.clientY;
  }

  mouseup(e) {
    this.mousemove.call(this, e);
    this.startDragX = null;
    this.startDragY = null;
  }

  keydown() {}

  keyup() {}

  keypress() {}

  update() {
    this.center = this.player.position.clone();

    this.camera.rotation.setFromQuaternion(
      this.player.quaternion,
      this.player.rotation.order
    );
    this.camera.quaternion.copy(this.player.quaternion);

    this.camera.lookAt(this.center);

    return {
      moveMult: 10
    };
  }

  zoomIn() {
    // console.log(this.camera.position.x);
    if (this.camera.position.distanceTo(this.player.position) < this.minZoom)
      return;
    this.camera.position
      .sub(this.center)
      .multiplyScalar(0.9)
      .add(this.center);
  }

  zoomOut() {
    // console.log(this.camera.position.x);
    // if(this.camera.position.x < -2000) return;
    if (this.camera.position.distanceTo(this.player.position) > this.maxZoom)
      return;
    this.camera.position
      .sub(this.center)
      .multiplyScalar(1.1)
      .add(this.center);
  }
}
