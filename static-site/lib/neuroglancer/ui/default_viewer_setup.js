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
import { StatusMessage } from '../status';
import { bindDefaultCopyHandler, bindDefaultPasteHandler } from './default_clipboard_handling';
import { setDefaultInputEventBindings } from './default_input_event_bindings';
import { makeDefaultViewer } from './default_viewer';
import { UrlHashBinding } from './url_hash_binding';
/**
 * Sets up the default neuroglancer viewer.
 */
export function setupDefaultViewer() {
    var viewer = window['viewer'] = makeDefaultViewer();
    setDefaultInputEventBindings(viewer.inputEventBindings);
    var hashBinding = viewer.registerDisposer(new UrlHashBinding(viewer.state));
    viewer.registerDisposer(hashBinding.parseError.changed.add(function () {
        var value = hashBinding.parseError.value;

        if (value !== undefined) {
            var status = new StatusMessage();
            status.setErrorMessage('Error parsing state: ' + value.message);
            console.log('Error parsing state', value);
        }
        hashBinding.parseError;
    }));
    hashBinding.updateFromUrlHash();
    bindDefaultCopyHandler(viewer);
    bindDefaultPasteHandler(viewer);
    return viewer;
}
//# sourceMappingURL=default_viewer_setup.js.map