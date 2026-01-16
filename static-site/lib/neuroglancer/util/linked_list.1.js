import _regeneratorRuntime from "babel-runtime/regenerator";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";

// DO NOT EDIT.  Generated from templates/neuroglancer/util/linked_list.template.ts.
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
var _class = function () {
    function _class() {
        _classCallCheck(this, _class);
    }

    _createClass(_class, null, [{
        key: "insertAfter",
        value: function insertAfter(head, x) {
            var next = head.next1;
            x.next1 = next;
            x.prev1 = head;
            head.next1 = x;
            next.prev1 = x;
        }
    }, {
        key: "insertBefore",
        value: function insertBefore(head, x) {
            var prev = head.prev1;
            x.prev1 = prev;
            x.next1 = head;
            head.prev1 = x;
            prev.next1 = x;
        }
    }, {
        key: "front",
        value: function front(head) {
            var next = head.next1;
            if (next === head) {
                return null;
            }
            return next;
        }
    }, {
        key: "back",
        value: function back(head) {
            var next = head.prev1;
            if (next === head) {
                return null;
            }
            return next;
        }
    }, {
        key: "pop",
        value: function pop(x) {
            var next = x.next1;
            var prev = x.prev1;
            next.prev1 = prev;
            prev.next1 = next;
            x.next1 = null;
            x.prev1 = null;
            return x;
        }
    }, {
        key: "iterator",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function iterator(head) {
            var x;
            return _regeneratorRuntime.wrap(function iterator$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            x = head.next1;

                        case 1:
                            if (!(x !== head)) {
                                _context.next = 7;
                                break;
                            }

                            _context.next = 4;
                            return x;

                        case 4:
                            x = x.next1;
                            _context.next = 1;
                            break;

                        case 7:
                        case "end":
                            return _context.stop();
                    }
                }
            }, iterator, this);
        })
    }, {
        key: "reverseIterator",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function reverseIterator(head) {
            var x;
            return _regeneratorRuntime.wrap(function reverseIterator$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            x = head.prev1;

                        case 1:
                            if (!(x !== head)) {
                                _context2.next = 7;
                                break;
                            }

                            _context2.next = 4;
                            return x;

                        case 4:
                            x = x.prev1;
                            _context2.next = 1;
                            break;

                        case 7:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, reverseIterator, this);
        })
    }, {
        key: "initializeHead",
        value: function initializeHead(head) {
            head.next1 = head.prev1 = head;
        }
    }]);

    return _class;
}();
//# sourceMappingURL=linked_list.1.js.map


export default _class;