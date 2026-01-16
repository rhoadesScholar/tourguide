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
export function startRelativeMouseDrag(initialEvent, handler, finishDragHandler) {
    var document = initialEvent.view.document;

    var prevClientX = initialEvent.clientX,
        prevClientY = initialEvent.clientY;
    var mouseMoveHandler = function mouseMoveHandler(e) {
        var deltaX = e.clientX - prevClientX;
        var deltaY = e.clientY - prevClientY;
        prevClientX = e.clientX;
        prevClientY = e.clientY;
        handler(e, deltaX, deltaY);
    };
    var button = initialEvent.button;
    var cancel = function cancel(e) {
        document.removeEventListener('pointermove', mouseMoveHandler, true);
        document.removeEventListener('pointerup', mouseUpHandler, false);
        if (finishDragHandler !== undefined) {
            finishDragHandler(e, e.clientX - prevClientX, e.clientY - prevClientY);
        }
    };
    var mouseUpHandler = function mouseUpHandler(e) {
        if (e.button === button) {
            cancel(e);
        }
    };
    document.addEventListener('pointermove', mouseMoveHandler, true);
    document.addEventListener('pointerup', mouseUpHandler, false);
    document.addEventListener('pointercancel', cancel, false);
}
//# sourceMappingURL=mouse_drag.js.map