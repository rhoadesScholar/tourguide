import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { Overlay } from '../overlay';

export function formatKeyName(name) {
    if (name.startsWith('key')) {
        return name.substring(3);
    }
    if (name.startsWith('digit')) {
        return name.substring(5);
    }
    if (name.startsWith('arrow')) {
        return name.substring(5);
    }
    return name;
}
export function formatKeyStroke(stroke) {
    var parts = stroke.split('+');
    return parts.map(formatKeyName).join('+');
}
export var InputEventBindingHelpDialog = function (_Overlay) {
    _inherits(InputEventBindingHelpDialog, _Overlay);

    /**
     * @param keyMap Key map to list.
     */
    function InputEventBindingHelpDialog(bindings) {
        _classCallCheck(this, InputEventBindingHelpDialog);

        var _this = _possibleConstructorReturn(this, (InputEventBindingHelpDialog.__proto__ || _Object$getPrototypeOf(InputEventBindingHelpDialog)).call(this));

        var content = _this.content;

        content.classList.add('describe-key-bindings');
        var scroll = document.createElement('div');
        scroll.classList.add('describe-key-bindings-container');
        var uniqueMaps = new _Map();
        function addEntries(eventMap, entries) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(eventMap.parents), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var parent = _step.value;

                    if (parent.label !== undefined) {
                        addMap(parent.label, parent);
                    } else {
                        addEntries(parent, entries);
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

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(eventMap.bindings.entries()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref = _step2.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var event = _ref2[0];
                    var eventAction = _ref2[1];

                    var firstColon = event.indexOf(':');
                    var suffix = event.substring(firstColon + 1);
                    entries.set(suffix, eventAction.action);
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
        function addMap(label, map) {
            if (uniqueMaps.has(map)) {
                return;
            }
            var list = {
                label: label,
                entries: new _Map()
            };
            addEntries(map, list.entries);
            uniqueMaps.set(map, list);
        }
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = _getIterator(bindings), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _ref3 = _step3.value;

                var _ref4 = _slicedToArray(_ref3, 2);

                var label = _ref4[0];
                var eventMap = _ref4[1];

                addMap(label, eventMap);
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

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = _getIterator(uniqueMaps.values()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var list = _step4.value;

                var header = document.createElement('h2');
                header.textContent = list.label;
                scroll.appendChild(header);
                var dl = document.createElement('div');
                dl.className = 'dl';
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = _getIterator(list.entries), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var _ref5 = _step5.value;

                        var _ref6 = _slicedToArray(_ref5, 2);

                        var event = _ref6[0];
                        var action = _ref6[1];

                        var container = document.createElement('div');
                        var container2 = document.createElement('div');
                        container2.className = 'definition-outer-container';
                        container.className = 'definition-container';
                        var dt = document.createElement('div');
                        dt.className = 'dt';
                        dt.textContent = formatKeyStroke(event);
                        var dd = document.createElement('div');
                        dd.className = 'dd';
                        dd.textContent = action;
                        container.appendChild(dt);
                        container.appendChild(dd);
                        dl.appendChild(container2);
                        container2.appendChild(container);
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

                scroll.appendChild(dl);
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

        content.appendChild(scroll);
        return _this;
    }

    return InputEventBindingHelpDialog;
}(Overlay);
//# sourceMappingURL=input_event_bindings.js.map