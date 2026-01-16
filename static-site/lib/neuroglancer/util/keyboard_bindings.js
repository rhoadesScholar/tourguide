import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Set from 'babel-runtime/core-js/set';
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
 * @file Facility for triggering named actions in response to keyboard events.
 */
// This is based on goog/ui/keyboardshortcuthandler.js in the Google Closure library.
import { RefCounted } from './disposable';
import { dispatchEventWithModifiers, EventActionMap, registerActionListener } from './event_action_map';
var globalKeys = new _Set(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'escape', 'pause']);
var DEFAULT_TEXT_INPUTS = new _Set(['color', 'date', 'datetime', 'datetime-local', 'email', 'month', 'number', 'password', 'search', 'tel', 'text', 'time', 'url', 'week']);
export var KeyboardEventBinder = function (_RefCounted) {
    _inherits(KeyboardEventBinder, _RefCounted);

    function KeyboardEventBinder(target, eventMap) {
        _classCallCheck(this, KeyboardEventBinder);

        var _this = _possibleConstructorReturn(this, (KeyboardEventBinder.__proto__ || _Object$getPrototypeOf(KeyboardEventBinder)).call(this));

        _this.target = target;
        _this.eventMap = eventMap;
        _this.modifierShortcutsAreGlobal = true;
        _this.allShortcutsAreGlobal = false;
        _this.allowSpaceKeyOnButtons = false;
        _this.registerEventListener(target, 'keydown', _this.handleKeyDown.bind(_this), /*useCapture=*/false);
        return _this;
    }

    _createClass(KeyboardEventBinder, [{
        key: 'shouldIgnoreEvent',
        value: function shouldIgnoreEvent(key, event) {
            var el = event.target;
            var tagName = el.tagName;

            if (el === this.target) {
                // If the event is directly on the target element, we never ignore it.
                return false;
            }
            var isFormElement = tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'BUTTON' || tagName === 'SELECT';
            var isContentEditable = !isFormElement && (el.isContentEditable || el.ownerDocument && el.ownerDocument.designMode === 'on');
            if (!isFormElement && !isContentEditable) {
                return false;
            }
            // Always allow keys registered as global to be used (typically Esc, the
            // F-keys and other keys that are not typically used to manipulate text).
            if (this.allShortcutsAreGlobal || globalKeys.has(key)) {
                return false;
            }
            if (isContentEditable) {
                // For events originating from an element in editing mode we only let
                // global key codes through.
                return true;
            }
            // Event target is one of (TEXTAREA, INPUT, BUTTON, SELECT).
            // Allow modifier shortcuts, unless we shouldn't.
            if (this.modifierShortcutsAreGlobal && (event.altKey || event.ctrlKey || event.metaKey)) {
                return true;
            }
            // Allow ENTER to be used as shortcut for text inputs.
            if (tagName === 'INPUT' && DEFAULT_TEXT_INPUTS.has(el.type)) {
                return key !== 'enter';
            }
            // Checkboxes, radiobuttons and buttons. Allow all but SPACE as shortcut.
            if (tagName === 'INPUT' || tagName === 'BUTTON') {
                // TODO(gboyer): If more flexibility is needed, create protected helper
                // methods for each case (e.g. button, input, etc).
                if (this.allowSpaceKeyOnButtons) {
                    return false;
                } else {
                    return key === 'space';
                }
            }
            // Don't allow any additional shortcut keys for textareas or selects.
            return true;
        }
    }, {
        key: 'handleKeyDown',
        value: function handleKeyDown(event) {
            var key = getEventKeyName(event);
            if (this.shouldIgnoreEvent(key, event)) {
                return;
            }
            dispatchEventWithModifiers(key, event, event, this.eventMap);
        }
    }]);

    return KeyboardEventBinder;
}(RefCounted);
export function getEventKeyName(event) {
    return event.code.toLowerCase();
}
export { EventActionMap, registerActionListener };
//# sourceMappingURL=keyboard_bindings.js.map