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
export function getOctreeChildIndex(x, y, z) {
    return x & 1 | y << 1 & 2 | z << 2 & 4;
}
/**
 * Decodes a "compressed" 3-d morton index.
 *
 * Decoded bit `i` of `x`, `y`, and `z` is at bit `i + min(i, yBits) + min(i, zBits)`, `i + min(i +
 * 1, xBits) + min(i, zBits)`, and `i + min(i + 1, xBits) + min(i + 1, zBits)` of `zindex`,
 * respectively, for `i` in `[0, xBits)`, `[0, yBits)`, `[0, zBits)`, respectively.
 */
export function decodeZIndexCompressed(zindex, xBits, yBits, zBits) {
    var maxCoordBits = Math.max(xBits, yBits, zBits);
    var inputBit = 0;
    var inputValue = zindex.low;
    var x = 0,
        y = 0,
        z = 0;
    for (var coordBit = 0; coordBit < maxCoordBits; ++coordBit) {
        if (coordBit < xBits) {
            var bit = inputValue >>> inputBit & 1;
            x |= bit << coordBit;
            if (inputBit === 31) {
                inputBit = 0;
                inputValue = zindex.high;
            } else {
                ++inputBit;
            }
        }
        if (coordBit < yBits) {
            var _bit = inputValue >>> inputBit & 1;
            y |= _bit << coordBit;
            if (inputBit === 31) {
                inputBit = 0;
                inputValue = zindex.high;
            } else {
                ++inputBit;
            }
        }
        if (coordBit < zBits) {
            var _bit2 = inputValue >>> inputBit & 1;
            z |= _bit2 << coordBit;
            if (inputBit === 31) {
                inputBit = 0;
                inputValue = zindex.high;
            } else {
                ++inputBit;
            }
        }
    }
    return Uint32Array.of(x, y, z);
}
export function encodeZIndexCompressed(zindex, xBits, yBits, zBits, x, y, z) {
    var maxBits = Math.max(xBits, yBits, zBits);
    var outputBit = 0;
    var outputNum = 0;
    var isHigh = false;
    function writeBit(b) {
        outputNum |= (b & 1) << outputBit;
        if (++outputBit === 32) {
            zindex.low = outputNum;
            outputNum = 0;
            outputBit = 0;
            isHigh = true;
        }
    }
    for (var bit = 0; bit < maxBits; ++bit) {
        if (bit < xBits) {
            writeBit(x >> bit & 1);
        }
        if (bit < yBits) {
            writeBit(y >> bit & 1);
        }
        if (bit < zBits) {
            writeBit(z >> bit & 1);
        }
    }
    if (isHigh) {
        zindex.high = outputNum;
    } else {
        zindex.high = 0;
        zindex.low = outputNum;
    }
    return zindex;
}
function lessMsb(a, b) {
    return a < b && a < (a ^ b);
}
/**
 * Returns `true` if `(x0, y0, z0)` occurs before `(x1, y1, z1)` in Z-curve order.
 */
export function zorder3LessThan(x0, y0, z0, x1, y1, z1) {
    var mostSignificant0 = z0,
        mostSignificant1 = z1;
    if (lessMsb(mostSignificant0 ^ mostSignificant1, y0 ^ y1)) {
        mostSignificant0 = y0;
        mostSignificant1 = y1;
    }
    if (lessMsb(mostSignificant0 ^ mostSignificant1, x0 ^ x1)) {
        mostSignificant0 = x0;
        mostSignificant1 = x1;
    }
    return mostSignificant0 < mostSignificant1;
}
//# sourceMappingURL=zorder.js.map