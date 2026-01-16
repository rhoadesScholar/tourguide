import _Map from 'babel-runtime/core-js/map';
import _Array$from from 'babel-runtime/core-js/array/from';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { identityMat4, mat4, transformVectorByMat4, vec3 } from '../util/geom';
export var ChunkLayout = function () {
    function ChunkLayout(size) {
        var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identityMat4;

        _classCallCheck(this, ChunkLayout);

        this.size = vec3.clone(size);
        this.transform = mat4.clone(transform);
        this.invTransform = mat4.invert(mat4.create(), transform);
    }

    _createClass(ChunkLayout, [{
        key: 'toObject',
        value: function toObject(msg) {
            msg['size'] = this.size;
            msg['transform'] = this.transform;
        }
    }, {
        key: 'localSpatialToGlobal',

        /**
         * Transform local spatial coordinates to global spatial coordinates.
         */
        value: function localSpatialToGlobal(out, localSpatial) {
            return vec3.transformMat4(out, localSpatial, this.transform);
        }
        /**
         * Transform global spatial coordinates to local spatial coordinates.
         */

    }, {
        key: 'globalToLocalSpatial',
        value: function globalToLocalSpatial(out, globalSpatial) {
            return vec3.transformMat4(out, globalSpatial, this.invTransform);
        }
    }, {
        key: 'globalToLocalGrid',
        value: function globalToLocalGrid(out, globalSpatial) {
            this.globalToLocalSpatial(out, globalSpatial);
            vec3.divide(out, out, this.size);
            return out;
        }
    }, {
        key: 'localSpatialVectorToGlobal',
        value: function localSpatialVectorToGlobal(out, localVector) {
            return transformVectorByMat4(out, localVector, this.transform);
        }
    }, {
        key: 'globalToLocalSpatialVector',
        value: function globalToLocalSpatialVector(out, globalVector) {
            return transformVectorByMat4(out, globalVector, this.invTransform);
        }
    }, {
        key: 'assignLocalSpatialToGlobalMat4',
        value: function assignLocalSpatialToGlobalMat4(out) {
            return mat4.copy(out, this.transform);
        }
    }], [{
        key: 'get',
        value: function get(size) {
            var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identityMat4;

            var cache = ChunkLayout.cache;
            var key = _JSON$stringify([_Array$from(size), _Array$from(transform)]);
            var obj = cache.get(key);
            if (obj === undefined) {
                obj = new ChunkLayout(size, transform);
                cache.set(key, obj);
            }
            return obj;
        }
    }, {
        key: 'fromObject',
        value: function fromObject(msg) {
            return ChunkLayout.get(msg['size'], msg['transform']);
        }
    }]);

    return ChunkLayout;
}();
ChunkLayout.cache = new _Map();
//# sourceMappingURL=chunk_layout.js.map