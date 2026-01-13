import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';

var _marked = /*#__PURE__*/_regeneratorRuntime.mark(normalizeEventIdentifier);

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
import { registerEventListener } from './disposable';
import { HierarchicalMap } from './hierarchical_map';
export var Modifiers;
(function (Modifiers) {
    Modifiers[Modifiers["CONTROL"] = 1] = "CONTROL";
    Modifiers[Modifiers["ALT"] = 2] = "ALT";
    Modifiers[Modifiers["META"] = 4] = "META";
    Modifiers[Modifiers["SHIFT"] = 8] = "SHIFT";
})(Modifiers || (Modifiers = {}));
export function getEventModifierMask(event) {
    return (event.ctrlKey ? 1 /* CONTROL */ : 0) | (event.altKey ? 2 /* ALT */ : 0) | (event.metaKey ? 4 /* META */ : 0) | (event.shiftKey ? 8 /* SHIFT */ : 0);
}
export function getStrokeIdentifier(keyName, modifiers) {
    var identifier = '';
    if (modifiers & 1 /* CONTROL */) {
            identifier += 'control+';
        }
    if (modifiers & 2 /* ALT */) {
            identifier += 'alt+';
        }
    if (modifiers & 4 /* META */) {
            identifier += 'meta+';
        }
    if (modifiers & 8 /* SHIFT */) {
            identifier += 'shift+';
        }
    identifier += keyName;
    return identifier;
}
function normalizeModifiersAndBaseIdentifier(identifier) {
    var parts = identifier.split('+');
    var keyName = void 0;
    var modifiers = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(parts), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var part = _step.value;

            switch (part) {
                case 'control':
                    modifiers |= 1 /* CONTROL */;
                    break;
                case 'alt':
                    modifiers |= 2 /* ALT */;
                    break;
                case 'meta':
                    modifiers |= 4 /* META */;
                    break;
                case 'shift':
                    modifiers |= 8 /* SHIFT */;
                    break;
                default:
                    if (keyName === undefined) {
                        keyName = part;
                    } else {
                        return undefined;
                    }
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    if (keyName === undefined) {
        return undefined;
    }
    return getStrokeIdentifier(keyName, modifiers);
}
/**
 * Normalizes an ActionOrEventAction into an EventAction.
 */
export function normalizeEventAction(action) {
    if (typeof action === 'string') {
        return { action: action };
    }
    return action;
}
/**
 * Normalizes a user-specified EventIdentifier into a list of one or more corresponding
 * NormalizedEventIdentifier strings.
 */
export function normalizeEventIdentifier(identifier) {
    var firstColonOffset, suffix, prefix;
    return _regeneratorRuntime.wrap(function normalizeEventIdentifier$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    firstColonOffset = identifier.indexOf(':');
                    suffix = normalizeModifiersAndBaseIdentifier(identifier.substring(firstColonOffset + 1));

                    if (!(suffix === undefined)) {
                        _context.next = 4;
                        break;
                    }

                    throw new Error('Invalid event identifier: ' + _JSON$stringify(identifier));

                case 4:
                    if (!(firstColonOffset !== -1)) {
                        _context.next = 12;
                        break;
                    }

                    prefix = identifier.substring(0, firstColonOffset);
                    // TODO(jbms): Support capture phase.

                    if (!(prefix !== 'at' && prefix !== 'bubble')) {
                        _context.next = 8;
                        break;
                    }

                    throw new Error('Invalid event phase: ' + _JSON$stringify(prefix));

                case 8:
                    _context.next = 10;
                    return prefix + ':' + suffix;

                case 10:
                    _context.next = 16;
                    break;

                case 12:
                    _context.next = 14;
                    return 'at:' + suffix;

                case 14:
                    _context.next = 16;
                    return 'bubble:' + suffix;

                case 16:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked, this);
}
/**
 * Hierarchical map of `EventIdentifier` specifications to `EventAction` specifications.  These maps
 * are used by KeyboardEventBinder and MouseEventBinder to dispatch an ActionEvent in response to an
 * input event.
 */
export var EventActionMap = function (_HierarchicalMap) {
    _inherits(EventActionMap, _HierarchicalMap);

    function EventActionMap() {
        _classCallCheck(this, EventActionMap);

        return _possibleConstructorReturn(this, (EventActionMap.__proto__ || _Object$getPrototypeOf(EventActionMap)).apply(this, arguments));
    }

    _createClass(EventActionMap, [{
        key: 'setFromObject',
        value: function setFromObject(bindings) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(_Object$keys(bindings)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var key = _step2.value;

                    this.set(key, normalizeEventAction(bindings[key]));
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
        /**
         * Maps the specified event `identifier` to the specified `action`.
         *
         * The `identifier` may be unnormalized; the actual mapping is created for each corresponding
         * normalized identifier.
         */

    }, {
        key: 'set',
        value: function set(identifier, action) {
            var normalizedAction = normalizeEventAction(action);
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(normalizeEventIdentifier(identifier)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var normalizedIdentifier = _step3.value;

                    _get(EventActionMap.prototype.__proto__ || _Object$getPrototypeOf(EventActionMap.prototype), 'set', this).call(this, normalizedIdentifier, normalizedAction);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
        /**
         * Deletes the mapping for the specified `identifier`.
         *
         * The `identifier` may be unnormalized; the mapping is deleted for each corresponding normalized
         * identifier.
         */

    }, {
        key: 'delete',
        value: function _delete(identifier) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(normalizeEventIdentifier(identifier)), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var normalizedIdentifier = _step4.value;

                    _get(EventActionMap.prototype.__proto__ || _Object$getPrototypeOf(EventActionMap.prototype), 'delete', this).call(this, normalizedIdentifier);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: 'describe',
        value: function describe() {
            var bindings = [];
            var uniqueBindings = new _Map();
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(this.entries()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _ref = _step5.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var value = _ref2[1];

                    var split = key.indexOf(':');
                    uniqueBindings.set(key.substring(split + 1), value.action);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(uniqueBindings), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _ref3 = _step6.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var _key = _ref4[0];
                    var _value = _ref4[1];

                    bindings.push(_key + '\u2192' + _value);
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }

            return bindings.join(', ');
        }
    }], [{
        key: 'fromObject',

        /**
         * Returns a new EventActionMap with the specified bindings.
         *
         * The keys of the `bindings` object specify unnormalized event identifiers to be mapped to their
         * corresponding `ActionOrEventAction` values.
         */
        value: function fromObject(bindings) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var map = new EventActionMap();
            map.label = options.label;
            if (options.parents !== undefined) {
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = _getIterator(options.parents), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var _ref5 = _step7.value;

                        var _ref6 = _slicedToArray(_ref5, 2);

                        var parent = _ref6[0];
                        var priority = _ref6[1];

                        map.addParent(parent, priority);
                    }
                } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                            _iterator7.return();
                        }
                    } finally {
                        if (_didIteratorError7) {
                            throw _iteratorError7;
                        }
                    }
                }
            }
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(_Object$keys(bindings)), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var key = _step8.value;

                    map.set(key, normalizeEventAction(bindings[key]));
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            return map;
        }
    }]);

    return EventActionMap;
}(HierarchicalMap);
export function dispatchEventAction(originalEvent, detail, eventAction) {
    if (eventAction === undefined) {
        return;
    }
    if (eventAction.stopPropagation !== false) {
        originalEvent.stopPropagation();
    }
    var actionEvent = new CustomEvent('action:' + eventAction.action, { 'bubbles': true, detail: detail, cancelable: true });
    var cancelled = !originalEvent.target.dispatchEvent(actionEvent);
    if (eventAction.preventDefault !== false || cancelled) {
        originalEvent.preventDefault();
    }
}
export var eventPhaseNames = [];
eventPhaseNames[Event.AT_TARGET] = 'at';
eventPhaseNames[Event.CAPTURING_PHASE] = 'capture';
eventPhaseNames[Event.BUBBLING_PHASE] = 'bubble';
export function dispatchEvent(baseIdentifier, originalEvent, eventPhase, detail, eventMap) {
    var eventIdentifier = eventPhaseNames[eventPhase] + ':' + baseIdentifier;
    var eventAction = eventMap.get(eventIdentifier);
    dispatchEventAction(originalEvent, detail, eventAction);
}
export function dispatchEventWithModifiers(baseIdentifier, originalEvent, detail, eventMap) {
    dispatchEvent(getStrokeIdentifier(baseIdentifier, getEventModifierMask(originalEvent)), originalEvent, originalEvent.eventPhase, detail, eventMap);
}
/**
 * Register an event listener for the specified `action`.
 *
 * There is no checking that the `TriggerEvent` type is suitable for use with the specified
 * `action`.
 *
 * @returns A nullary disposer function that unregisters the listener when called.
 */
export function registerActionListener(target, action, listener, options) {
    return registerEventListener(target, 'action:' + action, listener, options);
}
//# sourceMappingURL=event_action_map.js.map