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
import { mat3, prod3, transformVectorByMat4, vec3 } from './geom';
import { pickLengthUnit, pickVolumeUnit } from '../widget/scale_bar';
export function formatIntegerPoint(point) {
    return '(' + Math.floor(point[0]) + ', ' + Math.floor(point[1]) + ', ' + Math.floor(point[2]) + ')';
}
export function formatIntegerBounds(bounds) {
    var result = '';
    for (var i = 0; i < 3; ++i) {
        if (i !== 0) {
            result += ' × ';
        }
        result += Math.round(Math.abs(bounds[i]));
    }
    return result;
}
export function formatLength(lengthInNanometers) {
    var unit = pickLengthUnit(lengthInNanometers);
    var value = lengthInNanometers / unit.lengthInNanometers;
    return value.toPrecision(3) + '\u202F' + unit.unit;
}
export function formatVolume(volumeInCubicNanometers) {
    var unit = pickVolumeUnit(volumeInCubicNanometers);
    var value = volumeInCubicNanometers / Math.pow(unit.lengthInNanometers, 3);
    return value.toPrecision(6) + '\u202F' + unit.unit + '\xB3';
}
export function formatBoundingBoxVolume(pointA, pointB, transform) {
    var dimensionText = '';
    var vector = vec3.create();
    for (var axis = 0; axis < 3; ++axis) {
        vec3.set(vector, 0, 0, 0);
        vector[axis] = pointB[axis] - pointA[axis];
        var spatialVector = transformVectorByMat4(vector, vector, transform);
        var length = vec3.length(spatialVector);
        if (axis !== 0) {
            dimensionText += ' × ';
        }
        dimensionText += formatLength(length);
    }
    var preTransformVolume = Math.abs(prod3(vec3.subtract(vector, pointB, pointA)));
    var det = mat3.determinant(mat3.fromMat4(mat3.create(), transform));
    var postTransformVolume = det * preTransformVolume;
    return dimensionText + '  [' + formatVolume(postTransformVolume) + ']';
}
//# sourceMappingURL=spatial_units.js.map