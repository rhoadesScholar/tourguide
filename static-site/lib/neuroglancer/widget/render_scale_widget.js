import _Number$isFinite from 'babel-runtime/core-js/number/is-finite';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Math$sign from 'babel-runtime/core-js/math/sign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Math$log from 'babel-runtime/core-js/math/log2';

import debounce from 'lodash/debounce'; /**
                                         * @license
                                         * Copyright 2019 Google Inc.
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

import throttle from 'lodash/throttle';
import { getRenderScaleFromHistogramOffset, getRenderScaleHistogramOffset, numRenderScaleHistogramBins } from '../render_scale_statistics';
import { WatchableValue } from '../trackable_value';
import { serializeColor } from '../util/color';
import { hsvToRgb } from '../util/colorspace';
import { RefCounted } from '../util/disposable';
import { EventActionMap, registerActionListener } from '../util/event_action_map';
import { vec3 } from '../util/geom';
import { MouseEventBinder } from '../util/mouse_bindings';
import { numberToStringFixed } from '../util/number_to_string';
import { pickLengthUnit } from './scale_bar';
import ResizeObserver from 'resize-observer-polyfill';
var updateInterval = 200;
var inputEventMap = EventActionMap.fromObject({
    'mousedown0': { action: 'set' },
    'wheel': { action: 'adjust-via-wheel' },
    'dblclick0': { action: 'reset' }
});
function formatPixelNumber(x) {
    if (x < 1 || x > 1024) {
        var exponent = _Math$log(x) | 0;
        var coeff = x / Math.pow(2, exponent);
        return numberToStringFixed(coeff, 1) + 'p' + exponent;
    }
    return Math.round(x) + '';
}
export var RenderScaleWidget = function (_RefCounted) {
    _inherits(RenderScaleWidget, _RefCounted);

    function RenderScaleWidget(histogram, target) {
        _classCallCheck(this, RenderScaleWidget);

        var _this = _possibleConstructorReturn(this, (RenderScaleWidget.__proto__ || _Object$getPrototypeOf(RenderScaleWidget)).call(this));

        _this.histogram = histogram;
        _this.target = target;
        _this.label = document.createElement('div');
        _this.element = document.createElement('div');
        _this.canvas = document.createElement('canvas');
        _this.legend = document.createElement('div');
        _this.legendRenderScale = document.createElement('div');
        _this.legendSpatialScale = document.createElement('div');
        _this.legendChunks = document.createElement('div');
        _this.ctx = _this.canvas.getContext('2d');
        _this.hoverTarget = new WatchableValue(undefined);
        _this.throttledUpdateView = _this.registerCancellable(throttle(function () {
            return _this.debouncedUpdateView();
        }, updateInterval, { leading: true, trailing: true }));
        _this.debouncedUpdateView = _this.registerCancellable(debounce(function () {
            return _this.updateView();
        }, 0));
        var canvas = _this.canvas,
            label = _this.label,
            element = _this.element,
            legend = _this.legend,
            legendRenderScale = _this.legendRenderScale,
            legendSpatialScale = _this.legendSpatialScale,
            legendChunks = _this.legendChunks;

        label.className = 'neuroglancer-render-scale-widget-prompt';
        element.className = 'neuroglancer-render-scale-widget';
        element.title = inputEventMap.describe();
        legend.className = 'neuroglancer-render-scale-widget-legend';
        element.appendChild(label);
        element.appendChild(canvas);
        element.appendChild(legend);
        legendRenderScale.title = 'Target resolution of data in screen pixels';
        legendChunks.title = 'Number of chunks rendered';
        legend.appendChild(legendRenderScale);
        legend.appendChild(legendChunks);
        legend.appendChild(legendSpatialScale);
        _this.registerDisposer(histogram.changed.add(_this.throttledUpdateView));
        _this.registerDisposer(histogram.visibility.changed.add(_this.debouncedUpdateView));
        _this.registerDisposer(target.changed.add(_this.debouncedUpdateView));
        _this.registerDisposer(new MouseEventBinder(canvas, inputEventMap));
        _this.registerDisposer(target.changed.add(_this.debouncedUpdateView));
        _this.registerDisposer(_this.hoverTarget.changed.add(_this.debouncedUpdateView));
        var getTargetValue = function getTargetValue(event) {
            var position = event.offsetX / canvas.width * numRenderScaleHistogramBins;
            return getRenderScaleFromHistogramOffset(position);
        };
        _this.registerEventListener(canvas, 'pointermove', function (event) {
            _this.hoverTarget.value = [getTargetValue(event), event.offsetY];
        });
        _this.registerEventListener(canvas, 'pointerleave', function () {
            _this.hoverTarget.value = undefined;
        });
        _this.registerDisposer(registerActionListener(canvas, 'set', function (actionEvent) {
            _this.target.value = getTargetValue(actionEvent.detail);
        }));
        _this.registerDisposer(registerActionListener(canvas, 'adjust-via-wheel', function (actionEvent) {
            var event = actionEvent.detail;
            var deltaY = event.deltaY;

            if (deltaY === 0) {
                return;
            }
            _this.hoverTarget.value = undefined;
            _this.target.value *= Math.pow(2, _Math$sign(deltaY));
            event.preventDefault();
        }));
        _this.registerDisposer(registerActionListener(canvas, 'reset', function (event) {
            _this.hoverTarget.value = undefined;
            _this.target.reset();
            event.preventDefault();
        }));
        var resizeObserver = new ResizeObserver(function () {
            return _this.debouncedUpdateView();
        });
        resizeObserver.observe(canvas);
        _this.registerDisposer(function () {
            return resizeObserver.disconnect();
        });
        _this.updateView();
        return _this;
    }

    _createClass(RenderScaleWidget, [{
        key: 'updateView',
        value: function updateView() {
            var ctx = this.ctx;
            var canvas = this.canvas;

            var width = canvas.width = canvas.offsetWidth;
            var height = canvas.height = canvas.offsetHeight;
            var targetValue = this.target.value;
            var hoverValue = this.hoverTarget.value;
            {
                var legendRenderScale = this.legendRenderScale;

                var value = hoverValue === undefined ? targetValue : hoverValue[0];
                var valueString = formatPixelNumber(value);
                legendRenderScale.textContent = valueString + ' px';
            }
            function binToCanvasX(bin) {
                return bin * width / numRenderScaleHistogramBins;
            }
            ctx.clearRect(0, 0, width, height);
            var histogram = this.histogram;
            // histogram.begin(this.frameNumberCounter.frameNumber);

            var histogramData = histogram.value,
                spatialScales = histogram.spatialScales;

            if (!histogram.visibility.visible) {
                histogramData.fill(0);
            }
            var sortedSpatialScales = _Array$from(spatialScales.keys());
            sortedSpatialScales.sort();
            var tempColor = vec3.create();
            var maxCount = 1;
            var numRows = spatialScales.size;
            var totalPresent = 0,
                totalNotPresent = 0;
            for (var bin = 0; bin < numRenderScaleHistogramBins; ++bin) {
                var count = 0;
                for (var row = 0; row < numRows; ++row) {
                    var index = row * numRenderScaleHistogramBins * 2 + bin;
                    var presentCount = histogramData[index];
                    var notPresentCount = histogramData[index + numRenderScaleHistogramBins];
                    totalPresent += presentCount;
                    totalNotPresent += notPresentCount;
                    count += presentCount + notPresentCount;
                }
                maxCount = Math.max(count, maxCount);
            }
            var maxBarHeight = height;
            var yScale = maxBarHeight / Math.log(1 + maxCount);
            function countToCanvasY(count) {
                return height - Math.log(1 + count) * yScale;
            }
            var hoverSpatialScale = undefined;
            if (hoverValue !== undefined) {
                var i = Math.floor(getRenderScaleHistogramOffset(hoverValue[0]));
                if (i >= 0 && i < numRenderScaleHistogramBins) {
                    var sum = 0;
                    var hoverY = hoverValue[1];
                    for (var spatialScaleIndex = numRows - 1; spatialScaleIndex >= 0; --spatialScaleIndex) {
                        var spatialScale = sortedSpatialScales[spatialScaleIndex];
                        var _row = spatialScales.get(spatialScale);
                        var _index = 2 * _row * numRenderScaleHistogramBins + i;
                        var _count = histogramData[_index] + histogramData[_index + numRenderScaleHistogramBins];
                        if (_count === 0) continue;
                        var yStart = Math.round(countToCanvasY(sum));
                        sum += _count;
                        var yEnd = Math.round(countToCanvasY(sum));
                        if (yEnd <= hoverY && hoverY <= yStart) {
                            hoverSpatialScale = spatialScale;
                            break;
                        }
                    }
                }
            }
            if (hoverSpatialScale !== undefined) {
                totalPresent = 0;
                totalNotPresent = 0;
                var _row2 = spatialScales.get(hoverSpatialScale);
                var baseIndex = 2 * _row2 * numRenderScaleHistogramBins;
                for (var _bin = 0; _bin < numRenderScaleHistogramBins; ++_bin) {
                    var _index2 = baseIndex + _bin;
                    totalPresent += histogramData[_index2];
                    totalNotPresent += histogramData[_index2 + numRenderScaleHistogramBins];
                }
                if (_Number$isFinite(hoverSpatialScale)) {
                    var unit = pickLengthUnit(hoverSpatialScale);
                    this.legendSpatialScale.textContent = numberToStringFixed(hoverSpatialScale / unit.lengthInNanometers, 2) + ' ' + unit.unit;
                } else {
                    this.legendSpatialScale.textContent = 'unknown';
                }
            } else {
                this.legendSpatialScale.textContent = '';
            }
            this.legendChunks.textContent = totalPresent + '/' + (totalPresent + totalNotPresent);
            var spatialScaleColors = sortedSpatialScales.map(function (spatialScale) {
                var saturation = spatialScale === hoverSpatialScale ? 0.5 : 1;
                var hue = void 0;
                if (_Number$isFinite(spatialScale)) {
                    hue = (_Math$log(spatialScale) * 0.1 % 1 + 1) % 1;
                } else {
                    hue = 0;
                }
                hsvToRgb(tempColor, hue, saturation, 1);
                var presentColor = serializeColor(tempColor);
                hsvToRgb(tempColor, hue, saturation, 0.5);
                var notPresentColor = serializeColor(tempColor);
                return [presentColor, notPresentColor];
            });
            for (var _i = 0; _i < numRenderScaleHistogramBins; ++_i) {
                var _sum = 0;
                for (var _spatialScaleIndex = numRows - 1; _spatialScaleIndex >= 0; --_spatialScaleIndex) {
                    var _spatialScale = sortedSpatialScales[_spatialScaleIndex];
                    var _row3 = spatialScales.get(_spatialScale);
                    var _index3 = _row3 * numRenderScaleHistogramBins * 2 + _i;
                    var _presentCount = histogramData[_index3];
                    var _notPresentCount = histogramData[_index3 + numRenderScaleHistogramBins];
                    var _count2 = _presentCount + _notPresentCount;
                    if (_count2 === 0) continue;
                    var xStart = Math.round(binToCanvasX(_i));
                    var xEnd = Math.round(binToCanvasX(_i + 1));
                    var _yStart = Math.round(countToCanvasY(_sum));
                    _sum += _count2;
                    var _yEnd = Math.round(countToCanvasY(_sum));
                    var ySplit = (_presentCount * _yEnd + _notPresentCount * _yStart) / _count2;
                    ctx.fillStyle = spatialScaleColors[_spatialScaleIndex][1];
                    ctx.fillRect(xStart, _yEnd, xEnd - xStart, ySplit - _yEnd);
                    ctx.fillStyle = spatialScaleColors[_spatialScaleIndex][0];
                    ctx.fillRect(xStart, ySplit, xEnd - xStart, _yStart - ySplit);
                }
            }
            {
                var _value = targetValue;
                ctx.fillStyle = '#fff';
                var startOffset = binToCanvasX(getRenderScaleHistogramOffset(_value));
                var lineWidth = 1;
                ctx.fillRect(Math.floor(startOffset), 0, lineWidth, height);
            }
            if (hoverValue !== undefined) {
                var _value2 = hoverValue[0];
                ctx.fillStyle = '#888';
                var _startOffset = binToCanvasX(getRenderScaleHistogramOffset(_value2));
                var _lineWidth = 1;
                ctx.fillRect(Math.floor(_startOffset), 0, _lineWidth, height);
            }
        }
    }]);

    return RenderScaleWidget;
}(RefCounted);
//# sourceMappingURL=render_scale_widget.js.map