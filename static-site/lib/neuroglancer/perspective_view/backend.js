import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
/**
 * @license
 * Copyright 2018 Google Inc.
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
/**
 * @file Backend component of PerspectivePanel.  This allows the optional backend component of a
 * PerspectiveViewRenderLayer to set chunk priorities based on the state of the perspective panel.
 */
import { PERSPECTIVE_VIEW_ADD_LAYER_RPC_ID, PERSPECTIVE_VIEW_REMOVE_LAYER_RPC_ID, PERSPECTIVE_VIEW_RPC_ID, PERSPECTIVE_VIEW_UPDATE_VIEWPORT_RPC_ID } from "./base";
import { WatchableSet, WatchableValue } from "../trackable_value";
import { mat4 } from "../util/geom";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "../worker_rpc";
var PerspectiveViewState = function (_SharedObjectCounterp) {
    _inherits(PerspectiveViewState, _SharedObjectCounterp);

    function PerspectiveViewState() {
        var _ref;

        _classCallCheck(this, PerspectiveViewState);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = PerspectiveViewState.__proto__ || _Object$getPrototypeOf(PerspectiveViewState)).call.apply(_ref, [this].concat(args)));

        _this.viewport = new WatchableValue({
            width: 0,
            height: 0,
            projectionMat: mat4.create(),
            viewMat: mat4.create(),
            viewProjectionMat: mat4.create()
        });
        var rpc = args[0];
        var options = args[1];
        _this.visibility = rpc.get(options['visibility']);
        return _this;
    }

    return PerspectiveViewState;
}(SharedObjectCounterpart);
PerspectiveViewState = __decorate([registerSharedObject(PERSPECTIVE_VIEW_RPC_ID)], PerspectiveViewState);
export { PerspectiveViewState };
export var PerspectiveViewRenderLayer = function (_SharedObjectCounterp2) {
    _inherits(PerspectiveViewRenderLayer, _SharedObjectCounterp2);

    function PerspectiveViewRenderLayer() {
        _classCallCheck(this, PerspectiveViewRenderLayer);

        var _this2 = _possibleConstructorReturn(this, (PerspectiveViewRenderLayer.__proto__ || _Object$getPrototypeOf(PerspectiveViewRenderLayer)).apply(this, arguments));

        _this2.viewStates = new WatchableSet();
        return _this2;
    }

    return PerspectiveViewRenderLayer;
}(SharedObjectCounterpart);
registerRPC(PERSPECTIVE_VIEW_UPDATE_VIEWPORT_RPC_ID, function (x) {
    var viewState = this.get(x.view);
    viewState.viewport.value = x.viewport;
});
registerRPC(PERSPECTIVE_VIEW_ADD_LAYER_RPC_ID, function (x) {
    var viewState = this.get(x.view);
    var layer = this.get(x.layer);
    layer.viewStates.add(viewState);
});
registerRPC(PERSPECTIVE_VIEW_REMOVE_LAYER_RPC_ID, function (x) {
    var viewState = this.get(x.view);
    var layer = this.get(x.layer);
    layer.viewStates.delete(viewState);
});
//# sourceMappingURL=backend.js.map