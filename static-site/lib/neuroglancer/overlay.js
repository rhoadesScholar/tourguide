import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { AutomaticallyFocusedElement } from './util/automatic_focus';
import { RefCounted } from './util/disposable';
import { EventActionMap, KeyboardEventBinder } from './util/keyboard_bindings';
export var overlayKeyboardHandlerPriority = 100;

export var overlaysOpen = 0;
export var defaultEventMap = EventActionMap.fromObject({
    'escape': { action: 'close' }
});
export var Overlay = function (_RefCounted) {
    _inherits(Overlay, _RefCounted);

    function Overlay() {
        _classCallCheck(this, Overlay);

        var _this = _possibleConstructorReturn(this, (Overlay.__proto__ || _Object$getPrototypeOf(Overlay)).call(this));

        _this.keyMap = new EventActionMap();
        _this.keyMap.addParent(defaultEventMap, Number.NEGATIVE_INFINITY);
        ++overlaysOpen;
        var container = _this.container = document.createElement('div');
        container.className = 'overlay';
        var content = _this.content = document.createElement('div');
        _this.registerDisposer(new AutomaticallyFocusedElement(content));
        content.className = 'overlay-content';
        container.appendChild(content);
        document.body.appendChild(container);
        _this.registerDisposer(new KeyboardEventBinder(_this.container, _this.keyMap));
        _this.registerEventListener(container, 'action:close', function () {
            _this.dispose();
        });
        content.focus();
        return _this;
    }

    _createClass(Overlay, [{
        key: 'disposed',
        value: function disposed() {
            --overlaysOpen;
            document.body.removeChild(this.container);
            _get(Overlay.prototype.__proto__ || _Object$getPrototypeOf(Overlay.prototype), 'disposed', this).call(this);
        }
    }]);

    return Overlay;
}(RefCounted);
//# sourceMappingURL=overlay.js.map