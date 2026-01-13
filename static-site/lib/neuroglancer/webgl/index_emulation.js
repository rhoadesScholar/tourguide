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
import { RefCounted } from '../util/disposable';
import { Buffer } from './buffer';
import { glsl_uint32 } from './shader_lib';
export var CountingBuffer = function (_RefCounted) {
    _inherits(CountingBuffer, _RefCounted);

    function CountingBuffer(gl) {
        _classCallCheck(this, CountingBuffer);

        var _this = _possibleConstructorReturn(this, (CountingBuffer.__proto__ || _Object$getPrototypeOf(CountingBuffer)).call(this));

        _this.gl = gl;
        _this.buffer = _this.registerDisposer(new Buffer(gl));
        return _this;
    }

    _createClass(CountingBuffer, [{
        key: 'resize',
        value: function resize(length) {
            var bufferData = void 0;
            if (length < 256) {
                var data = bufferData = new Uint8Array(length);
                for (var i = 0; i < length; ++i) {
                    data[i] = i;
                }
                this.webglType = WebGL2RenderingContext.UNSIGNED_BYTE;
            } else if (length < 65536) {
                var _data = bufferData = new Uint16Array(length);
                for (var _i = 0; _i < length; ++_i) {
                    _data[_i] = _i;
                }
                this.webglType = WebGL2RenderingContext.UNSIGNED_SHORT;
            } else {
                var _data2 = bufferData = new Uint32Array(length);
                for (var _i2 = 0; _i2 < length; ++_i2) {
                    _data2[_i2] = _i2;
                }
                this.webglType = WebGL2RenderingContext.UNSIGNED_INT;
            }
            this.buffer.setData(bufferData);
            this.length = length;
        }
    }, {
        key: 'ensure',
        value: function ensure(length) {
            if (this.length === undefined || this.length < length) {
                this.resize(length);
            }
            return this;
        }
    }, {
        key: 'bindToVertexAttrib',
        value: function bindToVertexAttrib(location) {
            this.buffer.bindToVertexAttribI(location, 1, this.webglType);
        }
    }, {
        key: 'bind',
        value: function bind(shader) {
            var divisor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            var location = shader.attribute('aIndexRaw');
            if (location >= 0) {
                this.bindToVertexAttrib(location);
                if (divisor !== 0) {
                    this.gl.vertexAttribDivisor(location, divisor);
                }
            }
        }
    }]);

    return CountingBuffer;
}(RefCounted);
export function disableCountingBuffer(gl, shader) {
    var instanced = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var location = shader.attribute('aIndexRaw');
    if (location >= 0) {
        if (instanced) {
            gl.vertexAttribDivisor(location, 0);
        }
        gl.disableVertexAttribArray(location);
    }
}
export function getCountingBuffer(gl) {
    return gl.memoize.get('IndexBuffer', function () {
        return new CountingBuffer(gl);
    });
}
export function countingBufferShaderModule(builder) {
    builder.addAttribute('highp uint', 'aIndexRaw');
    builder.addVertexCode(glsl_uint32);
    builder.addVertexCode('\nuint getPrimitiveIndex() {\n  return aIndexRaw;\n}\n');
}
/**
 * Helper class for using a buffer containing uint32 index values as a vertex attribute.
 */
export var IndexBufferAttributeHelper = function () {
    function IndexBufferAttributeHelper(name) {
        _classCallCheck(this, IndexBufferAttributeHelper);

        this.name = name;
    }

    _createClass(IndexBufferAttributeHelper, [{
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.addAttribute('highp uint', this.name);
        }
    }, {
        key: 'bind',
        value: function bind(buffer, shader) {
            var attrib = shader.attribute(this.name);
            buffer.bindToVertexAttribI(attrib, /*components=*/1, WebGL2RenderingContext.UNSIGNED_INT);
        }
    }, {
        key: 'disable',
        value: function disable(shader) {
            shader.gl.disableVertexAttribArray(shader.attribute(this.name));
        }
    }]);

    return IndexBufferAttributeHelper;
}();
export function makeIndexBuffer(gl, data) {
    return Buffer.fromData(gl, data, WebGL2RenderingContext.ARRAY_BUFFER, WebGL2RenderingContext.STATIC_DRAW);
}
//# sourceMappingURL=index_emulation.js.map