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
 * @file Support for rendering ellipsoid annotations.
 */
import { AnnotationType } from './index';
import { AnnotationRenderHelper, registerAnnotationTypeRenderHandler } from './type_handler';
import { mat3, mat4, vec3 } from '../util/geom';
import { computeCenterOrientEllipseDebug, computeCrossSectionEllipseDebug, glsl_computeCenterOrientEllipse, glsl_computeCrossSectionEllipse } from '../webgl/ellipse';
import { QuadRenderHelper } from '../webgl/quad';
import { emitterDependentShaderGetter } from '../webgl/shader';
import { SphereRenderHelper } from '../webgl/spheres';
import { getSquareCornersBuffer } from '../webgl/square_corners_buffer';
var tempMat4 = mat4.create();
var DEBUG = false;

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
            builder.addAttribute('highp vec3', 'aCenter');
            builder.addAttribute('highp vec3', 'aRadii');
        }
    }, {
        key: 'enable',
        value: function enable(shader, context, callback) {
            _get(RenderHelper.prototype.__proto__ || _Object$getPrototypeOf(RenderHelper.prototype), 'enable', this).call(this, shader, context, function () {
                var aCenter = shader.attribute('aCenter');
                var aRadii = shader.attribute('aRadii');
                var gl = shader.gl;

                context.buffer.bindToVertexAttrib(aCenter, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 6, /*offset=*/context.bufferOffset);
                context.buffer.bindToVertexAttrib(aRadii, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
                /*normalized=*/false,
                /*stride=*/4 * 6, /*offset=*/context.bufferOffset + 4 * 3);
                gl.vertexAttribDivisor(aCenter, 1);
                gl.vertexAttribDivisor(aRadii, 1);
                callback();
                gl.vertexAttribDivisor(aCenter, 0);
                gl.vertexAttribDivisor(aRadii, 0);
                gl.disableVertexAttribArray(aCenter);
                gl.disableVertexAttribArray(aRadii);
            });
        }
    }]);

    return RenderHelper;
}(AnnotationRenderHelper);
/**
 * Render an ellipsoid as a transformed triangulated sphere.
 */


var PerspectiveRenderHelper = function (_RenderHelper) {
    _inherits(PerspectiveRenderHelper, _RenderHelper);

    function PerspectiveRenderHelper() {
        _classCallCheck(this, PerspectiveRenderHelper);

        var _this2 = _possibleConstructorReturn(this, (PerspectiveRenderHelper.__proto__ || _Object$getPrototypeOf(PerspectiveRenderHelper)).apply(this, arguments));

        _this2.sphereRenderHelper = _this2.registerDisposer(new SphereRenderHelper(_this2.gl, 10, 10));
        _this2.shaderGetter = emitterDependentShaderGetter(_this2, _this2.gl, function (builder) {
            _this2.defineShader(builder);
            _this2.sphereRenderHelper.defineShader(builder);
            builder.addUniform('highp vec4', 'uLightDirection');
            builder.addUniform('highp mat4', 'uNormalTransform');
            builder.setVertexMain('\nemitSphere(uProjection, uNormalTransform, aCenter, aRadii, uLightDirection);\n' + _this2.setPartIndex(builder) + ';\n');
            builder.setFragmentMain('\nemitAnnotation(vec4(vColor.rgb * vLightingFactor, vColor.a));\n');
        });
        _this2.tempLightVec = new Float32Array(4);
        return _this2;
    }

    _createClass(PerspectiveRenderHelper, [{
        key: 'draw',
        value: function draw(context) {
            var _this3 = this;

            var shader = this.shaderGetter(context.renderContext.emitter);
            this.enable(shader, context, function () {
                var gl = shader.gl;

                var lightVec = _this3.tempLightVec;
                var _context$renderContex = context.renderContext,
                    lightDirection = _context$renderContex.lightDirection,
                    ambientLighting = _context$renderContex.ambientLighting,
                    directionalLighting = _context$renderContex.directionalLighting;

                vec3.scale(lightVec, lightDirection, directionalLighting);
                lightVec[3] = ambientLighting;
                gl.uniform4fv(shader.uniform('uLightDirection'), lightVec);
                gl.uniformMatrix4fv(shader.uniform('uNormalTransform'), /*transpose=*/false, mat4.transpose(mat4.create(), context.annotationLayer.state.globalToObject));
                _this3.sphereRenderHelper.draw(shader, context.count);
            });
        }
    }]);

    return PerspectiveRenderHelper;
}(RenderHelper);
/**
 * Render a cross section of an ellipsoid.
 *
 * This is done using the following steps:
 *
 * Vertex shader:
 *
 * 1. We transform the ellipsoid parameters to the cross section coordinate frame (with the z
 *    axis corresponding to the plane normal).
 *
 * 2. We then compute the quadratic form parameters of the ellipse corresponding to the intersection
 *    of the ellipsoid with the `z=0` plane.
 *
 * 3. We convert the quadratic form parameterization into the center-orient parameterization.
 *
 * 4. The vertex shader emits the 4 vertices of the bounding box of the ellipse, equal to:
 *
 *      `k +/- a*u1 +/- b*u2`,
 *
 *    where `k` is the center of the ellipse, `u1` and `u2` are the major and minor axis directions
 *    respectively, and `a` and `b` are the semi-major and semi-minor axis lengths, respectively.
 *    These four vertices are used to draw a quad (two triangles).
 *
 * Fragment shader:
 *
 * 5. The fragment shader discards fragments outside the bounds of the ellipse.
 */


var SliceViewRenderHelper = function (_RenderHelper2) {
    _inherits(SliceViewRenderHelper, _RenderHelper2);

    function SliceViewRenderHelper() {
        _classCallCheck(this, SliceViewRenderHelper);

        var _this4 = _possibleConstructorReturn(this, (SliceViewRenderHelper.__proto__ || _Object$getPrototypeOf(SliceViewRenderHelper)).apply(this, arguments));

        _this4.quadRenderHelper = _this4.registerDisposer(new QuadRenderHelper(_this4.gl, 1));
        _this4.squareCornersBuffer = getSquareCornersBuffer(_this4.gl, -1, -1, 1, 1, /*minorTiles=*/1, /*majorTiles=*/1);
        _this4.shaderGetter = emitterDependentShaderGetter(_this4, _this4.gl, function (builder) {
            _this4.defineShader(builder);
            builder.addUniform('highp mat4', 'uViewportToObject');
            builder.addUniform('highp mat4', 'uObjectToViewport');
            builder.addUniform('highp mat4', 'uViewportToDevice');
            builder.addAttribute('highp vec2', 'aCornerOffset');
            builder.addVarying('highp vec2', 'vCircleCoord');
            builder.addVertexCode(glsl_computeCrossSectionEllipse);
            builder.addVertexCode(glsl_computeCenterOrientEllipse);
            builder.setVertexMain('\nmat3 Aobject = mat3(0.0);\nfor (int i = 0; i < 3; ++i) {\n  Aobject[i][i] = 1.0 / (aRadii[i] * aRadii[i]);\n}\nmat3 RviewportToObject = mat3(uViewportToObject);\nmat3 Aviewport = transpose(RviewportToObject) * Aobject * RviewportToObject;\nvec3 cViewport = (uObjectToViewport * vec4(aCenter, 1.0)).xyz;\nEllipseQuadraticForm quadraticForm = computeCrossSectionEllipse(Aviewport, cViewport);\nvec2 u1, u2;\nfloat a, b;\nCenterOrientEllipse centerOrient = computeCenterOrientEllipse(quadraticForm);\nvec2 viewportCorner = centerOrient.k +\n  centerOrient.u1 * aCornerOffset.x * centerOrient.a +\n  centerOrient.u2 * aCornerOffset.y * centerOrient.b;\nif (centerOrient.valid) {\n  gl_Position = uViewportToDevice * vec4(viewportCorner, 0.0, 1.0);\n} else {\n  gl_Position = vec4(1.0, 1.0, 0.0, -100.0);\n}\nvCircleCoord = aCornerOffset;\n' + _this4.setPartIndex(builder) + ';\n');
            builder.setFragmentMain('\nif (dot(vCircleCoord, vCircleCoord) > 1.0) {\n  discard;\n}\nemitAnnotation(vec4(vColor.rgb, 0.5));\n');
        });
        return _this4;
    }

    _createClass(SliceViewRenderHelper, [{
        key: 'draw',
        value: function draw(context) {
            var _this5 = this;

            var shader = this.shaderGetter(context.renderContext.emitter);
            this.enable(shader, context, function () {
                var gl = shader.gl;

                var aCornerOffset = shader.attribute('aCornerOffset');
                _this5.squareCornersBuffer.bindToVertexAttrib(aCornerOffset, /*components=*/2);
                var viewportToObject = mat4.multiply(tempMat4, context.annotationLayer.state.globalToObject, context.renderContext.sliceView.viewportToData);
                gl.uniformMatrix4fv(shader.uniform('uViewportToObject'), /*transpose=*/false, viewportToObject);
                gl.uniformMatrix4fv(shader.uniform('uViewportToDevice'), /*transpose=*/false, context.renderContext.sliceView.viewportToDevice);
                var objectToViewport = tempMat4;
                mat4.invert(objectToViewport, viewportToObject);
                gl.uniformMatrix4fv(shader.uniform('uObjectToViewport'), /*transpose=*/false, objectToViewport);
                _this5.quadRenderHelper.draw(gl, context.count);
                shader.gl.disableVertexAttribArray(aCornerOffset);
                if (DEBUG) {
                    var center = vec3.fromValues(2184, 1700, 3981);
                    var radii = vec3.fromValues(133, 133, 133);
                    var Aobject = mat3.create();
                    Aobject[0] = 1 / (radii[0] * radii[0]);
                    Aobject[4] = 1 / (radii[1] * radii[1]);
                    Aobject[8] = 1 / (radii[2] * radii[2]);
                    var RviewportToObject = mat3.fromMat4(mat3.create(), viewportToObject);
                    var Aviewport = mat3.multiply(mat3.create(), mat3.transpose(mat3.create(), RviewportToObject), Aobject);
                    mat3.multiply(Aviewport, Aviewport, RviewportToObject);
                    var cViewport = vec3.transformMat4(vec3.create(), center, objectToViewport);
                    console.log('Aviewport', Aviewport);
                    console.log('cViewport', cViewport);
                    var p = computeCrossSectionEllipseDebug(Aviewport, cViewport);
                    var centerOrient = computeCenterOrientEllipseDebug(p);
                    console.log(p);
                    console.log(centerOrient);
                }
            });
        }
    }]);

    return SliceViewRenderHelper;
}(RenderHelper);

registerAnnotationTypeRenderHandler(AnnotationType.ELLIPSOID, {
    bytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var center = annotation.center,
                radii = annotation.radii;

            var coordinateOffset = index * 6;
            coordinates.set(center, coordinateOffset);
            coordinates.set(radii, coordinateOffset + 3);
        };
    },
    sliceViewRenderHelper: SliceViewRenderHelper,
    perspectiveViewRenderHelper: PerspectiveRenderHelper,
    pickIdsPerInstance: 1,
    snapPosition: function snapPosition() /*position, objectToData, annotation, partIndex*/{
        // FIXME: snap to nearest point on ellipsoid surface
    },
    getRepresentativePoint: function getRepresentativePoint(objectToData, ann) {
        var repPoint = vec3.create();
        vec3.transformMat4(repPoint, ann.center, objectToData);
        return repPoint;
    },
    updateViaRepresentativePoint: function updateViaRepresentativePoint(oldAnnotation, position, dataToObject) {
        var annotation = _Object$assign({}, oldAnnotation);
        annotation.center = vec3.transformMat4(vec3.create(), position, dataToObject);
        return annotation;
    }
});
//# sourceMappingURL=ellipsoid.js.map