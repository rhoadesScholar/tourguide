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
import '../sliceview/chunk_format_handlers';
import { StatusMessage } from '../status';
import { DisplayContext } from '../display_context';
import { Viewer } from '../viewer';
import { disableContextMenu, disableWheel } from './disable_default_actions';
export function makeMinimalViewer(options) {
    disableContextMenu();
    disableWheel();
    try {
        var display = new DisplayContext(document.getElementById('neuroglancer-container'));
        return new Viewer(display, options);
    } catch (error) {
        StatusMessage.showMessage('Error: ' + error.message);
        throw error;
    }
}
//# sourceMappingURL=minimal_viewer.js.map