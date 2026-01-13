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
 * Converts an HSV color (with h, s, v in [0,1]) to RGB (in range [0,1]).
 *
 * Based on goog/color/color.js in the Google Closure library.
 */
export function hsvToRgb(out, h, s, v) {
    h *= 6;
    var hueIndex = Math.floor(h);
    var remainder = h - hueIndex;
    var val1 = v * (1 - s);
    var val2 = v * (1 - s * remainder);
    var val3 = v * (1 - s * (1 - remainder));
    switch (hueIndex % 6) {
        case 0:
            out[0] = v;
            out[1] = val3;
            out[2] = val1;
            break;
        case 1:
            out[0] = val2;
            out[1] = v;
            out[2] = val1;
            break;
        case 2:
            out[0] = val1;
            out[1] = v;
            out[2] = val3;
            break;
        case 3:
            out[0] = val1;
            out[1] = val2;
            out[2] = v;
            break;
        case 4:
            out[0] = val3;
            out[1] = val1;
            out[2] = v;
            break;
        case 5:
            out[0] = v;
            out[1] = val1;
            out[2] = val2;
            break;
    }
    return out;
}
/**
 * Converts from RGB values (with r,g,b in range [0,1]) to an array of HSV values (in range [0, 1])
 *
 * Based on goog/color/color.js in the Google Closure library.
 */
export function rgbToHsv(out, r, g, b) {
    var max = Math.max(Math.max(r, g), b);
    var min = Math.min(Math.min(r, g), b);
    out[2] = max;
    if (min === max) {
        out[0] = 0;
        out[1] = 0;
    } else {
        var delta = max - min;
        out[1] = delta / max;
        if (r === max) {
            out[0] = (g - b) / delta;
        } else if (g === max) {
            out[0] = 2 + (b - r) / delta;
        } else {
            out[0] = 4 + (r - g) / delta;
        }
        out[0] /= 6.0;
        if (out[0] < 0.0) {
            out[0] += 1.0;
        }
        if (out[0] > 1.0) {
            out[0] -= 1.0;
        }
    }
    return out;
}
;
//# sourceMappingURL=colorspace.js.map