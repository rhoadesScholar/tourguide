/**
 * @license
 * Copyright 2017 Google Inc.
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
import { registerEventListener } from '../util/disposable';
import { positionDragType } from '../widget/position_widget';
export function setupPositionDropHandlers(target, position) {
    var dropDisposer = registerEventListener(target, 'drop', function (event) {
        event.preventDefault();
        if (event.dataTransfer.types.indexOf(positionDragType) !== -1) {
            var positionState = JSON.parse(event.dataTransfer.getData(positionDragType));
            position.restoreState(positionState);
            event.stopPropagation();
        }
    });
    var dragoverDisposer = registerEventListener(target, 'dragover', function (event) {
        if (event.dataTransfer.types.indexOf(positionDragType) !== -1) {
            // Permit drag.
            event.dataTransfer.dropEffect = 'link';
            event.preventDefault();
            event.stopPropagation();
        }
    });
    return function () {
        dragoverDisposer();
        dropDisposer();
    };
}
//# sourceMappingURL=position_drag_and_drop.js.map