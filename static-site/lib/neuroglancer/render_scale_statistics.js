import _Map from 'babel-runtime/core-js/map';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _Math$log from 'babel-runtime/core-js/math/log2';
/**
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
import { TrackableValue } from './trackable_value';
import { verifyFinitePositiveFloat } from './util/json';
import { VisibilityPriorityAggregator } from './visibility_priority/frontend';
import { NullarySignal } from './util/signal';
export var numRenderScaleHistogramBins = 40;
export var renderScaleHistogramBinSize = 0.5;
export var renderScaleHistogramOrigin = -4;
export function getRenderScaleHistogramOffset(renderScale) {
    return (_Math$log(renderScale) - renderScaleHistogramOrigin) / renderScaleHistogramBinSize;
}
export function getRenderScaleFromHistogramOffset(offset) {
    return Math.pow(2, offset * renderScaleHistogramBinSize + renderScaleHistogramOrigin);
}
export function trackableRenderScaleTarget(initialValue) {
    return new TrackableValue(initialValue, verifyFinitePositiveFloat);
}
export var RenderScaleHistogram = function () {
    function RenderScaleHistogram() {
        _classCallCheck(this, RenderScaleHistogram);

        this.visibility = new VisibilityPriorityAggregator();
        this.changed = new NullarySignal();
        /**
         * Frame number corresponding to the current histogram.
         */
        this.frameNumber = -1;
        /**
         * Maps from spatial scale (nanometers) to histogram row index in the range
         * `[0, spatialScales.size)`.
         */
        this.spatialScales = new _Map();
        /**
         * Current number of rows allocated for the histogram.
         */
        this.numHistogramRows = 1;
        /**
         * Initially allocate one row.
         */
        this.value = new Uint32Array(numRenderScaleHistogramBins * this.numHistogramRows * 2);
    }

    _createClass(RenderScaleHistogram, [{
        key: 'begin',
        value: function begin(frameNumber) {
            if (frameNumber !== this.frameNumber) {
                this.value.fill(0);
                this.frameNumber = frameNumber;
                this.spatialScales.clear();
                this.changed.dispatch();
            }
        }
        /**
         * Adds a count to the histogram.
         *
         * @param spatialScale Spatial resolution of data in nanometers.
         * @param renderScale Rendered scale of data in screen pixels.
         * @param presentCount Number of present chunks.
         * @param notPresentCount Number of desired but not-present chunks.
         */

    }, {
        key: 'add',
        value: function add(spatialScale, renderScale, presentCount, notPresentCount) {
            var spatialScales = this.spatialScales,
                numHistogramRows = this.numHistogramRows,
                value = this.value;

            var spatialScaleIndex = spatialScales.get(spatialScale);
            if (spatialScaleIndex === undefined) {
                spatialScaleIndex = spatialScales.size;
                spatialScales.set(spatialScale, spatialScaleIndex);
            }
            if (spatialScaleIndex >= numHistogramRows) {
                this.numHistogramRows = numHistogramRows *= 2;
                var newValue = new Uint32Array(numHistogramRows * numRenderScaleHistogramBins * 2);
                newValue.set(value);
                this.value = value = newValue;
            }
            var index = spatialScaleIndex * numRenderScaleHistogramBins * 2 + Math.min(Math.max(0, Math.round(getRenderScaleHistogramOffset(renderScale))), numRenderScaleHistogramBins - 1);
            value[index] += presentCount;
            value[index + numRenderScaleHistogramBins] += notPresentCount;
        }
    }]);

    return RenderScaleHistogram;
}();
//# sourceMappingURL=render_scale_statistics.js.map