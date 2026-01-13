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
 * @file Support for rendering line annotations.
 */
import { AnnotationType } from './index';
import { AnnotationRenderHelper, registerAnnotationTypeRenderHandler } from './type_handler';
import { tile2dArray } from '../util/array';
import { projectPointToLineSegment, vec3 } from '../util/geom';
import { getMemoizedBuffer } from '../webgl/buffer';
import { CircleShader, VERTICES_PER_CIRCLE } from '../webgl/circles';
import { LineShader } from '../webgl/lines';
import { emitterDependentShaderGetter } from '../webgl/shader';
var FULL_OBJECT_PICK_OFFSET = 0;
var ENDPOINTS_PICK_OFFSET = FULL_OBJECT_PICK_OFFSET + 1;
var PICK_IDS_PER_INSTANCE = ENDPOINTS_PICK_OFFSET + 2;
function getEndpointIndexArray() {
    return tile2dArray(new Uint8Array([0, 1]), /*majorDimension=*/1, /*minorTiles=*/1,
    /*majorTiles=*/VERTICES_PER_CIRCLE);
}

var RenderHelper = function (_AnnotationRenderHelp) {
    _inherits(RenderHelper, _AnnotationRenderHelp);

    function RenderHelper() {
        _classCallCheck(this, RenderHelper);

        var _this = _possibleConstructorReturn(this, (RenderHelper.__proto__ || _Object$getPrototypeOf(RenderHelper)).apply(this, arguments));

        _this.lineShader = _this.registerDisposer(new LineShader(_this.gl, 1));
        _this.circleShader = _this.registerDisposer(new CircleShader(_this.gl, 2));
        _this.edgeShaderGetter = emitterDependentShaderGetter(_this, _this.gl, function (builder) {
            _this.defineShader(builder);
            _this.lineShader.defineShader(builder);
            builder.setVertexMain('\nemitLine(uProjection, aEndpointA, aEndpointB);\n' + _this.setPartIndex(builder) + ';\n');
            builder.setFragmentMain('\nemitAnnotation(vec4(vColor.rgb, vColor.a * getLineAlpha() * ' + _this.getCrossSectionFadeFactor() + '));\n');
        });
        _this.endpointIndexBuffer = _this.registerDisposer(getMemoizedBuffer(_this.gl, WebGL2RenderingContext.ARRAY_BUFFER, getEndpointIndexArray)).value;
        _this.endpointShaderGetter = emitterDependentShaderGetter(_this, _this.gl, function (builder) {
            _this.defineShader(builder);
            _this.circleShader.defineShader(builder, _this.targetIsSliceView);
            builder.addAttribute('highp uint', 'aEndpointIndex');
            builder.setVertexMain('\nvec3 vertexPosition = mix(aEndpointA, aEndpointB, float(aEndpointIndex));\nemitCircle(uProjection * vec4(vertexPosition, 1.0));\n' + _this.setPartIndex(builder, 'aEndpointIndex + 1u') + ';\n');
            builder.setFragmentMain('\nvec4 borderColor = vec4(0.0, 0.0, 0.0, 1.0);\nemitAnnotation(getCircleColor(vColor, borderColor));\n');
        });
        return _this;
    }

    _createClass(RenderHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'defineShader', this).call(this, builder);
            // Position of endpoints in camera coordinates.
            builder.addAttribute('highp vec3', 'aEndpointA');
            builder.addAttribute('highp vec3', 'aEndpointB');
        }
    }, {
        key: 'enable',
        value: function enable(shader, context, callback) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'enable', this).call(this, shader, context, function () {
                var gl = shader.gl;

                var aLower = shader.attribute('aEndpointA');
                var aUpper = shader.attribute('aEndpointB');
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
    }, {
        key: 'drawEdges',
        value: function drawEdges(context) {
            var _this2 = this;

            var shader = this.edgeShaderGetter(context.renderContext.emitter);
            this.enable(shader, context, function () {
                _this2.lineShader.draw(shader, context.renderContext, /*lineWidth=*/1, 1.0, context.count);
            });
        }
    }, {
        key: 'drawEndpoints',
        value: function drawEndpoints(context) {
            var _this3 = this;

            var shader = this.endpointShaderGetter(context.renderContext.emitter);
            this.enable(shader, context, function () {
                var aEndpointIndex = shader.attribute('aEndpointIndex');
                _this3.endpointIndexBuffer.bindToVertexAttribI(aEndpointIndex, /*components=*/1,
                /*attributeType=*/WebGL2RenderingContext.UNSIGNED_BYTE);
                _this3.circleShader.draw(shader, context.renderContext, { interiorRadiusInPixels: 6, borderWidthInPixels: 2, featherWidthInPixels: 1 }, context.count);
                shader.gl.disableVertexAttribArray(aEndpointIndex);
            });
        }
    }, {
        key: 'draw',
        value: function draw(context) {
            this.drawEdges(context);
            this.drawEndpoints(context);
        }
    }]);

    return RenderHelper;
}(AnnotationRenderHelper);

function snapPositionToLine(position, objectToData, endpoints) {
    var cornerA = vec3.transformMat4(vec3.create(), endpoints.subarray(0, 3), objectToData);
    var cornerB = vec3.transformMat4(vec3.create(), endpoints.subarray(3, 6), objectToData);
    projectPointToLineSegment(position, cornerA, cornerB, position);
}
function snapPositionToEndpoint(position, objectToData, endpoints, endpointIndex) {
    var startOffset = 3 * endpointIndex;
    var point = endpoints.subarray(startOffset, startOffset + 3);
    vec3.transformMat4(position, point, objectToData);
}
registerAnnotationTypeRenderHandler(AnnotationType.LINE, {
    bytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var pointA = annotation.pointA,
                pointB = annotation.pointB;

            var coordinateOffset = index * 6;
            coordinates[coordinateOffset] = pointA[0];
            coordinates[coordinateOffset + 1] = pointA[1];
            coordinates[coordinateOffset + 2] = pointA[2];
            coordinates[coordinateOffset + 3] = pointB[0];
            coordinates[coordinateOffset + 4] = pointB[1];
            coordinates[coordinateOffset + 5] = pointB[2];
        };
    },
    sliceViewRenderHelper: RenderHelper,
    perspectiveViewRenderHelper: RenderHelper,
    pickIdsPerInstance: PICK_IDS_PER_INSTANCE,
    snapPosition: function snapPosition(position, objectToData, data, offset, partIndex) {
        var endpoints = new Float32Array(data, offset, 6);
        if (partIndex === FULL_OBJECT_PICK_OFFSET) {
            snapPositionToLine(position, objectToData, endpoints);
        } else {
            snapPositionToEndpoint(position, objectToData, endpoints, partIndex - ENDPOINTS_PICK_OFFSET);
        }
    },
    getRepresentativePoint: function getRepresentativePoint(objectToData, ann, partIndex) {
        var repPoint = vec3.create();
        // if the full object is selected just pick the first point as representative
        if (partIndex === FULL_OBJECT_PICK_OFFSET) {
            vec3.transformMat4(repPoint, ann.pointA, objectToData);
        } else {
            if (partIndex - ENDPOINTS_PICK_OFFSET === 0) {
                vec3.transformMat4(repPoint, ann.pointA, objectToData);
            } else {
                vec3.transformMat4(repPoint, ann.pointB, objectToData);
            }
        }
        return repPoint;
    },
    updateViaRepresentativePoint: function updateViaRepresentativePoint(oldAnnotation, position, dataToObject, partIndex) {
        var newPt = vec3.transformMat4(vec3.create(), position, dataToObject);
        var baseLine = _Object$assign({}, oldAnnotation);
        switch (partIndex) {
            case FULL_OBJECT_PICK_OFFSET:
                var delta = vec3.sub(vec3.create(), oldAnnotation.pointB, oldAnnotation.pointA);
                baseLine.pointA = newPt;
                baseLine.pointB = vec3.add(vec3.create(), newPt, delta);
                break;
            case FULL_OBJECT_PICK_OFFSET + 1:
                baseLine.pointA = newPt;
                baseLine.pointB = oldAnnotation.pointB;
                break;
            case FULL_OBJECT_PICK_OFFSET + 2:
                baseLine.pointA = oldAnnotation.pointA;
                baseLine.pointB = newPt;
        }
        return baseLine;
    }
});
//# sourceMappingURL=line.js.map