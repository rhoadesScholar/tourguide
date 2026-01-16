import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
// DO NOT EDIT.  Generated from templates/neuroglancer/util/typedarray_builder.template.ts.
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
export var Int32ArrayBuilder = function () {
    function Int32ArrayBuilder() {
        var initialCapacity = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 16;

        _classCallCheck(this, Int32ArrayBuilder);

        this.length = 0;
        this.data = new Int32Array(initialCapacity);
    }

    _createClass(Int32ArrayBuilder, [{
        key: "resize",
        value: function resize(newLength) {
            var data = this.data;

            if (newLength > data.length) {
                var newData = new Int32Array(Math.max(newLength, data.length * 2));
                newData.set(data.subarray(0, this.length));
                this.data = newData;
            }
            this.length = newLength;
        }
    }, {
        key: "shrinkToFit",
        value: function shrinkToFit() {
            this.data = new Int32Array(this.view);
        }
    }, {
        key: "clear",
        value: function clear() {
            this.length = 0;
        }
    }, {
        key: "appendArray",
        value: function appendArray(other) {
            var length = this.length;

            this.resize(length + other.length);
            this.data.set(other, length);
        }
    }, {
        key: "eraseRange",
        value: function eraseRange(start, end) {
            this.data.copyWithin(start, end, this.length);
            this.length -= end - start;
        }
    }, {
        key: "view",
        get: function get() {
            var data = this.data;

            return new Int32Array(data.buffer, data.byteOffset, this.length);
        }
    }]);

    return Int32ArrayBuilder;
}();
//# sourceMappingURL=int32array_builder.js.map