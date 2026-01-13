import _Map from 'babel-runtime/core-js/map';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Number$isInteger from 'babel-runtime/core-js/number/is-integer';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Number$isFinite from 'babel-runtime/core-js/number/is-finite';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Number$isNaN from 'babel-runtime/core-js/number/is-nan';
import _typeof from 'babel-runtime/helpers/typeof';
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
import { vec3 } from './geom';
export function verifyFloat(obj) {
    var t = typeof obj === 'undefined' ? 'undefined' : _typeof(obj);
    if (t === 'number' || t === 'string') {
        var x = parseFloat('' + obj);
        if (!_Number$isNaN(x)) {
            return x;
        }
    }
    throw new Error('Expected floating-point number, but received: ' + _JSON$stringify(obj) + '.');
}
export function verifyFiniteFloat(obj) {
    var x = verifyFloat(obj);
    if (_Number$isFinite(x)) {
        return x;
    }
    throw new Error('Expected finite floating-point number, but received: ' + x + '.');
}
export function verifyFinitePositiveFloat(obj) {
    var x = verifyFiniteFloat(obj);
    if (x > 0) {
        return x;
    }
    throw new Error('Expected positive finite floating-point number, but received: ' + x + '.');
}
export function parseXYZ(out, obj) {
    var validator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : verifyFloat;

    verifyObject(obj);
    out[0] = out[1] = out[2] = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(_Object$keys(obj)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            switch (key) {
                case 'x':
                    out[0] = validator(obj[key]);
                    break;
                case 'y':
                    out[1] = validator(obj[key]);
                    break;
                case 'z':
                    out[2] = validator(obj[key]);
                    break;
                default:
                    throw new Error('Expected object to have keys [\'x\', \'y\', \'z\'], but received: ' + _JSON$stringify(obj) + '.');
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

    return out;
}
export function parseFiniteVec(out, obj) {
    var length = out.length;
    if (!Array.isArray(obj) || obj.length !== length) {
        throw new Error('Incompatible sizes');
    }
    for (var i = 0; i < length; ++i) {
        if (!_Number$isFinite(parseFloat(obj[i]))) {
            throw new Error('Non-finite value.');
        }
    }
    for (var _i = 0; _i < length; ++_i) {
        out[_i] = parseFloat(obj[_i]);
    }
    return out;
}
export function parseIntVec(out, obj) {
    var length = out.length;
    if (!Array.isArray(obj) || obj.length !== length) {
        throw new Error('Incompatible sizes.');
    }
    for (var i = 0; i < length; ++i) {
        var val = parseInt(obj[i], undefined);
        if (!_Number$isInteger(val)) {
            throw new Error('Non-integer value.');
        }
    }
    for (var _i2 = 0; _i2 < length; ++_i2) {
        out[_i2] = parseInt(obj[_i2], undefined);
    }
    return out;
}
/**
 * Returns a JSON representation of x, with object keys sorted to ensure a
 * consistent result.
 */
export function stableStringify(x) {
    if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object') {
        if (x === null) {
            return 'null';
        }
        if (Array.isArray(x)) {
            var _s = '[';
            var _size = x.length;
            var _i3 = 0;
            if (_i3 < _size) {
                _s += stableStringify(x[_i3]);
                while (++_i3 < _size) {
                    _s += ',';
                    _s += stableStringify(x[_i3]);
                }
            }
            _s += ']';
            return _s;
        }
        var s = '{';
        var keys = _Object$keys(x).sort();
        var i = 0;
        var size = keys.length;
        if (i < size) {
            var key = keys[i];
            s += _JSON$stringify(key);
            s += ':';
            s += stableStringify(x[key]);
            while (++i < size) {
                s += ',';
                key = keys[i];
                s += _JSON$stringify(key);
                s += ':';
                s += stableStringify(x[key]);
            }
        }
        s += '}';
        return s;
    }
    return _JSON$stringify(x);
}
function swapQuotes(x) {
    return x.replace(/['"]/g, function (s) {
        return s === '"' ? '\'' : '"';
    });
}
export function urlSafeStringifyString(x) {
    return swapQuotes(_JSON$stringify(swapQuotes(x)));
}
var URL_SAFE_COMMA = '_';
export function urlSafeStringify(x) {
    if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object') {
        if (x === null) {
            return 'null';
        }
        var toJSON = x['toJSON'];
        if (typeof toJSON === 'function') {
            return urlSafeStringify(toJSON.call(x));
        }
        if (Array.isArray(x)) {
            var _s2 = '[';
            var size = x.length;
            var i = 0;
            if (i < size) {
                _s2 += urlSafeStringify(x[i]);
                while (++i < size) {
                    _s2 += URL_SAFE_COMMA;
                    _s2 += urlSafeStringify(x[i]);
                }
            }
            _s2 += ']';
            return _s2;
        }
        var s = '{';
        var keys = _Object$keys(x);
        var first = true;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _getIterator(keys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var key = _step2.value;

                var value = x[key];
                if (value === undefined) {
                    continue;
                }
                var valueString = urlSafeStringify(value);
                if (!valueString) {
                    continue;
                }
                if (!first) {
                    s += URL_SAFE_COMMA;
                } else {
                    first = false;
                }
                s += urlSafeStringifyString(key);
                s += ':';
                s += valueString;
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        s += '}';
        return s;
    }
    if (typeof x === 'string') {
        return urlSafeStringifyString(x);
    }
    return _JSON$stringify(x);
}
var SINGLE_QUOTE_STRING_PATTERN = /('(?:[^'\\]|(?:\\.))*')/;
var DOUBLE_QUOTE_STRING_PATTERN = /("(?:[^'\\]|(?:\\.))*")/;
var SINGLE_OR_DOUBLE_QUOTE_STRING_PATTERN = new RegExp(SINGLE_QUOTE_STRING_PATTERN.source + '|' + DOUBLE_QUOTE_STRING_PATTERN.source);
var DOUBLE_OR_SINGLE_QUOTE_STRING_PATTERN = new RegExp(DOUBLE_QUOTE_STRING_PATTERN.source + '|' + SINGLE_QUOTE_STRING_PATTERN.source);
var DOUBLE_QUOTE_PATTERN = /^((?:[^"'\\]|(?:\\[^']))*)("|\\')/;
var SINGLE_QUOTE_PATTERN = /^((?:[^"'\\]|(?:\\.))*)'/;
function convertStringLiteral(x, quoteInitial, quoteReplace, quoteSearch) {
    if (x.length >= 2 && x.charAt(0) === quoteInitial && x.charAt(x.length - 1) === quoteInitial) {
        var inner = x.substr(1, x.length - 2);
        var s = quoteReplace;
        while (inner.length > 0) {
            var m = inner.match(quoteSearch);
            if (m === null) {
                s += inner;
                break;
            }
            s += m[1];
            if (m[2] === quoteReplace) {
                // We received a single unescaped quoteReplace character.
                s += '\\';
                s += quoteReplace;
            } else {
                // We received "\\" + quoteInitial.  We need to remove the escaping.
                s += quoteInitial;
            }
            inner = inner.substr(m.index + m[0].length);
        }
        s += quoteReplace;
        return s;
    }
    return x;
}
/**
 * Converts a string literal delimited by either single or double quotes into a string literal
 * delimited by double quotes.
 */
export function normalizeStringLiteral(x) {
    return convertStringLiteral(x, '\'', '"', DOUBLE_QUOTE_PATTERN);
}
// quoteChar: des
function convertJsonHelper(x, desiredCommaChar, desiredQuoteChar) {
    var commaSearch = /[&_,]/g;
    var quoteInitial = void 0;
    var quoteSearch = void 0;
    var stringLiteralPattern = void 0;
    if (desiredQuoteChar === '"') {
        quoteInitial = '\'';
        quoteSearch = DOUBLE_QUOTE_PATTERN;
        stringLiteralPattern = SINGLE_OR_DOUBLE_QUOTE_STRING_PATTERN;
    } else {
        quoteInitial = '"';
        quoteSearch = SINGLE_QUOTE_PATTERN;
        stringLiteralPattern = DOUBLE_OR_SINGLE_QUOTE_STRING_PATTERN;
    }
    var s = '';
    while (x.length > 0) {
        var m = x.match(stringLiteralPattern);
        var before = void 0;
        var replacement = void 0;
        if (m === null) {
            before = x;
            x = '';
            replacement = '';
        } else {
            before = x.substr(0, m.index);
            x = x.substr(m.index + m[0].length);
            var originalString = m[1];
            if (originalString !== undefined) {
                replacement = convertStringLiteral(originalString, quoteInitial, desiredQuoteChar, quoteSearch);
            } else {
                replacement = m[2];
            }
        }
        s += before.replace(commaSearch, desiredCommaChar);
        s += replacement;
    }
    return s;
}
export function urlSafeToJSON(x) {
    return convertJsonHelper(x, ',', '"');
}
export function jsonToUrlSafe(x) {
    return convertJsonHelper(x, '_', '\'');
}
export function urlSafeParse(x) {
    return JSON.parse(urlSafeToJSON(x));
}
// Converts a string containing a Python literal into a string containing an equivalent JSON
// literal.
export function pythonLiteralToJSON(x) {
    var s = '';
    while (x.length > 0) {
        var m = x.match(SINGLE_OR_DOUBLE_QUOTE_STRING_PATTERN);
        var before = void 0;
        var replacement = void 0;
        if (m === null) {
            before = x;
            x = '';
            replacement = '';
        } else {
            before = x.substr(0, m.index);
            x = x.substr(m.index + m[0].length);
            var singleQuoteString = m[1];
            if (singleQuoteString !== undefined) {
                replacement = normalizeStringLiteral(singleQuoteString);
            } else {
                replacement = m[2];
            }
        }
        s += before.replace(/\(/g, '[').replace(/\)/g, ']').replace('True', 'true').replace('False', 'false').replace(/,\s*([\}\]])/g, '$1');
        s += replacement;
    }
    return s;
}
// Converts a string containing a Python literal into an equivalent JavaScript value.
export function pythonLiteralParse(x) {
    return JSON.parse(pythonLiteralToJSON(x));
}
// Checks that `x' is an array, maps each element by parseElement.
export function parseArray(x, parseElement) {
    if (!Array.isArray(x)) {
        throw new Error('Expected array, but received: ' + _JSON$stringify(x) + '.');
    }
    return x.map(parseElement);
}
export function parseFixedLengthArray(out, obj, parseElement) {
    var length = out.length;
    if (!Array.isArray(obj) || obj.length !== length) {
        throw new Error('Expected length ' + length + ' array, but received: ' + _JSON$stringify(obj) + '.');
    }
    for (var i = 0; i < length; ++i) {
        out[i] = parseElement(obj[i], i);
    }
    return out;
}
export function verifyObject(obj) {
    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || obj == null || Array.isArray(obj)) {
        throw new Error('Expected JSON object, but received: ' + _JSON$stringify(obj) + '.');
    }
    return obj;
}
export function verifyInt(obj) {
    var result = parseInt(obj, 10);
    if (!_Number$isInteger(result)) {
        throw new Error('Expected integer, but received: ' + _JSON$stringify(obj) + '.');
    }
    return result;
}
export function verifyPositiveInt(obj) {
    var result = verifyInt(obj);
    if (result <= 0) {
        throw new Error('Expected positive integer, but received: ' + result + '.');
    }
    return result;
}
export function verifyMapKey(obj, map) {
    var result = map.get(obj);
    if (result === undefined) {
        throw new Error('Expected one of ' + _JSON$stringify(_Array$from(map.keys())) + ', ' + ('but received: ' + _JSON$stringify(obj) + '.'));
    }
    return result;
}
export function verifyString(obj) {
    if (typeof obj !== 'string') {
        throw new Error('Expected string, but received: ' + _JSON$stringify(obj) + '.');
    }
    return obj;
}
export function verifyOptionalString(obj) {
    if (obj === undefined) {
        return undefined;
    }
    return verifyString(obj);
}
export function verifyOptionalInt(obj) {
    if (obj === undefined) {
        return undefined;
    }
    return verifyInt(obj);
}
export function verifyOptionalBoolean(obj) {
    if (obj === undefined) {
        return undefined;
    }
    if (typeof obj === 'boolean') {
        return obj;
    } else if (obj === 'true') {
        return true;
    } else if (obj === 'false') {
        return false;
    } else {
        throw new Error('Expected string or boolean but received: ' + _JSON$stringify(obj));
    }
}
export function valueOr(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}
export function verifyObjectProperty(obj, propertyName, validator) {
    var value = obj.hasOwnProperty(propertyName) ? obj[propertyName] : undefined;
    try {
        return validator(value);
    } catch (parseError) {
        throw new Error('Error parsing ' + _JSON$stringify(propertyName) + ' property: ' + parseError.message);
    }
}
export function verifyObjectAsMap(obj, validator) {
    verifyObject(obj);
    var map = new _Map();
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(_Object$keys(obj)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var key = _step3.value;

            try {
                map.set(key, validator(obj[key]));
            } catch (parseError) {
                throw new Error('Error parsing value associated with key ' + _JSON$stringify(key) + ': ' + parseError.message);
            }
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return map;
}
export function verifyFloat01(obj) {
    if (typeof obj !== 'number' || !_Number$isFinite(obj) || obj < 0 || obj > 1) {
        throw new Error('Expected floating point number in [0,1], but received: ' + _JSON$stringify(obj) + '.');
    }
    return obj;
}
/**
 * The query string parameters may either be specified in the usual
 * 'name=value&otherName=otherValue' form or as (optionally urlSafe) JSON: '{"name":"value"}`.
 */
export function parseQueryStringParameters(queryString) {
    if (queryString === '') {
        return {};
    }
    if (queryString.startsWith('{')) {
        return urlSafeParse(queryString);
    } else {
        var result = {};
        var parts = queryString.split(/[&;]/);
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = _getIterator(parts), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var part = _step4.value;

                var m = part.match(/^([^=&;]+)=([^&;]*)$/);
                if (m === null) {
                    throw new Error('Invalid query string part: ' + _JSON$stringify(part) + '.');
                }
                result[m[1]] = decodeURIComponent(m[2]);
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        return result;
    }
}
/**
 * Verifies that `obj' is a string that, when converted to uppercase, matches a string property of
 * `enumType`.
 *
 * Note: TypeScript does not seem to allow better typing of the return type.
 *
 * @returns The corresponding numerical value.
 */
export function verifyEnumString(obj, enumType) {
    if (typeof obj === 'string' && obj.match(/^[a-zA-Z]/) !== null) {
        obj = obj.toUpperCase();
        if (enumType.hasOwnProperty(obj)) {
            return enumType[obj];
        }
    }
    throw new Error('Invalid enum value: ' + _JSON$stringify(obj) + '.');
}
export function verify3dVec(obj) {
    return parseFixedLengthArray(vec3.create(), obj, verifyFiniteFloat);
}
export function verify3dScale(obj) {
    return parseFixedLengthArray(vec3.create(), obj, verifyFinitePositiveFloat);
}
export function verify3dDimensions(obj) {
    return parseFixedLengthArray(vec3.create(), obj, verifyPositiveInt);
}
export function verifyStringArray(a) {
    if (!Array.isArray(a)) {
        throw new Error('Expected array, received: ' + _JSON$stringify(a) + '.');
    }
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = _getIterator(a), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var x = _step5.value;

            if (typeof x !== 'string') {
                throw new Error('Expected string, received: ' + _JSON$stringify(x) + '.');
            }
        }
    } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
            }
        } finally {
            if (_didIteratorError5) {
                throw _iteratorError5;
            }
        }
    }

    return a;
}
export function verifyBoolean(x) {
    if (typeof x !== 'boolean') {
        throw new Error('Expected boolean, received: ' + _JSON$stringify(x));
    }
    return x;
}
//# sourceMappingURL=json.js.map