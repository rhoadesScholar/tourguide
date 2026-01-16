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
 * @file Facilities for drawing quads in WebGL as two triangles.
 */
import { RefCounted } from '../util/disposable';
import { getMemoizedBuffer } from './buffer';
export var VERTICES_PER_QUAD = 4;
export var TRIANGLES_PER_QUAD = 2;
export var INDICES_PER_QUAD = TRIANGLES_PER_QUAD * 3;
/**
 * Returns a WebGL2RenderingContext.TRIANGLES index array for drawing an instance containing
 * `quadsPerInstance` quads.
 */
function getQuadIndexArray(quadsPerInstance) {
    var result = new Uint16Array(quadsPerInstance * INDICES_PER_QUAD);
    for (var quad = 0; quad < quadsPerInstance; ++quad) {
        var v = quad * VERTICES_PER_QUAD;
        var i = quad * INDICES_PER_QUAD;
        result[i] = v;
        result[i + 1] = v + 1;
        result[i + 2] = v + 2;
        result[i + 3] = v + 2;
        result[i + 4] = v + 3;
        result[i + 5] = v;
    }
    return result;
}
export var QuadRenderHelper = function (_RefCounted) {
    _inherits(QuadRenderHelper, _RefCounted);

    function QuadRenderHelper(gl, quadsPerInstance) {
        _classCallCheck(this, QuadRenderHelper);

        var _this = _possibleConstructorReturn(this, (QuadRenderHelper.__proto__ || _Object$getPrototypeOf(QuadRenderHelper)).call(this));

        _this.quadsPerInstance = quadsPerInstance;
        if (quadsPerInstance !== 1) {
            _this.quadIndexBuffer = _this.registerDisposer(getMemoizedBuffer(gl, WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, getQuadIndexArray, quadsPerInstance)).value;
        }
        return _this;
    }

    _createClass(QuadRenderHelper, [{
        key: 'draw',
        value: function draw(gl, numInstances) {
            if (this.quadsPerInstance === 1) {
                gl.drawArraysInstanced(WebGL2RenderingContext.TRIANGLE_FAN, 0, 4, numInstances);
            } else {
                this.quadIndexBuffer.bind();
                gl.drawElementsInstanced(WebGL2RenderingContext.TRIANGLES, INDICES_PER_QUAD * this.quadsPerInstance, WebGL2RenderingContext.UNSIGNED_SHORT, /*offset=*/0, numInstances);
            }
        }
    }]);

    return QuadRenderHelper;
}(RefCounted);
//# sourceMappingURL=quad.js.map