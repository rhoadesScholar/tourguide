import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
import { SliceViewChunkSpecification } from '../base';
import { getCombinedTransform } from '../base';
export var VectorGraphicsType;
(function (VectorGraphicsType) {
    VectorGraphicsType[VectorGraphicsType["LINE"] = 0] = "LINE";
    VectorGraphicsType[VectorGraphicsType["POINT"] = 1] = "POINT";
})(VectorGraphicsType || (VectorGraphicsType = {}));
/**
 * Specifies a chunk layout and voxel size.
 */
export var VectorGraphicsChunkSpecification = function (_SliceViewChunkSpecif) {
    _inherits(VectorGraphicsChunkSpecification, _SliceViewChunkSpecif);

    function VectorGraphicsChunkSpecification(options) {
        _classCallCheck(this, VectorGraphicsChunkSpecification);

        return _possibleConstructorReturn(this, (VectorGraphicsChunkSpecification.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunkSpecification)).call(this, options));
    }

    _createClass(VectorGraphicsChunkSpecification, [{
        key: 'toObject',
        value: function toObject() {
            return _get(VectorGraphicsChunkSpecification.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunkSpecification.prototype), 'toObject', this).call(this);
        }
    }], [{
        key: 'make',
        value: function make(options) {
            return new VectorGraphicsChunkSpecification(_Object$assign({}, options, { transform: getCombinedTransform(options.transform, options.vectorGraphicsSourceOptions) }));
        }
    }, {
        key: 'fromObject',
        value: function fromObject(msg) {
            return new VectorGraphicsChunkSpecification(msg);
        }
    }]);

    return VectorGraphicsChunkSpecification;
}(SliceViewChunkSpecification);
export var VECTOR_GRAPHICS_RPC_ID = 'vectorgraphics';
export var VECTOR_GRAPHICS_RENDERLAYER_RPC_ID = 'vectorgraphics/RenderLayer';
//# sourceMappingURL=base.js.map