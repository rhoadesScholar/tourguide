import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Math$imul from 'babel-runtime/core-js/math/imul';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _Math$log from 'babel-runtime/core-js/math/log2';
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
var randomTempBuffer = new Uint32Array(2);
var trueBase = 0x100000000;
var stringConversionData = [];
for (var base = 2; base <= 36; ++base) {
    var lowDigits = Math.floor(32 / _Math$log(base));
    var lowBase = Math.pow(base, lowDigits);
    var patternString = '^[0-' + String.fromCharCode('0'.charCodeAt(0) + Math.min(9, base - 1));
    if (base > 10) {
        patternString += 'a-' + String.fromCharCode('a'.charCodeAt(0) + base - 11);
        patternString += 'A-' + String.fromCharCode('A'.charCodeAt(0) + base - 11);
    }
    var maxDigits = Math.ceil(64 / _Math$log(base));
    patternString += ']{1,' + maxDigits + '}$';
    var pattern = new RegExp(patternString);
    stringConversionData[base] = { lowDigits: lowDigits, lowBase: lowBase, pattern: pattern };
}
/**
 * Returns the high 32 bits of the result of the 32-bit integer multiply `a` and `b`.
 *
 * The low 32-bits can be obtained using the built-in `Math.imul` function.
 */
function uint32MultiplyHigh(a, b) {
    a >>>= 0;
    b >>>= 0;
    var a00 = a & 0xFFFF,
        a16 = a >>> 16;
    var b00 = b & 0xFFFF,
        b16 = b >>> 16;
    var c00 = a00 * b00;
    var c16 = (c00 >>> 16) + a16 * b00;
    var c32 = c16 >>> 16;
    c16 = (c16 & 0xFFFF) + a00 * b16;
    c32 += c16 >>> 16;
    var c48 = c32 >>> 16;
    c32 = (c32 & 0xFFFF) + a16 * b16;
    c48 += c32 >>> 16;
    return ((c48 & 0xFFFF) << 16 | c32 & 0xFFFF) >>> 0;
}
export var Uint64 = function () {
    function Uint64() {
        var low = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var high = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        _classCallCheck(this, Uint64);

        this.low = low;
        this.high = high;
    }

    _createClass(Uint64, [{
        key: 'clone',
        value: function clone() {
            return new Uint64(this.low, this.high);
        }
    }, {
        key: 'assign',
        value: function assign(x) {
            this.low = x.low;
            this.high = x.high;
        }
    }, {
        key: 'toString',
        value: function toString() {
            var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;

            var vLow = this.low,
                vHigh = this.high;
            if (vHigh === 0) {
                return vLow.toString(base);
            }
            vHigh *= trueBase;
            var _stringConversionData = stringConversionData[base],
                lowBase = _stringConversionData.lowBase,
                lowDigits = _stringConversionData.lowDigits;

            var vHighExtra = vHigh % lowBase;
            vHigh = Math.floor(vHigh / lowBase);
            vLow += vHighExtra;
            vHigh += Math.floor(vLow / lowBase);
            vLow = vLow % lowBase;
            var vLowStr = vLow.toString(base);
            return vHigh.toString(base) + '0'.repeat(lowDigits - vLowStr.length) + vLowStr;
        }
        /**
         * Returns true if a is strictly less than b.
         */

    }, {
        key: 'tryParseString',
        value: function tryParseString(s) {
            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
            var _stringConversionData2 = stringConversionData[base],
                lowDigits = _stringConversionData2.lowDigits,
                lowBase = _stringConversionData2.lowBase,
                pattern = _stringConversionData2.pattern;

            if (!pattern.test(s)) {
                return false;
            }
            if (s.length <= lowDigits) {
                this.low = parseInt(s, base);
                this.high = 0;
                return true;
            }
            var splitPoint = s.length - lowDigits;
            var lowPrime = parseInt(s.substr(splitPoint), base);
            var highPrime = parseInt(s.substr(0, splitPoint), base);
            var high = void 0,
                low = void 0;
            if (lowBase === trueBase) {
                high = highPrime;
                low = lowPrime;
            } else {
                var highRemainder = _Math$imul(highPrime, lowBase) >>> 0;
                high = uint32MultiplyHigh(highPrime, lowBase) + (_Math$imul(Math.floor(highPrime / trueBase), lowBase) >>> 0);
                low = lowPrime + highRemainder;
                if (low >= trueBase) {
                    ++high;
                    low -= trueBase;
                }
            }
            if (low >>> 0 !== low || high >>> 0 !== high) {
                return false;
            }
            this.low = low;
            this.high = high;
            return true;
        }
    }, {
        key: 'parseString',
        value: function parseString(s) {
            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

            if (!this.tryParseString(s, base)) {
                throw new Error('Failed to parse string as uint64 value: ' + _JSON$stringify(s) + '.');
            }
            return this;
        }
    }, {
        key: 'valid',
        value: function valid() {
            var low = this.low,
                high = this.high;

            return low >>> 0 === low && high >>> 0 === high;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.toString();
        }
    }], [{
        key: 'less',
        value: function less(a, b) {
            return a.high < b.high || a.high === b.high && a.low < b.low;
        }
        /**
         * Returns a negative number if a is strictly less than b, 0 if a is equal to b, or a positive
         * number if a is strictly greater than b.
         */

    }, {
        key: 'compare',
        value: function compare(a, b) {
            return a.high - b.high || a.low - b.low;
        }
    }, {
        key: 'equal',
        value: function equal(a, b) {
            return a.low === b.low && a.high === b.high;
        }
    }, {
        key: 'min',
        value: function min(a, b) {
            return Uint64.less(a, b) ? a : b;
        }
    }, {
        key: 'max',
        value: function max(a, b) {
            return Uint64.less(a, b) ? b : a;
        }
    }, {
        key: 'random',
        value: function random() {
            crypto.getRandomValues(randomTempBuffer);
            return new Uint64(randomTempBuffer[0], randomTempBuffer[1]);
        }
    }, {
        key: 'parseString',
        value: function parseString(s) {
            var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

            var x = new Uint64();
            return x.parseString(s, base);
        }
    }, {
        key: 'lshift',
        value: function lshift(out, input, bits) {
            var low = input.low,
                high = input.high;

            if (bits === 0) {
                out.low = low;
                out.high = high;
            } else if (bits < 32) {
                out.low = low << bits;
                out.high = high << bits | low >>> 32 - bits;
            } else {
                out.low = 0;
                out.high = low << bits - 32;
            }
            return out;
        }
    }, {
        key: 'rshift',
        value: function rshift(out, input, bits) {
            var low = input.low,
                high = input.high;

            if (bits === 0) {
                out.low = low;
                out.high = high;
            } else if (bits < 32) {
                out.low = low >>> bits | high << 32 - bits;
                out.high = high >>> bits;
            } else {
                out.low = high >>> bits - 32;
                out.high = 0;
            }
            return out;
        }
    }, {
        key: 'or',
        value: function or(out, a, b) {
            out.low = a.low | b.low;
            out.high = a.high | b.high;
            return out;
        }
    }, {
        key: 'xor',
        value: function xor(out, a, b) {
            out.low = a.low ^ b.low;
            out.high = a.high ^ b.high;
            return out;
        }
    }, {
        key: 'and',
        value: function and(out, a, b) {
            out.low = a.low & b.low;
            out.high = a.high & b.high;
            return out;
        }
    }, {
        key: 'add',
        value: function add(out, a, b) {
            var lowSum = a.low + b.low;
            var highSum = a.high + b.high;
            var low = lowSum >>> 0;
            if (low !== lowSum) highSum += 1;
            out.low = low;
            out.high = highSum >>> 0;
            return out;
        }
    }, {
        key: 'addUint32',
        value: function addUint32(out, a, b) {
            var lowSum = a.low + b;
            var highSum = a.high;
            var low = lowSum >>> 0;
            if (low !== lowSum) highSum += 1;
            out.low = low;
            out.high = highSum >>> 0;
            return out;
        }
    }, {
        key: 'decrement',
        value: function decrement(out, input) {
            var low = input.low,
                high = input.high;

            if (low === 0) {
                high -= 1;
            }
            out.low = low - 1 >>> 0;
            out.high = high >>> 0;
            return out;
        }
    }, {
        key: 'increment',
        value: function increment(out, input) {
            var low = input.low,
                high = input.high;

            if (low === 0xFFFFFFFF) high += 1;
            out.low = low + 1 >>> 0;
            out.high = high >>> 0;
            return out;
        }
    }, {
        key: 'subtract',
        value: function subtract(out, a, b) {
            var lowSum = a.low - b.low;
            var highSum = a.high - b.high;
            var low = lowSum >>> 0;
            if (low !== lowSum) highSum -= 1;
            out.low = low;
            out.high = highSum >>> 0;
            return out;
        }
    }, {
        key: 'multiplyUint32',
        value: function multiplyUint32(out, a, b) {
            var low = a.low,
                high = a.high;

            out.low = _Math$imul(low, b) >>> 0;
            out.high = _Math$imul(high, b) + uint32MultiplyHigh(low, b) >>> 0;
            return out;
        }
    }, {
        key: 'lowMask',
        value: function lowMask(out, bits) {
            if (bits <= 32) {
                out.high = 0;
                out.low = 0xffffffff >>> 32 - bits;
            } else {
                out.high = 0xffffffff >>> bits - 32;
                out.low = 0xffffffff;
            }
            return out;
        }
    }]);

    return Uint64;
}();
Uint64.ZERO = new Uint64(0, 0);
Uint64.ONE = new Uint64(1, 0);
//# sourceMappingURL=uint64.js.map