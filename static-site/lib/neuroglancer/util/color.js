import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
/**
 * @file Facilities for converting between strings and RGB/RGBA colors.
 */
import { WatchableValue } from '../trackable_value';
import { float32ToString } from './float32_to_string';
import { vec3, vec4 } from './geom';
import { hexEncodeByte } from './hex';
/**
 * Parse the serialization of a color.
 *
 * This is based on the definition here:
 * https://html.spec.whatwg.org/multipage/canvas.html#serialisation-of-a-color
 */
export function parseColorSerialization(x) {
    var rgbaPattern = /^rgba\(([0-9]+), ([0-9]+), ([0-9]+), (0(?:\.[0-9]+)?)\)$/;
    {
        var m = x.match(rgbaPattern);
        if (m !== null) {
            return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), parseFloat(m[4])];
        }
    }
    var hexPattern = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/;
    {
        var _m = x.match(hexPattern);
        if (_m !== null) {
            return [parseInt(_m[1], 16), parseInt(_m[2], 16), parseInt(_m[3], 16), 1.0];
        }
    }
    throw new Error('Invalid serialized color: ' + _JSON$stringify(x) + '.');
}
export function parseRGBAColorSpecification(x) {
    try {
        if (typeof x !== 'string') {
            throw new Error('Expected string, but received ' + _JSON$stringify(x) + '.');
        }
        var context = document.createElement('canvas').getContext('2d');
        context.fillStyle = x;
        var result = parseColorSerialization(context.fillStyle);
        return vec4.fromValues(result[0] / 255, result[1] / 255, result[2] / 255, result[3]);
    } catch (parseError) {
        throw new Error('Failed to parse color specification: ' + parseError.message);
    }
}
export function parseRGBColorSpecification(x) {
    var result = parseRGBAColorSpecification(x);
    return result.subarray(0, 3);
}
/**
 * Returns an integer formed by concatenating the channels of the input color vector.
 * Each channel is clamped to the range [0.0, 1.0] before being converted to 8 bits.
 * An RGB color is packed into 24 bits, and a RGBA into 32 bits.
 */
export function packColor(x) {
    var size = x[3] === undefined ? 3 : 4;
    var result = 0;
    for (var i = 0; i < size; i++) {
        // The ">>> 0" ensures an unsigned value.
        result = (result << 8 >>> 0) + Math.min(255, Math.max(0, Math.round(x[i] * 255)));
    }
    return result;
}
export function serializeColor(x) {
    if (x[3] === undefined || x[3] === 1) {
        var result = '#';
        for (var i = 0; i < 3; ++i) {
            result += hexEncodeByte(Math.min(255, Math.max(0, Math.round(x[i] * 255))));
        }
        return result;
    } else {
        var _result = 'rgba(';
        for (var _i = 0; _i < 3; ++_i) {
            if (_i !== 0) {
                _result += ', ';
            }
            _result += Math.min(255, Math.max(0, Math.round(x[_i] * 255)));
        }
        _result += ', ' + float32ToString(x[3]) + ')';
        return _result;
    }
}
export var TrackableRGB = function (_WatchableValue) {
    _inherits(TrackableRGB, _WatchableValue);

    function TrackableRGB(defaultValue) {
        _classCallCheck(this, TrackableRGB);

        var _this = _possibleConstructorReturn(this, (TrackableRGB.__proto__ || _Object$getPrototypeOf(TrackableRGB)).call(this, vec3.clone(defaultValue)));

        _this.defaultValue = defaultValue;
        return _this;
    }

    _createClass(TrackableRGB, [{
        key: 'toString',
        value: function toString() {
            return serializeColor(this.value);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            if (vec3.equals(this.value, this.defaultValue)) {
                return undefined;
            } else {
                return serializeColor(this.value);
            }
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = vec3.clone(this.defaultValue);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            if (x === undefined) {
                this.reset();
                return;
            }
            var value = this.value;

            var newValue = parseRGBColorSpecification(x);
            if (!vec3.equals(value, newValue)) {
                this.value = newValue;
            }
        }
    }]);

    return TrackableRGB;
}(WatchableValue);
//# sourceMappingURL=color.js.map