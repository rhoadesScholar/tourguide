import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2016 Google Inc.
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
import { RefCounted } from './util/disposable';
import { Buffer } from './webgl/buffer';
import { trivialColorShader } from './webgl/trivial_shaders';
export var AxesLineHelper = function (_RefCounted) {
    _inherits(AxesLineHelper, _RefCounted);

    function AxesLineHelper(gl) {
        _classCallCheck(this, AxesLineHelper);

        var _this = _possibleConstructorReturn(this, (AxesLineHelper.__proto__ || _Object$getPrototypeOf(AxesLineHelper)).call(this));

        _this.gl = gl;
        _this.vertexBuffer = _this.registerDisposer(Buffer.fromData(gl, new Float32Array([0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]), gl.ARRAY_BUFFER, gl.STATIC_DRAW));
        var alpha = 0.5;
        _this.colorBuffer = _this.registerDisposer(Buffer.fromData(gl, new Float32Array([1, 0, 0, alpha, 1, 0, 0, alpha, 0, 1, 0, alpha, 0, 1, 0, alpha, 0, 0, 1, alpha, 0, 0, 1, alpha]), gl.ARRAY_BUFFER, gl.STATIC_DRAW));
        _this.trivialColorShader = _this.registerDisposer(trivialColorShader(gl));
        return _this;
    }

    _createClass(AxesLineHelper, [{
        key: 'draw',
        value: function draw(mat) {
            var blend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var shader = this.trivialColorShader;
            var gl = this.gl;
            shader.bind();
            gl.uniformMatrix4fv(shader.uniform('uProjectionMatrix'), false, mat);
            var aVertexPosition = shader.attribute('aVertexPosition');
            this.vertexBuffer.bindToVertexAttrib(aVertexPosition, 4);
            var aColor = shader.attribute('aColor');
            this.colorBuffer.bindToVertexAttrib(aColor, 4);
            if (blend) {
                gl.colorMask(false, false, false, true);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.colorMask(true, true, true, true);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA);
            }
            gl.lineWidth(1);
            gl.drawArrays(gl.LINES, 0, 6);
            if (blend) {
                gl.disable(gl.BLEND);
            }
            gl.disableVertexAttribArray(aVertexPosition);
            gl.disableVertexAttribArray(aColor);
        }
    }], [{
        key: 'get',
        value: function get(gl) {
            return gl.memoize.get('SliceViewPanel:AxesLineHelper', function () {
                return new AxesLineHelper(gl);
            });
        }
    }]);

    return AxesLineHelper;
}(RefCounted);
//# sourceMappingURL=axes_lines.js.map