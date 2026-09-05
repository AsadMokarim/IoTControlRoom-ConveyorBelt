const THREE = require('three');
const endCurveRadius = 0.235;
const rightCurveGeo = new THREE.CylinderGeometry(endCurveRadius, endCurveRadius, 2.0, 32, 1, false, 0, Math.PI);
console.log(rightCurveGeo.attributes.uv !== undefined);
