import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @file Support for rendering bounding box annotations.
 */
import { AnnotationType } from './index';
import { AnnotationRenderHelper, registerAnnotationTypeRenderHandler } from './type_handler';
import { BoundingBoxCrossSectionRenderHelper, vertexBasePositions } from '../sliceview/bounding_box_shader_helper';
import { tile2dArray } from '../util/array';
import { projectPointToLineSegment, vec3 } from '../util/geom';
import { Buffer, getMemoizedBuffer } from '../webgl/buffer';
import { CircleShader, VERTICES_PER_CIRCLE } from '../webgl/circles';
import { LineShader, VERTICES_PER_LINE } from '../webgl/lines';
import { emitterDependentShaderGetter } from '../webgl/shader';
var EDGES_PER_BOX = 12;
var CORNERS_PER_BOX = 8;
var FULL_OBJECT_PICK_OFFSET = 0;
var CORNERS_PICK_OFFSET = FULL_OBJECT_PICK_OFFSET + 1;
var EDGES_PICK_OFFSET = CORNERS_PICK_OFFSET + CORNERS_PER_BOX;
var FACES_PICK_OFFSET = EDGES_PICK_OFFSET + EDGES_PER_BOX;
var PICK_IDS_PER_INSTANCE = FACES_PICK_OFFSET + 6;
var edgeBoxCornerOffsetData = Float32Array.from([
// a1
0, 0, 0,
// b1
0, 0, 1,
// c1
EDGES_PICK_OFFSET + 0,
// a2
1, 0, 0,
// b2
1, 0, 1,
// c2
EDGES_PICK_OFFSET + 1,
// a3
0, 1, 0,
// b3
0, 1, 1,
// c3
EDGES_PICK_OFFSET + 2,
// a4
1, 1, 0,
// b4
1, 1, 1,
// c4
EDGES_PICK_OFFSET + 3,
// a5
0, 0, 0,
// b5
0, 1, 0,
// c5
EDGES_PICK_OFFSET + 4,
// a6
0, 0, 1,
// b6
0, 1, 1,
// c6
EDGES_PICK_OFFSET + 5,
// a7
1, 0, 0,
// b7
1, 1, 0,
// c7
EDGES_PICK_OFFSET + 6,
// a8
1, 0, 1,
// b8
1, 1, 1,
// c8
EDGES_PICK_OFFSET + 7,
// a9
0, 0, 0,
// b9
1, 0, 0,
// c9
EDGES_PICK_OFFSET + 8,
// a10
0, 0, 1,
// b10
1, 0, 1,
// c10
EDGES_PICK_OFFSET + 9,
// a11
0, 1, 0,
// b11
1, 1, 0,
// c11
EDGES_PICK_OFFSET + 10,
// a12
0, 1, 1,
// b12
1, 1, 1,
// c12
EDGES_PICK_OFFSET + 11]);

var RenderHelper = function (_AnnotationRenderHelp) {
    _inherits(RenderHelper, _AnnotationRenderHelp);

    function RenderHelper() {
        _classCallCheck(this, RenderHelper);

        return _possibleConstructorReturn(this, (RenderHelper.__proto__ || _Object$getPrototypeOf(RenderHelper)).apply(this, arguments));
    }

    _createClass(RenderHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'defineShader', this).call(this, builder);
            // Position of point in camera coordinates.
            builder.addAttribute('highp vec3', 'aLower');
            builder.addAttribute('highp vec3', 'aUpper');
        }
    }, {
        key: 'enable',
        value: function enable(shader, context, callback) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'enable', this).call(this, shader, context, function () {
                var gl = shader.gl;

                var aLower = shader.attribute('aLower');
                var aUpper = shader.attribute('aUpper');
                context.buffer.bindToVertexAttrib(aLower, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 6, /*offset=*/context.bufferOffset);
                context.buffer.bindToVertexAttrib(aUpper, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 6, /*offset=*/context.bufferOffset + 4 * 3);
                gl.vertexAttribDivisor(aLower, 1);
                gl.vertexAttribDivisor(aUpper, 1);
                callback();
                gl.vertexAttribDivisor(aLower, 0);
                gl.vertexAttribDivisor(aUpper, 0);
                gl.disableVertexAttribArray(aLower);
                gl.disableVertexAttribArray(aUpper);
            });
        }
    }]);

    return RenderHelper;
}(AnnotationRenderHelper);

var PerspectiveViewRenderHelper = function (_RenderHelper) {
    _inherits(PerspectiveViewRenderHelper, _RenderHelper);

    function PerspectiveViewRenderHelper() {
        _classCallCheck(this, PerspectiveViewRenderHelper);

        var _this2 = _possibleConstructorReturn(this, (PerspectiveViewRenderHelper.__proto__ || _Object$getPrototypeOf(PerspectiveViewRenderHelper)).apply(this, arguments));

        _this2.lineShader = _this2.registerDisposer(new LineShader(_this2.gl, EDGES_PER_BOX));
        _this2.edgeBoxCornerOffsetsBuffer = _this2.registerDisposer(Buffer.fromData(_this2.gl, tile2dArray(edgeBoxCornerOffsetData, /*majorDimension=*/7, /*minorTiles=*/1,
        /*majorTiles=*/VERTICES_PER_LINE)));
        _this2.edgeShaderGetter = emitterDependentShaderGetter(_this2, _this2.gl, function (builder) {
            _this2.defineShader(builder);
            _this2.lineShader.defineShader(builder);
            // XYZ corners of box ranging from [0, 0, 0] to [1, 1, 1].
            builder.addAttribute('highp vec3', 'aBoxCornerOffset1');
            // Last component of aBoxCornerOffset2 is the edge index.
            builder.addAttribute('highp vec4', 'aBoxCornerOffset2');
            builder.setVertexMain('\nvec3 vertexPosition1 = mix(aLower, aUpper, aBoxCornerOffset1);\nvec3 vertexPosition2 = mix(aLower, aUpper, aBoxCornerOffset2.xyz);\nemitLine(uProjection, vertexPosition1, vertexPosition2);\n' + _this2.setPartIndex(builder, 'uint(aBoxCornerOffset2.w)') + ';\n');
            builder.setFragmentMain('\nemitAnnotation(vec4(vColor.rgb, getLineAlpha()));\n');
        });
        _this2.circleShader = _this2.registerDisposer(new CircleShader(_this2.gl, CORNERS_PER_BOX));
        _this2.boxCornerOffsetsBuffer = _this2.registerDisposer(Buffer.fromData(_this2.gl, tile2dArray(vertexBasePositions, /*majorDimension=*/3, /*minorTiles=*/1,
        /*majorTiles=*/VERTICES_PER_CIRCLE)));
        _this2.cornerShaderGetter = emitterDependentShaderGetter(_this2, _this2.gl, function (builder) {
            _this2.defineShader(builder);
            _this2.circleShader.defineShader(builder, _this2.targetIsSliceView);
            // XYZ corners of box ranging from [0, 0, 0] to [1, 1, 1].
            builder.addAttribute('highp vec3', 'aBoxCornerOffset');
            builder.setVertexMain('\nvec3 vertexPosition = mix(aLower, aUpper, aBoxCornerOffset);\nemitCircle(uProjection * vec4(vertexPosition, 1.0));\nuint cornerIndex = uint(aBoxCornerOffset.x + aBoxCornerOffset.y * 2.0 + aBoxCornerOffset.z * 4.0);\nuint cornerPickOffset = ' + CORNERS_PICK_OFFSET + 'u + cornerIndex;\n' + _this2.setPartIndex(builder, 'cornerPickOffset') + ';\n');
            builder.setFragmentMain('\nvec4 borderColor = vec4(0.0, 0.0, 0.0, 1.0);\nemitAnnotation(getCircleColor(vColor, borderColor));\n');
        });
        return _this2;
    }

    _createClass(PerspectiveViewRenderHelper, [{
        key: 'drawEdges',
        value: function drawEdges(context) {
            var _this3 = this;

            var shader = this.edgeShaderGetter(context.renderContext.emitter);
            var gl = this.gl;

            this.enable(shader, context, function () {
                var aBoxCornerOffset1 = shader.attribute('aBoxCornerOffset1');
                var aBoxCornerOffset2 = shader.attribute('aBoxCornerOffset2');
                _this3.edgeBoxCornerOffsetsBuffer.bindToVertexAttrib(aBoxCornerOffset1, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 7, /*offset=*/0);
                _this3.edgeBoxCornerOffsetsBuffer.bindToVertexAttrib(aBoxCornerOffset2, /*components=*/4, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 7, /*offset=*/4 * 3);
                _this3.lineShader.draw(shader, context.renderContext, /*lineWidth=*/1, 1, context.count);
                gl.disableVertexAttribArray(aBoxCornerOffset1);
                gl.disableVertexAttribArray(aBoxCornerOffset2);
            });
        }
    }, {
        key: 'drawCorners',
        value: function drawCorners(context) {
            var _this4 = this;

            var shader = this.cornerShaderGetter(context.renderContext.emitter);
            var gl = this.gl;

            this.enable(shader, context, function () {
                var aBoxCornerOffset = shader.attribute('aBoxCornerOffset');
                _this4.boxCornerOffsetsBuffer.bindToVertexAttrib(aBoxCornerOffset, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false);
                _this4.circleShader.draw(shader, context.renderContext, { interiorRadiusInPixels: 1, borderWidthInPixels: 0, featherWidthInPixels: 1 }, context.count);
                gl.disableVertexAttribArray(aBoxCornerOffset);
            });
        }
    }, {
        key: 'draw',
        value: function draw(context) {
            this.drawEdges(context);
            this.drawCorners(context);
        }
    }]);

    return PerspectiveViewRenderHelper;
}(RenderHelper);

function getBaseIntersectionVertexIndexArray() {
    return new Float32Array([0, 1, 2, 3, 4, 5]);
}
function getIntersectionVertexIndexArray() {
    return tile2dArray(getBaseIntersectionVertexIndexArray(),
    /*majorDimension=*/1,
    /*minorTiles=*/1,
    /*majorTiles=*/VERTICES_PER_LINE);
}

var SliceViewRenderHelper = function (_RenderHelper2) {
    _inherits(SliceViewRenderHelper, _RenderHelper2);

    function SliceViewRenderHelper(gl) {
        _classCallCheck(this, SliceViewRenderHelper);

        var _this5 = _possibleConstructorReturn(this, (SliceViewRenderHelper.__proto__ || _Object$getPrototypeOf(SliceViewRenderHelper)).call(this, gl));

        _this5.gl = gl;
        _this5.lineShader = new LineShader(_this5.gl, 6);
        _this5.intersectionVertexIndexBuffer = getMemoizedBuffer(_this5.gl, WebGL2RenderingContext.ARRAY_BUFFER, getIntersectionVertexIndexArray).value;
        _this5.filledIntersectionVertexIndexBuffer = getMemoizedBuffer(_this5.gl, WebGL2RenderingContext.ARRAY_BUFFER, getBaseIntersectionVertexIndexArray).value;
        _this5.boundingBoxCrossSectionHelper = _this5.registerDisposer(new BoundingBoxCrossSectionRenderHelper(_this5.gl));
        _this5.faceShaderGetter = emitterDependentShaderGetter(_this5, _this5.gl, function (builder) {
            _get(SliceViewRenderHelper.prototype.__proto__ || _Object$getPrototypeOf(SliceViewRenderHelper.prototype), 'defineShader', _this5).call(_this5, builder);
            _this5.boundingBoxCrossSectionHelper.defineShader(builder);
            _this5.lineShader.defineShader(builder);
            builder.addAttribute('highp float', 'aVertexIndexFloat');
            builder.setVertexMain('\nint vertexIndex1 = int(aVertexIndexFloat);\nint vertexIndex2 = vertexIndex1 == 5 ? 0 : vertexIndex1 + 1;\nvec3 vertexPosition1 = getBoundingBoxPlaneIntersectionVertexPosition(aUpper - aLower, aLower, aLower, aUpper, vertexIndex1);\nvec3 vertexPosition2 = getBoundingBoxPlaneIntersectionVertexPosition(aUpper - aLower, aLower, aLower, aUpper, vertexIndex2);\nemitLine(uProjection, vertexPosition1, vertexPosition2);\n' + _this5.setPartIndex(builder) + ';\n');
            builder.setFragmentMain('\nemitAnnotation(vec4(vColor.rgb, vColor.a * getLineAlpha()));\n');
        });
        _this5.fillShaderGetter = emitterDependentShaderGetter(_this5, _this5.gl, function (builder) {
            _get(SliceViewRenderHelper.prototype.__proto__ || _Object$getPrototypeOf(SliceViewRenderHelper.prototype), 'defineShader', _this5).call(_this5, builder);
            _this5.boundingBoxCrossSectionHelper.defineShader(builder);
            builder.addAttribute('highp float', 'aVertexIndexFloat');
            builder.addUniform('highp float', 'uFillOpacity');
            builder.setVertexMain('\nint vertexIndex = int(aVertexIndexFloat);\nvec3 vertexPosition = getBoundingBoxPlaneIntersectionVertexPosition(aUpper - aLower, aLower, aLower, aUpper, vertexIndex);\ngl_Position = uProjection * vec4(vertexPosition, 1);\n' + _this5.setPartIndex(builder) + ';\n');
            builder.setFragmentMain('\nemitAnnotation(vec4(vColor.rgb, uFillOpacity));\n');
        });
        return _this5;
    }

    _createClass(SliceViewRenderHelper, [{
        key: 'draw',
        value: function draw(context) {
            var _this6 = this;

            var fillOpacity = context.annotationLayer.state.fillOpacity.value;
            var shader = (fillOpacity ? this.fillShaderGetter : this.faceShaderGetter)(context.renderContext.emitter);
            var gl = this.gl;

            this.enable(shader, context, function () {
                _this6.boundingBoxCrossSectionHelper.setViewportPlane(shader, context.renderContext.sliceView.viewportAxes[2], context.renderContext.sliceView.centerDataPosition, context.annotationLayer.state.globalToObject);
                var aVertexIndexFloat = shader.attribute('aVertexIndexFloat');
                (fillOpacity ? _this6.filledIntersectionVertexIndexBuffer : _this6.intersectionVertexIndexBuffer).bindToVertexAttrib(aVertexIndexFloat, /*components=*/1, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false);
                if (fillOpacity) {
                    gl.uniform1f(shader.uniform('uFillOpacity'), fillOpacity);
                    gl.drawArraysInstanced(WebGL2RenderingContext.TRIANGLE_FAN, 0, 6, context.count);
                } else {
                    var lineWidth = context.renderContext.emitColor ? 1 : 5;
                    _this6.lineShader.draw(shader, context.renderContext, lineWidth, 1.0, context.count);
                }
                gl.disableVertexAttribArray(aVertexIndexFloat);
            });
        }
    }]);

    return SliceViewRenderHelper;
}(RenderHelper);

function getEdgeCorners(corners, edgeIndex) {
    var i = edgeIndex * 7;
    var cA = vec3.create(),
        cB = vec3.create();
    for (var j = 0; j < 3; ++j) {
        var ma = edgeBoxCornerOffsetData[i + j];
        var mb = edgeBoxCornerOffsetData[i + j + 3];
        var a = Math.min(corners[j], corners[j + 3]),
            b = Math.max(corners[j], corners[j + 3]);
        cA[j] = (1 - ma) * a + ma * b;
        cB[j] = (1 - mb) * a + mb * b;
    }
    return { cornerA: cA, cornerB: cB };
}
function snapPositionToEdge(position, objectToData, corners, edgeIndex) {
    var edgeCorners = getEdgeCorners(corners, edgeIndex);
    vec3.transformMat4(edgeCorners.cornerA, edgeCorners.cornerA, objectToData);
    vec3.transformMat4(edgeCorners.cornerB, edgeCorners.cornerB, objectToData);
    projectPointToLineSegment(position, edgeCorners.cornerA, edgeCorners.cornerB, position);
}
function snapPositionToCorner(position, objectToData, corners, cornerIndex) {
    var i = cornerIndex * 3;
    for (var j = 0; j < 3; ++j) {
        var m = vertexBasePositions[i + j];
        var a = Math.min(corners[j], corners[j + 3]),
            b = Math.max(corners[j], corners[j + 3]);
        position[j] = (1 - m) * a + m * b;
    }
    vec3.transformMat4(position, position, objectToData);
}
registerAnnotationTypeRenderHandler(AnnotationType.AXIS_ALIGNED_BOUNDING_BOX, {
    bytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var pointA = annotation.pointA,
                pointB = annotation.pointB;

            var coordinateOffset = index * 6;
            coordinates[coordinateOffset] = Math.min(pointA[0], pointB[0]);
            coordinates[coordinateOffset + 1] = Math.min(pointA[1], pointB[1]);
            coordinates[coordinateOffset + 2] = Math.min(pointA[2], pointB[2]);
            coordinates[coordinateOffset + 3] = Math.max(pointA[0], pointB[0]);
            coordinates[coordinateOffset + 4] = Math.max(pointA[1], pointB[1]);
            coordinates[coordinateOffset + 5] = Math.max(pointA[2], pointB[2]);
        };
    },
    sliceViewRenderHelper: SliceViewRenderHelper,
    perspectiveViewRenderHelper: PerspectiveViewRenderHelper,
    pickIdsPerInstance: PICK_IDS_PER_INSTANCE,
    snapPosition: function snapPosition(position, objectToData, data, offset, partIndex) {
        var corners = new Float32Array(data, offset, 6);
        if (partIndex >= CORNERS_PICK_OFFSET && partIndex < EDGES_PICK_OFFSET) {
            snapPositionToCorner(position, objectToData, corners, partIndex - CORNERS_PICK_OFFSET);
        } else if (partIndex >= EDGES_PICK_OFFSET && partIndex < FACES_PICK_OFFSET) {
            snapPositionToEdge(position, objectToData, corners, partIndex - EDGES_PICK_OFFSET);
        } else {
            // vec3.transformMat4(position, annotation.point, objectToData);
        }
    },
    getRepresentativePoint: function getRepresentativePoint(objectToData, ann, partIndex) {
        var repPoint = vec3.create();
        // if the full object is selected pick the first corner as representative
        if (partIndex === FULL_OBJECT_PICK_OFFSET) {
            vec3.transformMat4(repPoint, ann.pointA, objectToData);
        } else if (partIndex >= CORNERS_PICK_OFFSET && partIndex < EDGES_PICK_OFFSET) {
            // picked a corner
            // FIXME: figure out how to return corner point
            vec3.transformMat4(repPoint, ann.pointA, objectToData);
        } else if (partIndex >= EDGES_PICK_OFFSET && partIndex < FACES_PICK_OFFSET) {
            // FIXME: can't figure out how to resize based upon edge grabbed
            vec3.transformMat4(repPoint, ann.pointA, objectToData);
            // snapPositionToCorner(repPoint, objectToData, corners, 5);
        } else {
            // for now faces will move the whole object so pick the first corner
            vec3.transformMat4(repPoint, ann.pointA, objectToData);
        }
        return repPoint;
    },
    updateViaRepresentativePoint: function updateViaRepresentativePoint(oldAnnotation, position, dataToObject, partIndex) {
        var newPt = vec3.transformMat4(vec3.create(), position, dataToObject);
        var baseBox = _Object$assign({}, oldAnnotation);
        // if the full object is selected pick the first corner as representative
        var delta = vec3.sub(vec3.create(), oldAnnotation.pointB, oldAnnotation.pointA);
        if (partIndex === FULL_OBJECT_PICK_OFFSET) {
            baseBox.pointA = newPt;
            baseBox.pointB = vec3.add(vec3.create(), newPt, delta);
        } else if (partIndex >= CORNERS_PICK_OFFSET && partIndex < EDGES_PICK_OFFSET) {
            // picked a corner
            baseBox.pointA = newPt;
            baseBox.pointB = vec3.add(vec3.create(), newPt, delta);
        } else if (partIndex >= EDGES_PICK_OFFSET && partIndex < FACES_PICK_OFFSET) {
            baseBox.pointA = newPt;
            baseBox.pointB = vec3.add(vec3.create(), newPt, delta);
        } else {
            // for now faces will move the whole object so pick the first corner
            baseBox.pointA = newPt;
            baseBox.pointB = vec3.add(vec3.create(), newPt, delta);
        }
        return baseBox;
    }
});
//# sourceMappingURL=bounding_box.js.map