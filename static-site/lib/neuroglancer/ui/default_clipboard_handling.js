import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { eventHasInputTextTarget } from '../util/clipboard';
import { vec3 } from '../util/geom';
import { getCachedJson } from '../util/trackable';
export function bindDefaultCopyHandler(viewer) {
    viewer.registerEventListener(document, 'copy', function (event) {
        if (eventHasInputTextTarget(event)) {
            return;
        }
        var stateJson = getCachedJson(viewer.state).value;
        var clipboardData = event.clipboardData;

        if (clipboardData !== null) {
            clipboardData.setData('text/plain', _JSON$stringify(stateJson, undefined, '  '));
        }
        event.preventDefault();
    });
}
/**
 * Checks if s consists of 3 numbers separated by whitespace or commas, with optional parentheses or
 * brackets before and after.
 *
 * @param s The string to parse.
 * @return The parsed vector, or undefined if parsing failed.
 */
export function parsePositionString(s) {
    var match = s.match(/^[\[\]{}()\s,]*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[\[\]{}()\s,]*$/);
    if (match !== null) {
        return vec3.fromValues(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    }
    return undefined;
}
export function bindDefaultPasteHandler(viewer) {
    viewer.registerEventListener(document, 'paste', function (event) {
        if (eventHasInputTextTarget(event)) {
            return;
        }
        var clipboardData = event.clipboardData;

        if (clipboardData !== null) {
            var data = clipboardData.getData('text/plain');
            var parsedPosition = parsePositionString(data);
            if (parsedPosition !== undefined) {
                viewer.navigationState.position.setVoxelCoordinates(parsedPosition);
            }
        }
        event.preventDefault();
    });
}
//# sourceMappingURL=default_clipboard_handling.js.map