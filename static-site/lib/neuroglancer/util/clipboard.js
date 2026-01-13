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
import { registerEventListener } from './disposable';
/**
 * Returns true if the event appears to be targetted on input text and should not be overridden by a
 * global handler.
 */
export function eventHasInputTextTarget(event) {
    var selection = window.getSelection();
    if (selection !== null && !selection.isCollapsed) {
        return true;
    }
    var tagName = event.target.tagName;

    if (tagName === 'TEXTAREA' || tagName === 'INPUT') {
        return true;
    }
    return false;
}
export function setClipboard(data) {
    var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'text/plain';

    var success = false;
    var cleanup = registerEventListener(document, 'copy', function (event) {
        var clipboardData = event.clipboardData;

        if (clipboardData !== null) {
            clipboardData.setData(format, data);
            success = true;
        }
        event.stopPropagation();
        event.preventDefault();
    }, true);
    try {
        document.execCommand('copy');
    } finally {
        cleanup();
    }
    return success;
}
//# sourceMappingURL=clipboard.js.map