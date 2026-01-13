export function setDisplayCode(builder, inputVar) {
    var s = '\nvoid setDisplayCode(int displayCode) {\n  if (displayCode > 0) {\n    if (displayCode == 1) {\n      vColor.rgb = mix(vColor.rgb, vec3(1.0, 0.0, 0.0), 0.7);\n    } else if (displayCode == 2) {\n      vColor.rgb = mix(vColor.rgb, vec3(0.0, 0.0, 1.0), 0.7);\n    }\n  }\n}\n';
    builder.addVertexCode(s);
    return 'setDisplayCode(' + inputVar + ')';
}
export var numPointAnnotationElements = 4;
export function PointAnnotationSerilizer(buffer, offset, numAnnotations) {
    var coordinates = new Float32Array(buffer, offset, numAnnotations * numPointAnnotationElements);
    return function (annotation, index) {
        var point = annotation.point;

        var coordinateOffset = index * numPointAnnotationElements;
        coordinates[coordinateOffset] = point[0];
        coordinates[coordinateOffset + 1] = point[1];
        coordinates[coordinateOffset + 2] = point[2];
        coordinates[coordinateOffset + 3] = 0; //place holder for property code
        if (annotation.property) {
            if (annotation.property.displayCode) {
                coordinates[coordinateOffset + 3] = annotation.property.displayCode;
            }
        }
    };
}
export function getViewer() {
    return window['viewer'];
}
export function getTopLayerSpecification() {
    return getViewer().layerSpecification;
}
export function getLayer(name) {
    return getTopLayerSpecification().layerManager.managedLayers.find(function (layer) {
        return layer.name === name;
    });
}
//# sourceMappingURL=utils.js.map