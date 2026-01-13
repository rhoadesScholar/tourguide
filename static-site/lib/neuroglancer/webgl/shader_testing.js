import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Object$keys from 'babel-runtime/core-js/object/keys';
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
import { RefCounted } from '../util/disposable';
import { vec4 } from '../util/geom';
import { FramebufferConfiguration, TextureBuffer } from './offscreen';
import { ShaderBuilder } from './shader';
import { getSquareCornersBuffer } from './square_corners_buffer';
import { webglTest } from './testing';
function makeTextureBuffersForOutputs(gl, outputs) {
    return _Object$keys(outputs).map(function (key) {
        var t = outputs[key];
        if (t === 'uint') {
            return new TextureBuffer(gl, WebGL2RenderingContext.R32UI, WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.UNSIGNED_INT);
        } else {
            return new TextureBuffer(gl, WebGL2RenderingContext.R32F, WebGL2RenderingContext.RED, WebGL2RenderingContext.FLOAT);
        }
    });
}
export var FragmentShaderTester = function (_RefCounted) {
    _inherits(FragmentShaderTester, _RefCounted);

    function FragmentShaderTester(gl, outputs) {
        _classCallCheck(this, FragmentShaderTester);

        var _this = _possibleConstructorReturn(this, (FragmentShaderTester.__proto__ || _Object$getPrototypeOf(FragmentShaderTester)).call(this));

        _this.gl = gl;
        _this.outputs = outputs;
        _this.builder = new ShaderBuilder(_this.gl);
        _this.vertexPositionsBuffer = getSquareCornersBuffer(_this.gl, -1, -1, 1, 1);
        var builder = _this.builder;

        _this.offscreenFramebuffer = new FramebufferConfiguration(_this.gl, { colorBuffers: makeTextureBuffersForOutputs(gl, outputs) });
        builder.addAttribute('vec4', 'shader_testing_aVertexPosition');
        builder.setVertexMain('gl_Position = shader_testing_aVertexPosition;');
        _Object$keys(outputs).forEach(function (key, index) {
            var t = outputs[key];
            builder.addOutputBuffer(t === 'uint' ? 'highp uint' : 'highp float', key, index);
        });
        return _this;
    }

    _createClass(FragmentShaderTester, [{
        key: 'build',
        value: function build() {
            this.shader = this.builder.build();
        }
    }, {
        key: 'execute',
        value: function execute() {
            this.offscreenFramebuffer.bind(1, 1);
            var gl = this.gl,
                shader = this.shader;

            gl.disable(gl.STENCIL_TEST);
            gl.disable(gl.SCISSOR_TEST);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);
            var aVertexPosition = shader.attribute('shader_testing_aVertexPosition');
            this.vertexPositionsBuffer.bindToVertexAttrib(aVertexPosition, /*components=*/2);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.disableVertexAttribArray(aVertexPosition);
            this.offscreenFramebuffer.unbind();
        }
    }, {
        key: 'read',
        value: function read(key) {
            var t = this.outputs[key];
            var index = _Object$keys(this.outputs).indexOf(key);
            if (t === 'uint') {
                return this.offscreenFramebuffer.readPixelUint32(index, 0, 0);
            } else {
                return this.offscreenFramebuffer.readPixelFloat32(index, 0, 0);
            }
        }
    }, {
        key: 'readBytes',
        value: function readBytes() {
            var index = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            return this.offscreenFramebuffer.readPixel(index, 0, 0);
        }
    }, {
        key: 'readVec4',
        value: function readVec4(index) {
            var x = this.readBytes(index);
            return vec4.fromValues(x[0] / 255, x[1] / 255, x[2] / 255, x[3] / 255);
        }
    }, {
        key: 'readFloat',
        value: function readFloat(index) {
            var bytes = this.readBytes(index);
            var dataView = new DataView(bytes.buffer, 0, 4);
            return dataView.getFloat32(0, /*littleEndian=*/true);
        }
        /**
         * Interprets the 4-byte RGBA value as a native uint32.
         */

    }, {
        key: 'readUint32',
        value: function readUint32(index) {
            var bytes = this.readBytes(index);
            return new Uint32Array(bytes.buffer)[0];
        }
    }, {
        key: 'values',
        get: function get() {
            var values = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(_Object$keys(this.outputs)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    values[key] = this.read(key);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return values;
        }
    }]);

    return FragmentShaderTester;
}(RefCounted);
export function fragmentShaderTest(outputs, f) {
    webglTest(function (gl) {
        var tester = new FragmentShaderTester(gl, outputs);
        try {
            f(tester);
        } finally {
            tester.dispose();
        }
    });
}
//# sourceMappingURL=shader_testing.js.map