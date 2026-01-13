import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
 * @file Facilities for drawing spheres in WebGL
 */
import { RefCounted } from '../util/disposable';
import { getMemoizedBuffer } from './buffer';
export function getSphereVertexArray(latitudeBands, longitudeBands) {
    var result = new Float32Array((latitudeBands + 1) * (longitudeBands + 1) * 3);
    var i = 0;
    for (var latIndex = 0; latIndex <= latitudeBands; ++latIndex) {
        var theta = latIndex * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var lonIndex = 0; lonIndex <= longitudeBands; ++lonIndex) {
            var phi = lonIndex * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            result[i++] = cosPhi * sinTheta; // x
            result[i++] = cosTheta; // y
            result[i++] = sinPhi * sinTheta; // z
        }
    }
    return result;
}
export function getSphereIndexArray(latitudeBands, longitudeBands) {
    var result = new Uint16Array(latitudeBands * longitudeBands * 6);
    var i = 0;
    for (var latIndex = 0; latIndex < latitudeBands; latIndex++) {
        for (var lonIndex = 0; lonIndex < longitudeBands; lonIndex++) {
            var first = latIndex * (longitudeBands + 1) + lonIndex;
            var second = first + longitudeBands + 1;
            result[i++] = first;
            result[i++] = second;
            result[i++] = first + 1;
            result[i++] = second;
            result[i++] = second + 1;
            result[i++] = first + 1;
        }
    }
    return result;
}
export var SphereRenderHelper = function (_RefCounted) {
    _inherits(SphereRenderHelper, _RefCounted);

    function SphereRenderHelper(gl, latitudeBands, longitudeBands) {
        _classCallCheck(this, SphereRenderHelper);

        var _this = _possibleConstructorReturn(this, (SphereRenderHelper.__proto__ || _Object$getPrototypeOf(SphereRenderHelper)).call(this));

        _this.vertexBuffer = _this.registerDisposer(getMemoizedBuffer(gl, WebGL2RenderingContext.ARRAY_BUFFER, getSphereVertexArray, latitudeBands, longitudeBands)).value;
        _this.indexBuffer = _this.registerDisposer(getMemoizedBuffer(gl, WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, getSphereIndexArray, latitudeBands, longitudeBands)).value;
        _this.numIndices = latitudeBands * longitudeBands * 6;
        return _this;
    }

    _createClass(SphereRenderHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addAttribute('highp vec3', 'aSphereVertex');
            builder.addVarying('highp float', 'vLightingFactor');
            // projectionMatrix = cameraMatrix * modelViewMat
            // normalTransformMatrix = (modelViewMat^{-1})^T
            // eff modelViewMat = modelViewMat * scalMat(radii)
            // normalTransformMatrix =  (modelViewMat * scalMat)^{-1}^T
            // =   (scalMat^{-1} * modelViewMat^{-1})^T
            // =   modelViewMat^{-1}^T * (scalMat^{-1})^T
            builder.addVertexCode('\nvoid emitSphere(mat4 projectionMatrix, mat4 normalTransformMatrix, vec3 centerPosition, vec3 radii, vec4 lightDirection) {\n  vec3 vertexPosition = aSphereVertex * radii + centerPosition;\n  gl_Position = projectionMatrix * vec4(vertexPosition, 1.0);\n  vec3 normal = normalize((normalTransformMatrix * vec4(aSphereVertex / radii, 0.0)).xyz);\n  vLightingFactor = abs(dot(normal, uLightDirection.xyz)) + uLightDirection.w;\n}\n');
        }
    }, {
        key: 'draw',
        value: function draw(shader, numInstances) {
            var aSphereVertex = shader.attribute('aSphereVertex');
            this.vertexBuffer.bindToVertexAttrib(aSphereVertex, /*components=*/3, /*attributeType=*/WebGL2RenderingContext.FLOAT,
            /*normalized=*/false);
            this.indexBuffer.bind();
            shader.gl.drawElementsInstanced(WebGL2RenderingContext.TRIANGLES, this.numIndices, WebGL2RenderingContext.UNSIGNED_SHORT,
            /*offset=*/0, numInstances);
            shader.gl.disableVertexAttribArray(aSphereVertex);
        }
    }]);

    return SphereRenderHelper;
}(RefCounted);
//# sourceMappingURL=spheres.js.map