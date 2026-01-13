import _regeneratorRuntime from "babel-runtime/regenerator";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";

// DO NOT EDIT.  Generated from templates/neuroglancer/util/pairing_heap.template.ts.
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
 * Pairing heap.
 *
 * The root node is the minimum element according to comparator.
 *
 * @final
 */
var Implementation = function () {
    /**
     * @param compare Returns true iff a < b.
     */
    function Implementation(compare) {
        _classCallCheck(this, Implementation);

        this.compare = compare;
    }

    _createClass(Implementation, [{
        key: "meld",
        value: function meld(a, b) {
            if (b === null) {
                return a;
            }
            if (a === null) {
                return b;
            }
            var compare = this.compare;

            if (compare(b, a)) {
                var temp = a;
                a = b;
                b = temp;
            }
            var aChild = a.child0;
            b.next0 = aChild;
            b.prev0 = a;
            if (aChild !== null) {
                aChild.prev0 = b;
            }
            a.child0 = b;
            return a;
        }
    }, {
        key: "combineChildren",
        value: function combineChildren(node) {
            var cur = node.child0;
            if (cur === null) {
                return null;
            }
            // While in this function, we will use the nextProperty to create a
            // singly-linked list of pairwise-merged nodes that still need to be
            // merged together.
            var head = null;
            while (true) {
                var curNext = cur.next0;
                var next = void 0,
                    m = void 0;
                if (curNext === null) {
                    next = null;
                    m = cur;
                } else {
                    next = curNext.next0;
                    m = this.meld(cur, curNext);
                }
                m.next0 = head;
                head = m;
                if (next === null) {
                    break;
                }
                cur = next;
            }
            var root = head;
            head = head.next0;
            while (true) {
                if (head === null) {
                    break;
                }
                var _next = head.next0;
                root = this.meld(root, head);
                head = _next;
            }
            root.prev0 = null;
            root.next0 = null;
            return root;
        }
    }, {
        key: "removeMin",
        value: function removeMin(root) {
            var newRoot = this.combineChildren(root);
            root.next0 = null;
            root.prev0 = null;
            root.child0 = null;
            return newRoot;
        }
    }, {
        key: "remove",
        value: function remove(root, node) {
            if (root === node) {
                return this.removeMin(root);
            }
            var prev = node.prev0;
            var next = node.next0;
            if (prev.child0 === node) {
                prev.child0 = next;
            } else {
                prev.next0 = next;
            }
            if (next !== null) {
                next.prev0 = prev;
            }
            var newRoot = this.meld(root, this.combineChildren(node));
            node.next0 = null;
            node.prev0 = null;
            node.child0 = null;
            return newRoot;
        }
        /**
         * Returns a new iterator over the entries in the heap.
         */

    }, {
        key: "entries",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function entries(root) {
            var child, next;
            return _regeneratorRuntime.wrap(function entries$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!(root !== null)) {
                                _context.next = 10;
                                break;
                            }

                            child = root.child0;
                            _context.next = 4;
                            return root;

                        case 4:
                            if (!(child !== null)) {
                                _context.next = 10;
                                break;
                            }

                            next = child.next0;
                            return _context.delegateYield(this.entries(child), "t0", 7);

                        case 7:
                            child = next;
                            _context.next = 4;
                            break;

                        case 10:
                        case "end":
                            return _context.stop();
                    }
                }
            }, entries, this);
        })
        /**
         * Returns a new iterator over the entries in the heap.  The entries
         * will be removed as they are iterated.
         */

    }, {
        key: "removedEntries",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function removedEntries(root) {
            var child, next;
            return _regeneratorRuntime.wrap(function removedEntries$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            if (!(root !== null)) {
                                _context2.next = 16;
                                break;
                            }

                            child = root.child0;

                            root.child0 = null;
                            root.next0 = null;
                            root.prev0 = null;
                            _context2.next = 7;
                            return root;

                        case 7:
                            if (!(child !== null)) {
                                _context2.next = 16;
                                break;
                            }

                            next = child.next0;

                            child.child0 = null;
                            child.next0 = null;
                            child.prev0 = null;
                            return _context2.delegateYield(this.entries(child), "t0", 13);

                        case 13:
                            child = next;
                            _context2.next = 7;
                            break;

                        case 16:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, removedEntries, this);
        })
    }]);

    return Implementation;
}();
//# sourceMappingURL=pairing_heap.0.js.map


export default Implementation;