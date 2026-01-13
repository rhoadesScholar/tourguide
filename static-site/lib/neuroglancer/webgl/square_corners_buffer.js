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
import { tile2dArray } from '../util/array';
import { getMemoizedBuffer } from './buffer';
export function getSquareCornersArray() {
    var startX = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
    var startY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var endX = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
    var endY = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var minorTiles = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var majorTiles = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;

    return tile2dArray(new Float32Array([startX, startY, startX, endY, endX, endY, endX, startY]),
    /*majorDimension=*/2, minorTiles, majorTiles);
}
export function getCubeCornersArray() {
    var startX = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
    var startY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var startZ = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
    var endX = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var endY = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var endZ = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var minorTiles = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1;
    var majorTiles = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;

    return tile2dArray(new Float32Array([startX, startY, startZ, endX, startY, startZ, startX, endY, startZ, endX, endY, startZ, startX, startY, endZ, endX, startY, endZ, startX, endY, endZ, endX, endY, endZ]),
    /*majorDimension=*/3, minorTiles, majorTiles);
}
export function getSquareCornersBuffer(gl) {
    var startX = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var startY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;
    var endX = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
    var endY = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var minorTiles = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
    var majorTiles = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1;

    return getMemoizedBuffer(gl, WebGL2RenderingContext.ARRAY_BUFFER, getSquareCornersArray, startX, startY, endX, endY, minorTiles, majorTiles).value;
}
//# sourceMappingURL=square_corners_buffer.js.map