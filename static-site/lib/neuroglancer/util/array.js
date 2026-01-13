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
 * Partitions array[start:end] such that all elements for which predicate
 * returns true are before the elements for which predicate returns false.
 *
 * predicate will be called exactly once for each element in array[start:end],
 * in order.
 *
 * @returns {number} The index of the first element for which predicate returns
 * false, or end if there is no such element.
 */
export function partitionArray(array, start, end, predicate) {
    while (start < end) {
        var x = array[start];
        if (predicate(x)) {
            ++start;
            continue;
        }
        --end;
        array[start] = array[end];
        array[end] = x;
    }
    return end;
}
/**
 * Returns an array of size newSize that starts with the contents of array.
 * Either returns array if it has the correct size, or a new array with zero
 * padding at the end.
 */
export function maybePadArray(array, newSize) {
    if (array.length === newSize) {
        return array;
    }
    var newArray = new array.constructor(newSize);
    newArray.set(array);
    return newArray;
}
export function getFortranOrderStrides(size) {
    var baseStride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

    var length = size.length;
    var strides = new Array(length);
    var stride = strides[0] = baseStride;
    for (var i = 1; i < length; ++i) {
        stride *= size[i - 1];
        strides[i] = stride;
    }
    return strides;
}
/**
 * Converts an array of shape [majorSize, minorSize] to
 * [minorSize, majorSize].
 */
export function transposeArray2d(array, majorSize, minorSize) {
    var transpose = new array.constructor(array.length);
    for (var i = 0; i < majorSize * minorSize; i += minorSize) {
        for (var j = 0; j < minorSize; j++) {
            var index = i / minorSize;
            transpose[j * majorSize + index] = array[i + j];
        }
    }
    return transpose;
}
export function tile2dArray(array, majorDimension, minorTiles, majorTiles) {
    var minorDimension = array.length / majorDimension;
    var length = array.length * minorTiles * majorTiles;
    var result = new array.constructor(length);
    var minorTileStride = array.length * majorTiles;
    var majorTileStride = majorDimension;
    var minorStride = majorDimension * majorTiles;
    for (var minor = 0; minor < minorDimension; ++minor) {
        for (var major = 0; major < majorDimension; ++major) {
            var inputValue = array[minor * majorDimension + major];
            var baseOffset = minor * minorStride + major;
            for (var minorTile = 0; minorTile < minorTiles; ++minorTile) {
                for (var majorTile = 0; majorTile < majorTiles; ++majorTile) {
                    result[minorTile * minorTileStride + majorTile * majorTileStride + baseOffset] = inputValue;
                }
            }
        }
    }
    return result;
}
export function binarySearch(haystack, needle, compare) {
    var low = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var high = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : haystack.length;

    while (low < high) {
        var mid = low + high - 1 >> 1;
        var compareResult = compare(needle, haystack[mid]);
        if (compareResult > 0) {
            low = mid + 1;
        } else if (compareResult < 0) {
            high = mid;
        } else {
            return mid;
        }
    }
    return ~low;
}
/**
 * Returns the first index in `[begin, end)` for which `predicate` is `true`, or returns `end` if no
 * such index exists.
 *
 * For any index `i` in `(begin, end)`, it must be the case that `predicate(i) >= predicate(i - 1)`.
 */
export function binarySearchLowerBound(begin, end, predicate) {
    var count = end - begin;
    while (count > 0) {
        var step = Math.floor(count / 2);
        var i = begin + step;
        if (predicate(i)) {
            count = step;
        } else {
            begin = i + 1;
            count -= step + 1;
        }
    }
    return begin;
}
//# sourceMappingURL=array.js.map