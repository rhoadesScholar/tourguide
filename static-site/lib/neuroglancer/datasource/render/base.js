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
export var RenderBaseSourceParameters = function RenderBaseSourceParameters() {
  _classCallCheck(this, RenderBaseSourceParameters);
};
export var RenderSourceParameters = function (_RenderBaseSourcePara) {
  _inherits(RenderSourceParameters, _RenderBaseSourcePara);

  function RenderSourceParameters() {
    _classCallCheck(this, RenderSourceParameters);

    return _possibleConstructorReturn(this, (RenderSourceParameters.__proto__ || _Object$getPrototypeOf(RenderSourceParameters)).apply(this, arguments));
  }

  return RenderSourceParameters;
}(RenderBaseSourceParameters);
export var TileChunkSourceParameters = function (_RenderSourceParamete) {
  _inherits(TileChunkSourceParameters, _RenderSourceParamete);

  function TileChunkSourceParameters() {
    _classCallCheck(this, TileChunkSourceParameters);

    return _possibleConstructorReturn(this, (TileChunkSourceParameters.__proto__ || _Object$getPrototypeOf(TileChunkSourceParameters)).apply(this, arguments));
  }

  return TileChunkSourceParameters;
}(RenderSourceParameters);
TileChunkSourceParameters.RPC_ID = 'render/TileChunkSource';
export var PointMatchChunkSourceParameters = function (_RenderSourceParamete2) {
  _inherits(PointMatchChunkSourceParameters, _RenderSourceParamete2);

  function PointMatchChunkSourceParameters() {
    _classCallCheck(this, PointMatchChunkSourceParameters);

    return _possibleConstructorReturn(this, (PointMatchChunkSourceParameters.__proto__ || _Object$getPrototypeOf(PointMatchChunkSourceParameters)).apply(this, arguments));
  }

  return PointMatchChunkSourceParameters;
}(RenderSourceParameters);
PointMatchChunkSourceParameters.RPC_ID = 'render/PointMatchSource';
//# sourceMappingURL=base.js.map