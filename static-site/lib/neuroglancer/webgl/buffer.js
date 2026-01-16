import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { RefCountedValue } from '../util/disposable';
import { stableStringify } from '../util/json';
import { getObjectId } from '../util/object_id';
export var Buffer = function () {
    function Buffer(gl) {
        var bufferType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : WebGL2RenderingContext.ARRAY_BUFFER;

        _classCallCheck(this, Buffer);

        this.gl = gl;
        this.bufferType = bufferType;
        this.gl = gl;
        // This should never return null.
        this.buffer = gl.createBuffer();
    }

    _createClass(Buffer, [{
        key: 'bind',
        value: function bind() {
            this.gl.bindBuffer(this.bufferType, this.buffer);
        }
    }, {
        key: 'bindToVertexAttrib',
        value: function bindToVertexAttrib(location, componentsPerVertexAttribute) {
            var attributeType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : WebGL2RenderingContext.FLOAT;
            var normalized = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
            var stride = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var offset = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

            this.bind();
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribPointer(location, componentsPerVertexAttribute, attributeType, normalized, stride, offset);
        }
    }, {
        key: 'bindToVertexAttribI',
        value: function bindToVertexAttribI(location, componentsPerVertexAttribute) {
            var attributeType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : WebGL2RenderingContext.UNSIGNED_INT;
            var stride = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
            var offset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

            this.bind();
            this.gl.enableVertexAttribArray(location);
            this.gl.vertexAttribIPointer(location, componentsPerVertexAttribute, attributeType, stride, offset);
        }
    }, {
        key: 'setData',
        value: function setData(data) {
            var usage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : WebGL2RenderingContext.STATIC_DRAW;

            var gl = this.gl;
            this.bind();
            gl.bufferData(this.bufferType, data, usage);
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            this.gl.deleteBuffer(this.buffer);
            this.buffer = undefined;
            this.gl = undefined;
        }
    }], [{
        key: 'fromData',
        value: function fromData(gl, data, bufferType, usage) {
            var buffer = new Buffer(gl, bufferType);
            buffer.setData(data, usage);
            return buffer;
        }
    }]);

    return Buffer;
}();
export function getMemoizedBuffer(gl, bufferType, getter) {
    for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
    }

    return gl.memoize.get(stableStringify({ id: 'getMemoizedBuffer', getter: getObjectId(getter), args: args }), function () {
        var result = new RefCountedValue(Buffer.fromData(gl, getter.apply(undefined, args), bufferType, WebGL2RenderingContext.STATIC_DRAW));
        result.registerDisposer(result.value);
        return result;
    });
}
//# sourceMappingURL=buffer.js.map