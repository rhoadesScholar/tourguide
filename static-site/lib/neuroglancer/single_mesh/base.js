import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
export var SINGLE_MESH_LAYER_RPC_ID = 'single_mesh/SingleMeshLayer';
export var GET_SINGLE_MESH_INFO_RPC_ID = 'single_mesh/getSingleMeshInfo';
export var SINGLE_MESH_CHUNK_KEY = '';
export var SingleMeshSourceParameters = function SingleMeshSourceParameters() {
  _classCallCheck(this, SingleMeshSourceParameters);
};
export var SingleMeshSourceParametersWithInfo = function (_SingleMeshSourcePara) {
  _inherits(SingleMeshSourceParametersWithInfo, _SingleMeshSourcePara);

  function SingleMeshSourceParametersWithInfo() {
    _classCallCheck(this, SingleMeshSourceParametersWithInfo);

    return _possibleConstructorReturn(this, (SingleMeshSourceParametersWithInfo.__proto__ || _Object$getPrototypeOf(SingleMeshSourceParametersWithInfo)).apply(this, arguments));
  }

  return SingleMeshSourceParametersWithInfo;
}(SingleMeshSourceParameters);
SingleMeshSourceParametersWithInfo.RPC_ID = 'single_mesh/SingleMeshSource';
//# sourceMappingURL=base.js.map