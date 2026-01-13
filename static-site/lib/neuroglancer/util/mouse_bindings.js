import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
/**
 * @file Facility for triggering named actions in response to mouse events.
 */
import { RefCounted } from './disposable';
import { dispatchEventWithModifiers, EventActionMap, registerActionListener } from './event_action_map';
export var MouseEventBinder = function (_RefCounted) {
    _inherits(MouseEventBinder, _RefCounted);

    function MouseEventBinder(target, eventMap) {
        _classCallCheck(this, MouseEventBinder);

        var _this = _possibleConstructorReturn(this, (MouseEventBinder.__proto__ || _Object$getPrototypeOf(MouseEventBinder)).call(this));

        _this.target = target;
        _this.eventMap = eventMap;
        _this.registerEventListener(target, 'wheel', function (event) {
            _this.dispatch('wheel', event);
        });
        _this.registerEventListener(target, 'click', function (event) {
            _this.dispatch('click' + event.button, event);
        });
        _this.registerEventListener(target, 'dblclick', function (event) {
            _this.dispatch('dblclick' + event.button, event);
        });
        _this.registerEventListener(target, 'mousedown', function (event) {
            _this.dispatch('mousedown' + event.button, event);
        });
        _this.registerEventListener(target, 'mouseup', function (event) {
            _this.dispatch('mouseup' + event.button, event);
        });
        return _this;
    }

    _createClass(MouseEventBinder, [{
        key: 'dispatch',
        value: function dispatch(baseIdentifier, event) {
            dispatchEventWithModifiers(baseIdentifier, event, event, this.eventMap);
        }
    }]);

    return MouseEventBinder;
}(RefCounted);
export { EventActionMap, registerActionListener };
//# sourceMappingURL=mouse_bindings.js.map