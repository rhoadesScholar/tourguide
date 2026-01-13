import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
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
/**
 * Facility for drawing a scale bar to indicate pixel size in physical length
 * units.
 *
 * The physical length with which the scale bar is labeled will be of the form:
 *
 *   significand * 10^exponent
 *
 * Any exponent may be used, but the significand in the range [1, 10] will be
 * equal to one of a
 * discrete set of allowed significand values, in order to ensure that the scale
 * bar is easy to
 * understand.
 */
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { verifyFloat, verifyObjectProperty, verifyString } from '../util/json';
import { setTextureFromCanvas } from '../webgl/texture';
/**
 * Default set of allowed significand values.  1 is implicitly part of the set.
 */
var DEFAULT_ALLOWED_SIGNIFICANDS = [1.5, 2, 3, 5, 7.5, 10];
export var ALLOWED_UNITS = [{ unit: 'km', lengthInNanometers: 1e12 }, { unit: 'm', lengthInNanometers: 1e9 }, { unit: 'mm', lengthInNanometers: 1e6 }, { unit: 'µm', lengthInNanometers: 1e3 }, { unit: 'nm', lengthInNanometers: 1 }, { unit: 'pm', lengthInNanometers: 1e-3 }];
export function pickLengthUnit(lengthInNanometers) {
    var numAllowedUnits = ALLOWED_UNITS.length;
    var unit = ALLOWED_UNITS[numAllowedUnits - 1];
    for (var i = 0; i < numAllowedUnits; ++i) {
        var allowedUnit = ALLOWED_UNITS[i];
        if (lengthInNanometers >= allowedUnit.lengthInNanometers) {
            unit = allowedUnit;
            break;
        }
    }
    return unit;
}
export function pickVolumeUnit(volumeInCubicNanometers) {
    var numAllowedUnits = ALLOWED_UNITS.length;
    var unit = ALLOWED_UNITS[numAllowedUnits - 1];
    for (var i = 0; i < numAllowedUnits; ++i) {
        var allowedUnit = ALLOWED_UNITS[i];
        if (volumeInCubicNanometers >= Math.pow(allowedUnit.lengthInNanometers, 3)) {
            unit = allowedUnit;
            break;
        }
    }
    return unit;
}
export var ScaleBarDimensions = function () {
    function ScaleBarDimensions() {
        _classCallCheck(this, ScaleBarDimensions);

        /**
         * Allowed significand values.  1 is not included, but is always considered
         * part of the set.
         */
        this.allowedSignificands = DEFAULT_ALLOWED_SIGNIFICANDS;
        /**
         * The target length in pixels.  The closest
         */
        this.targetLengthInPixels = 0;
        /**
         * Pixel size in nanometers.
         */
        this.nanometersPerPixel = 0;
        this.prevNanometersPerPixel = 0;
        this.prevTargetLengthInPixels = 0;
    }
    /**
     * Updates physicalLength, physicalUnit, and lengthInPixels to be the optimal
     * values corresponding
     * to targetLengthInPixels and nanometersPerPixel.
     *
     * @returns true if the scale bar has changed, false if it is unchanged.
     */


    _createClass(ScaleBarDimensions, [{
        key: 'update',
        value: function update() {
            var nanometersPerPixel = this.nanometersPerPixel,
                targetLengthInPixels = this.targetLengthInPixels;

            if (this.prevNanometersPerPixel === nanometersPerPixel && this.prevTargetLengthInPixels === targetLengthInPixels) {
                return false;
            }
            this.prevNanometersPerPixel = nanometersPerPixel;
            this.prevTargetLengthInPixels = targetLengthInPixels;
            var targetNanometers = targetLengthInPixels * nanometersPerPixel;
            var exponent = Math.floor(Math.log(targetNanometers) / Math.LN10);
            var tenToThePowerExponent = Math.pow(10, exponent);
            var targetSignificand = targetNanometers / tenToThePowerExponent;
            // Determine significand value in this.allowedSignificands that is closest
            // to targetSignificand.
            var bestSignificand = 1;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.allowedSignificands), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var allowedSignificand = _step.value;

                    if (Math.abs(allowedSignificand - targetSignificand) < Math.abs(bestSignificand - targetSignificand)) {
                        bestSignificand = allowedSignificand;
                    } else {
                        // If distance did not decrease, then it can only increase from here.
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            var physicalNanometers = bestSignificand * tenToThePowerExponent;
            var unit = pickLengthUnit(physicalNanometers);
            this.lengthInPixels = Math.round(physicalNanometers / nanometersPerPixel);
            this.physicalUnit = unit.unit;
            this.physicalLength = physicalNanometers / unit.lengthInNanometers;
            return true;
        }
    }]);

    return ScaleBarDimensions;
}();
function makeScaleBarTexture(dimensions, gl, texture) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultScaleBarTextureOptions;

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var textHeight = options.textHeightInPixels * options.scaleFactor;
    var font = 'bold ' + textHeight + 'px ' + options.fontName;
    ctx.font = font;
    ctx.fillStyle = 'white';
    var text = dimensions.physicalLength + ' ' + dimensions.physicalUnit;
    var textMetrics = ctx.measureText(text);
    var innerWidth = Math.max(dimensions.lengthInPixels, textMetrics.width);
    var barHeight = options.barHeightInPixels * options.scaleFactor;
    var barTopMargin = options.barTopMarginInPixels * options.scaleFactor;
    var innerHeight = barHeight + barTopMargin + textHeight;
    var padding = options.paddingInPixels * options.scaleFactor;
    var totalHeight = innerHeight + 2 * padding;
    var totalWidth = innerWidth + 2 * padding;
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(text, totalWidth / 2, totalHeight - padding - barHeight - barTopMargin);
    ctx.fillRect(padding, totalHeight - padding - barHeight, dimensions.lengthInPixels, barHeight);
    setTextureFromCanvas(gl, texture, canvas);
    return { width: totalWidth, height: totalHeight };
}
export var ScaleBarTexture = function (_RefCounted) {
    _inherits(ScaleBarTexture, _RefCounted);

    function ScaleBarTexture(gl) {
        var dimensions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new ScaleBarDimensions();

        _classCallCheck(this, ScaleBarTexture);

        var _this = _possibleConstructorReturn(this, (ScaleBarTexture.__proto__ || _Object$getPrototypeOf(ScaleBarTexture)).call(this));

        _this.gl = gl;
        _this.dimensions = dimensions;
        _this.texture = null;
        _this.width = 0;
        _this.height = 0;
        _this.priorOptions = undefined;
        return _this;
    }

    _createClass(ScaleBarTexture, [{
        key: 'update',
        value: function update(options) {
            var dimensions = this.dimensions;
            var texture = this.texture;

            if (!dimensions.update() && texture !== null && options === this.priorOptions) {
                return;
            }
            if (texture === null) {
                texture = this.texture = this.gl.createTexture();
            }

            var _makeScaleBarTexture = makeScaleBarTexture(dimensions, this.gl, texture, options),
                width = _makeScaleBarTexture.width,
                height = _makeScaleBarTexture.height;

            this.priorOptions = options;
            this.width = width;
            this.height = height;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
            _get(ScaleBarTexture.prototype.__proto__ || _Object$getPrototypeOf(ScaleBarTexture.prototype), 'disposed', this).call(this);
        }
    }]);

    return ScaleBarTexture;
}(RefCounted);
export var defaultScaleBarTextureOptions = {
    scaleFactor: 1,
    textHeightInPixels: 15,
    barHeightInPixels: 8,
    barTopMarginInPixels: 5,
    fontName: 'sans-serif',
    paddingInPixels: 2
};
export var defaultScaleBarOptions = _Object$assign({}, defaultScaleBarTextureOptions, { maxWidthInPixels: 100, maxWidthFraction: 0.25, leftPixelOffset: 10, bottomPixelOffset: 10 });
function parseScaleBarOptions(obj) {
    var result = _Object$assign({}, defaultScaleBarOptions);

    var _loop = function _loop(k) {
        verifyObjectProperty(obj, k, function (x) {
            if (x !== undefined) {
                result[k] = verifyFloat(x);
            }
        });
    };

    var _arr = ['textHeightInPixels', 'barTopMarginInPixels', 'barHeightInPixels', 'paddingInPixels', 'scaleFactor', 'maxWidthInPixels', 'maxWidthFraction', 'leftPixelOffset', 'bottomPixelOffset'];
    for (var _i = 0; _i < _arr.length; _i++) {
        var k = _arr[_i];
        _loop(k);
    }
    verifyObjectProperty(obj, 'fontName', function (x) {
        if (x !== undefined) {
            result.fontName = verifyString(x);
        }
    });
    return result;
}
export var TrackableScaleBarOptions = function (_TrackableValue) {
    _inherits(TrackableScaleBarOptions, _TrackableValue);

    function TrackableScaleBarOptions() {
        _classCallCheck(this, TrackableScaleBarOptions);

        return _possibleConstructorReturn(this, (TrackableScaleBarOptions.__proto__ || _Object$getPrototypeOf(TrackableScaleBarOptions)).call(this, defaultScaleBarOptions, parseScaleBarOptions));
    }

    return TrackableScaleBarOptions;
}(TrackableValue);
//# sourceMappingURL=scale_bar.js.map