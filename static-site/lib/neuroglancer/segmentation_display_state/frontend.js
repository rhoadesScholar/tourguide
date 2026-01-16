import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { SharedWatchableValue } from '../shared_watchable_value';
import { hsvToRgb, rgbToHsv } from '../util/colorspace';
import { RefCounted } from '../util/disposable';
import { vec4 } from '../util/geom';
import { NullarySignal } from '../util/signal';
import { Uint64 } from '../util/uint64';
import { withSharedVisibility } from '../visibility_priority/frontend';
import { SharedObject } from '../worker_rpc';
export var Uint64MapEntry = function () {
    function Uint64MapEntry(key, value) {
        _classCallCheck(this, Uint64MapEntry);

        this.key = key;
        this.value = value;
    }

    _createClass(Uint64MapEntry, [{
        key: 'toString',
        value: function toString() {
            return this.key + '\u2192' + this.value;
        }
    }]);

    return Uint64MapEntry;
}();
export var SegmentSelectionState = function (_RefCounted) {
    _inherits(SegmentSelectionState, _RefCounted);

    function SegmentSelectionState() {
        _classCallCheck(this, SegmentSelectionState);

        var _this = _possibleConstructorReturn(this, (SegmentSelectionState.__proto__ || _Object$getPrototypeOf(SegmentSelectionState)).apply(this, arguments));

        _this.selectedSegment = new Uint64();
        _this.hasSelectedSegment = false;
        _this.changed = new NullarySignal();
        return _this;
    }

    _createClass(SegmentSelectionState, [{
        key: 'set',
        value: function set(value) {
            if (value == null) {
                if (this.hasSelectedSegment) {
                    this.hasSelectedSegment = false;
                    this.changed.dispatch();
                }
            } else {
                var existingValue = this.selectedSegment;
                if (!this.hasSelectedSegment || value.low !== existingValue.low || value.high !== existingValue.high) {
                    existingValue.low = value.low;
                    existingValue.high = value.high;
                    this.hasSelectedSegment = true;
                    this.changed.dispatch();
                }
            }
        }
    }, {
        key: 'isSelected',
        value: function isSelected(value) {
            return this.hasSelectedSegment && Uint64.equal(value, this.selectedSegment);
        }
    }, {
        key: 'bindTo',
        value: function bindTo(layerSelectedValues, userLayer) {
            var _this2 = this;

            var temp = new Uint64();
            this.registerDisposer(layerSelectedValues.changed.add(function () {
                var value = layerSelectedValues.get(userLayer);
                if (typeof value === 'number') {
                    temp.low = value;
                    temp.high = 0;
                    value = temp;
                } else if (value instanceof Uint64MapEntry) {
                    value = value.value;
                }
                _this2.set(value);
            }));
        }
    }]);

    return SegmentSelectionState;
}(RefCounted);
export function registerRedrawWhenSegmentationDisplayStateChanged(displayState, renderLayer) {
    var dispatchRedrawNeeded = renderLayer.redrawNeeded.dispatch;
    renderLayer.registerDisposer(displayState.segmentColorHash.changed.add(dispatchRedrawNeeded));
    renderLayer.registerDisposer(displayState.visibleSegments.changed.add(dispatchRedrawNeeded));
    renderLayer.registerDisposer(displayState.saturation.changed.add(dispatchRedrawNeeded));
    renderLayer.registerDisposer(displayState.highlightedSegments.changed.add(dispatchRedrawNeeded));
    renderLayer.registerDisposer(displayState.segmentEquivalences.changed.add(dispatchRedrawNeeded));
    renderLayer.registerDisposer(displayState.segmentSelectionState.changed.add(dispatchRedrawNeeded));
}
export function registerRedrawWhenSegmentationDisplayStateWithAlphaChanged(displayState, renderLayer) {
    registerRedrawWhenSegmentationDisplayStateChanged(displayState, renderLayer);
    renderLayer.registerDisposer(displayState.objectAlpha.changed.add(renderLayer.redrawNeeded.dispatch));
}
export function registerRedrawWhenSegmentationDisplayState3DChanged(displayState, renderLayer) {
    registerRedrawWhenSegmentationDisplayStateWithAlphaChanged(displayState, renderLayer);
    renderLayer.registerDisposer(displayState.objectToDataTransform.changed.add(renderLayer.redrawNeeded.dispatch));
    renderLayer.registerDisposer(displayState.renderScaleTarget.changed.add(renderLayer.redrawNeeded.dispatch));
}
/**
 * Temporary values used by getObjectColor.
 */
var tempColor = vec4.create();
var tempStatedColor = new Uint64();
/**
 * Returns the alpha-premultiplied color to use.
 */
export function getObjectColor(displayState, objectId) {
    var alpha = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

    var color = tempColor;
    color[3] = alpha;
    if (displayState.segmentStatedColors.has(objectId)) {
        // If displayState maps the ID to a color, use it
        displayState.segmentStatedColors.get(objectId, tempStatedColor);
        color[0] = ((tempStatedColor.low & 0xff0000) >>> 16) / 255.0;
        color[1] = ((tempStatedColor.low & 0x00ff00) >>> 8) / 255.0;
        color[2] = (tempStatedColor.low & 0x0000ff) / 255.0;
    } else {
        displayState.segmentColorHash.compute(color, objectId);
    }
    if (displayState.segmentSelectionState.isSelected(objectId)) {
        for (var i = 0; i < 3; ++i) {
            color[i] = color[i] * 0.5 + 0.5;
        }
    }
    // Apply saturation
    var hsv = new Float32Array(3);
    rgbToHsv(hsv, color[0], color[1], color[2]);
    hsv[1] *= displayState.saturation.value;
    var rgb = new Float32Array(3);
    hsvToRgb(rgb, hsv[0], hsv[1], hsv[2]);
    color[0] = rgb[0];
    color[1] = rgb[1];
    color[2] = rgb[2];
    // Color highlighted segments
    if (displayState.highlightedSegments.has(objectId)) {
        // Make it vivid blue for selection
        color[0] = 0.2;
        color[1] = 0.2;
        color[2] = 2.0;
        color[3] = 1.0;
    }
    color[0] *= alpha;
    color[1] *= alpha;
    color[2] *= alpha;
    return color;
}
var Base = withSharedVisibility(SharedObject);
export var SegmentationLayerSharedObject = function (_Base) {
    _inherits(SegmentationLayerSharedObject, _Base);

    function SegmentationLayerSharedObject(chunkManager, displayState) {
        _classCallCheck(this, SegmentationLayerSharedObject);

        var _this3 = _possibleConstructorReturn(this, (SegmentationLayerSharedObject.__proto__ || _Object$getPrototypeOf(SegmentationLayerSharedObject)).call(this));

        _this3.chunkManager = chunkManager;
        _this3.displayState = displayState;
        return _this3;
    }

    _createClass(SegmentationLayerSharedObject, [{
        key: 'initializeCounterpartWithChunkManager',
        value: function initializeCounterpartWithChunkManager(options) {
            var displayState = this.displayState;

            options['chunkManager'] = this.chunkManager.rpcId;
            options['visibleSegments'] = displayState.visibleSegments.rpcId;
            options['segmentEquivalences'] = displayState.segmentEquivalences.rpcId;
            options['objectToDataTransform'] = this.registerDisposer(SharedWatchableValue.makeFromExisting(this.chunkManager.rpc, this.displayState.objectToDataTransform)).rpcId;
            options['renderScaleTarget'] = this.registerDisposer(SharedWatchableValue.makeFromExisting(this.chunkManager.rpc, this.displayState.renderScaleTarget)).rpcId;
            _get(SegmentationLayerSharedObject.prototype.__proto__ || _Object$getPrototypeOf(SegmentationLayerSharedObject.prototype), 'initializeCounterpart', this).call(this, this.chunkManager.rpc, options);
        }
    }]);

    return SegmentationLayerSharedObject;
}(Base);
//# sourceMappingURL=frontend.js.map