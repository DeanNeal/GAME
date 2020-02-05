import * as THREE from 'three'

export function attachGUI(player, assets) {

    const group = new THREE.Group();
    group.name = 'GUI';

    const group1 = new THREE.Group();
    const hp = createIndicator('hp', 0x3c78ff);
    group1.name = 'HP_GROUP';
    group1.position.set(-240, -100, -400);
    group1.add(hp);
    group1.add(wireFrame(hp.clone()));
    group1.add(createLabel(assets, 'HP', 'left'))
    group.add(group1);

    const group2 = new THREE.Group();
    const zone = createIndicator('zone', 0xf52a15);
    group2.name = 'ZONE_GROUP';
    group2.position.set(240, -100, -400);
    group2.add(zone)
    group2.add(wireFrame(zone.clone()))
    group2.add(createLabel(assets, 'ZONE', 'right'))
    group.add(group2);


    //TODO speed

    player.add(group);
}

function createIndicator(name, color, size = [50, 5, 4]) {
    let material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
    })

    const geometry = new THREE.BoxGeometry(...size);
    const hp = new THREE.Mesh(geometry, material);
    hp.name = name;

    return hp;
}

function wireFrame(object) {
    // wireframe
    var geo = new THREE.EdgesGeometry(object.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 0, opacity: 0.5, transparent: true });
    var wireframe = new THREE.LineSegments(geo, mat);
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd

    return wireframe;
}

function createLabel(assets, name, dir, size = 4, color = 0xffffff) {
    const font = assets.helvetiker_font;

    const textGeo = new THREE.TextGeometry(name, {
        font: font,
        size: size,
        height: 0.1,
        bevelEnabled: false,
        bevelThickness: 0.1,
        bevelSize: 0.01,
        bevelSegments: 0,
    })

    textGeo.computeBoundingBox();
    textGeo.center();

    let material = new THREE.MeshPhongMaterial({ emissive: color })

    const text = new THREE.Mesh(textGeo, material)
    text.position.y = 6.5;

    if (dir === 'left') text.position.x = -50 / 2 + (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2;
    if (dir === 'right') text.position.x = 50 / 2 - (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x) / 2;


    return text;
}

export function scaleXLeft(mesh, scale) {
    mesh.scale.x = scale;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const width = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;

    mesh.position.x = -(width - width * scale) / 2;
}

export function scaleXRight(mesh, scale) {
    mesh.scale.x = scale;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const width = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;

    mesh.position.x = (width - width * scale) / 2;
}
