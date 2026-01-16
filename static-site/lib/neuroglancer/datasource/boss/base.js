import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
/**
 * @license
 * Copyright 2017 Google Inc.
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
export var BossSourceParameters = function BossSourceParameters() {
    _classCallCheck(this, BossSourceParameters);
};
export var VolumeChunkSourceParameters = function (_BossSourceParameters) {
    _inherits(VolumeChunkSourceParameters, _BossSourceParameters);

    function VolumeChunkSourceParameters() {
        _classCallCheck(this, VolumeChunkSourceParameters);

        return _possibleConstructorReturn(this, (VolumeChunkSourceParameters.__proto__ || _Object$getPrototypeOf(VolumeChunkSourceParameters)).apply(this, arguments));
    }

    _createClass(VolumeChunkSourceParameters, null, [{
        key: 'stringify',
        value: function stringify(parameters) {
            return 'boss:volume:' + parameters.baseUrl + '/' + parameters.collection + '/' + parameters.experiment + '/' + parameters.channel + '/' + parameters.resolution + '/' + parameters.encoding;
        }
    }]);

    return VolumeChunkSourceParameters;
}(BossSourceParameters);
VolumeChunkSourceParameters.RPC_ID = 'boss/VolumeChunkSource';
export var MeshSourceParameters = function () {
    function MeshSourceParameters() {
        _classCallCheck(this, MeshSourceParameters);
    }

    _createClass(MeshSourceParameters, null, [{
        key: 'stringify',
        value: function stringify(parameters) {
            return 'boss:mesh:' + parameters.baseUrl;
        }
    }]);

    return MeshSourceParameters;
}();
MeshSourceParameters.RPC_ID = 'boss/MeshChunkSource';
//# sourceMappingURL=base.js.map