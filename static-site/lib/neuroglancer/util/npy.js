import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
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
import { DataType } from './data_type';
import { convertEndian16, convertEndian32, Endianness } from './endian';
import { pythonLiteralParse } from './json';
var supportedDataTypes = new _Map();
supportedDataTypes.set('|u1', {
    arrayConstructor: Uint8Array,
    fixEndianness: function fixEndianness() {},
    javascriptElementsPerArrayElement: 1,
    elementBytes: 1,
    dataType: DataType.UINT8
});
supportedDataTypes.set('|i1', {
    arrayConstructor: Uint8Array,
    fixEndianness: function fixEndianness() {},
    javascriptElementsPerArrayElement: 1,
    elementBytes: 1,
    dataType: DataType.UINT8
});

var _loop = function _loop(endiannessChar, endianness) {
    // For now, treat both signed and unsigned integer types as unsigned.
    var _arr2 = ['u', 'i'];
    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var typeChar = _arr2[_i2];
        supportedDataTypes.set('' + endiannessChar + typeChar + '2', {
            arrayConstructor: Uint16Array,
            elementBytes: 2,
            fixEndianness: function fixEndianness(array) {
                convertEndian16(array, endianness);
            },
            javascriptElementsPerArrayElement: 1,
            dataType: DataType.UINT16
        });
        supportedDataTypes.set('' + endiannessChar + typeChar + '4', {
            arrayConstructor: Uint32Array,
            elementBytes: 4,
            fixEndianness: function fixEndianness(array) {
                convertEndian32(array, endianness);
            },
            javascriptElementsPerArrayElement: 1,
            dataType: DataType.UINT32
        });
        supportedDataTypes.set('' + endiannessChar + typeChar + '8', {
            arrayConstructor: Uint32Array,
            elementBytes: 8,
            // We still maintain the low 32-bit value first.
            fixEndianness: function fixEndianness(array) {
                convertEndian32(array, endianness);
            },
            javascriptElementsPerArrayElement: 2,
            dataType: DataType.UINT64
        });
    }
    supportedDataTypes.set(endiannessChar + 'f4', {
        arrayConstructor: Float32Array,
        elementBytes: 4,
        fixEndianness: function fixEndianness(array) {
            convertEndian32(array, endianness);
        },
        javascriptElementsPerArrayElement: 1,
        dataType: DataType.FLOAT32
    });
};

var _arr = [['<', Endianness.LITTLE], ['>', Endianness.BIG]];
for (var _i = 0; _i < _arr.length; _i++) {
    var _ref = _arr[_i];

    var _ref2 = _slicedToArray(_ref, 2);

    var endiannessChar = _ref2[0];
    var endianness = _ref2[1];

    _loop(endiannessChar, endianness);
}
export var NumpyArray = function NumpyArray(data, shape, dataType, fortranOrder) {
    _classCallCheck(this, NumpyArray);

    this.data = data;
    this.shape = shape;
    this.dataType = dataType;
    this.fortranOrder = fortranOrder;
};
export function parseNpy(x) {
    // Verify 6-byte magic sequence: 147, 78, 85, 77, 80, 89
    if (x[0] !== 147 || x[1] !== 78 || x[2] !== 85 || x[3] !== 77 || x[4] !== 80 || x[5] !== 89) {
        throw new Error('Data does not match npy format.');
    }
    var majorVersion = x[6],
        minorVersion = x[7];
    if (majorVersion !== 1 || minorVersion !== 0) {
        throw new Error('Unsupported npy version ' + majorVersion + '.' + minorVersion);
    }
    var dv = new DataView(x.buffer, x.byteOffset, x.byteLength);
    var headerLength = dv.getUint16(8, /*littleEndian=*/true);
    var header = new TextDecoder('utf-8').decode(x.subarray(10, headerLength + 10));
    var headerObject = void 0;
    var dataOffset = headerLength + 10;
    try {
        headerObject = pythonLiteralParse(header);
    } catch (e) {
        throw new Error('Failed to parse npy header: ' + e);
    }
    var dtype = headerObject['descr'];
    var shape = headerObject['shape'];
    var numElements = 1;
    if (!Array.isArray(shape)) {
        throw new Error('Invalid shape ${JSON.stringify(shape)}');
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(shape), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var dim = _step.value;

            if (typeof dim !== 'number') {
                throw new Error('Invalid shape ${JSON.stringify(shape)}');
            }
            numElements *= dim;
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

    var supportedDataType = supportedDataTypes.get(dtype);
    if (supportedDataType === undefined) {
        throw new Error('Unsupported numpy data type ' + _JSON$stringify(dtype));
    }
    var arrayConstructor = supportedDataType.arrayConstructor,
        javascriptElementsPerArrayElement = supportedDataType.javascriptElementsPerArrayElement;

    var javascriptElements = javascriptElementsPerArrayElement * numElements;
    var totalDataBytes = arrayConstructor.BYTES_PER_ELEMENT * javascriptElements;
    if (totalDataBytes + dataOffset !== x.byteLength) {
        throw new Error('Expected length does not match length of data');
    }
    var data = new arrayConstructor(x.buffer, x.byteOffset + dataOffset, javascriptElements);
    supportedDataType.fixEndianness(data);
    return new NumpyArray(data, shape, supportedDataType, headerObject['fortran_order'] === true);
}
//# sourceMappingURL=npy.js.map