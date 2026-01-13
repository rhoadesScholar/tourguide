import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
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
var DEBUG_PICKING = false;
export var PickIDManager = function () {
    function PickIDManager() {
        _classCallCheck(this, PickIDManager);

        /**
         * This specifies the render layer corresponding to each registered entry.
         */
        this.renderLayers = [null];
        this.pickData = [null];
        /**
         * This contains 3 consecutive values, specifying (startPickID, low, high), for each registered
         * entry.  startPickID specifies the first uint32 pick ID corresponding to the entry.  low and
         * high specify two additional numbers associated with the entry.
         */
        this.values = [0, 0, 0];
        this.nextPickID = 1;
    }

    _createClass(PickIDManager, [{
        key: "clear",
        value: function clear() {
            this.renderLayers.length = 1;
            this.pickData.length = 1;
            this.values.length = 3;
            this.nextPickID = 1;
        }
    }, {
        key: "registerUint64",
        value: function registerUint64(renderLayer, x) {
            var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

            return this.register(renderLayer, count, x.low, x.high);
        }
    }, {
        key: "register",
        value: function register(renderLayer) {
            var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
            var low = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var high = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
            var data = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
            var renderLayers = this.renderLayers,
                values = this.values;

            var pickID = this.nextPickID;
            this.nextPickID += count;
            var index = renderLayers.length;
            renderLayers[index] = renderLayer;
            var valuesOffset = index * 3;
            values[valuesOffset] = pickID;
            values[valuesOffset + 1] = low;
            values[valuesOffset + 2] = high;
            this.pickData[index] = data;
            return pickID;
        }
        /**
         * Set the object state according to the specified pick ID.
         */

    }, {
        key: "setMouseState",
        value: function setMouseState(mouseState, pickID) {
            // Binary search to find largest registered index with a pick ID <= pickID.
            var renderLayers = this.renderLayers,
                values = this.values;

            var lower = 0,
                upper = renderLayers.length - 1;
            while (lower < upper) {
                var mid = Math.ceil(lower + (upper - lower) / 2);
                if (values[mid * 3] > pickID) {
                    upper = mid - 1;
                } else {
                    lower = mid;
                }
            }
            var pickedRenderLayer = mouseState.pickedRenderLayer = renderLayers[lower];
            var valuesOffset = lower * 3;
            var pickedOffset = mouseState.pickedOffset = pickID - values[valuesOffset];
            if (DEBUG_PICKING) {
                console.log("Looking up pick ID " + pickID + ": renderLayer", pickedRenderLayer, "offset=" + pickedOffset);
            }
            var pickedValue = mouseState.pickedValue;

            pickedValue.low = values[valuesOffset + 1];
            pickedValue.high = values[valuesOffset + 2];
            mouseState.pickedAnnotationId = undefined;
            mouseState.pickedAnnotationLayer = undefined;
            if (pickedRenderLayer !== null) {
                pickedRenderLayer.updateMouseState(mouseState, pickedValue, pickedOffset, this.pickData[lower]);
            }
        }
    }]);

    return PickIDManager;
}();
//# sourceMappingURL=object_picking.js.map