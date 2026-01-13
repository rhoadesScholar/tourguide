import _regeneratorRuntime from "babel-runtime/regenerator";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _toConsumableArray from "babel-runtime/helpers/toConsumableArray";
import _Map from "babel-runtime/core-js/map";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
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
 * Maps string event identifiers to string action identifiers.
 *
 * When an event identifier is looked up in a given HierarchicalMap, it is resolved to a
 * corresponding action identifier in one of two ways:
 *
 * 1. via mappings defined directly on the HierarchicalMap.
 *
 * 2. via a recursive lookup on a "parent" HierarchicalMap that has been specified for the root
 *    HierarchicalMap on which the lookup was initiated.
 *
 * HierarchicalMap objects may be specified as "parents" of another HierarchicalMap along with a
 * specified numerical priority value, such that there is a directed graph of HierarchicalMap
 * objects.  Cycles in this graph may lead to infinite looping.
 *
 * Recursive lookups in parent HierarchicalMap objects are performed in order of decreasing
 * priority. The lookup stops as soon as a mapping is found.  Direct bindings have a priority of 0.
 * Therefore, parent maps with a priority higher than 0 take precedence over direct bindings.
 */
export var HierarchicalMap = function () {
    /**
     * If an existing HierarchicalMap is specified, a shallow copy is made.
     *
     * @param existing Existing map to make a shallow copy of.
     */
    function HierarchicalMap(existing) {
        _classCallCheck(this, HierarchicalMap);

        this.parents = new Array();
        this.parentPriorities = new Array();
        this.bindings = new _Map();
        if (existing !== undefined) {
            var _parents, _parentPriorities;

            (_parents = this.parents).push.apply(_parents, _toConsumableArray(existing.parents));
            (_parentPriorities = this.parentPriorities).push.apply(_parentPriorities, _toConsumableArray(existing.parentPriorities));
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(existing.bindings), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var k = _ref2[0];
                    var v = _ref2[1];

                    this.bindings.set(k, v);
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
        }
    }
    /**
     * Register `parent` as a parent map.  If `priority > 0`, this map will take precedence over
     * direct bindings.
     *
     * @returns A nullary function that unregisters the parent (and may be called at most once).
     */


    _createClass(HierarchicalMap, [{
        key: "addParent",
        value: function addParent(parent, priority) {
            var _this = this;

            var parents = this.parents,
                parentPriorities = this.parentPriorities;

            var index = 0;
            var length = parents.length;

            while (index < length && priority < parentPriorities[index]) {
                ++index;
            }
            parents.splice(index, 0, parent);
            parentPriorities.splice(index, 0, priority);
            return function () {
                _this.removeParent(parent);
            };
        }
        /**
         * Unregisters `parent` as a parent.
         */

    }, {
        key: "removeParent",
        value: function removeParent(parent) {
            var index = this.parents.indexOf(parent);
            if (index === -1) {
                throw new Error("Attempt to remove non-existent parent map.");
            }
            this.parents.splice(index, 1);
            this.parentPriorities.splice(index, 1);
        }
        /**
         * Register a direct binding.
         */

    }, {
        key: "set",
        value: function set(key, value) {
            this.bindings.set(key, value);
        }
        /**
         * Unregister a direct binding.
         */

    }, {
        key: "delete",
        value: function _delete(key) {
            this.bindings.delete(key);
        }
        /**
         * Deletes all bindings, including parents.
         */

    }, {
        key: "clear",
        value: function clear() {
            this.bindings.clear();
            this.parents.length = 0;
            this.parentPriorities.length = 0;
        }
        /**
         * Lookup the highest priority value to which the specified key is mapped.
         */

    }, {
        key: "get",
        value: function get(key) {
            var parents = this.parents,
                parentPriorities = this.parentPriorities;

            var numParents = parentPriorities.length;
            var parentIndex = 0;
            var value = void 0;
            for (; parentIndex < numParents && parentPriorities[parentIndex] > 0; ++parentIndex) {
                value = parents[parentIndex].get(key);
                if (value !== undefined) {
                    return value;
                }
            }
            value = this.bindings.get(key);
            if (value !== undefined) {
                return value;
            }
            for (; parentIndex < numParents; ++parentIndex) {
                value = parents[parentIndex].get(key);
                if (value !== undefined) {
                    return value;
                }
            }
            return undefined;
        }
        /**
         * Find all values to which the specified key is mapped.
         */

    }, {
        key: "getAll",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function getAll(key) {
            var parents, parentPriorities, numParents, parentIndex, value;
            return _regeneratorRuntime.wrap(function getAll$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            parents = this.parents, parentPriorities = this.parentPriorities;
                            numParents = parentPriorities.length;
                            parentIndex = 0;
                            value = void 0;

                        case 4:
                            if (!(parentIndex < numParents && parentPriorities[parentIndex] > 0)) {
                                _context.next = 11;
                                break;
                            }

                            value = parents[parentIndex].get(key);

                            if (!(value !== undefined)) {
                                _context.next = 9;
                                break;
                            }

                            _context.next = 9;
                            return value;

                        case 9:
                            _context.next = 4;
                            break;

                        case 11:
                            value = this.bindings.get(key);

                            if (!(value !== undefined)) {
                                _context.next = 15;
                                break;
                            }

                            _context.next = 15;
                            return value;

                        case 15:
                            if (!(parentIndex < numParents)) {
                                _context.next = 22;
                                break;
                            }

                            value = parents[parentIndex].get(key);

                            if (!(value !== undefined)) {
                                _context.next = 20;
                                break;
                            }

                            _context.next = 20;
                            return value;

                        case 20:
                            _context.next = 15;
                            break;

                        case 22:
                        case "end":
                            return _context.stop();
                    }
                }
            }, getAll, this);
        })
    }, {
        key: "entries",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function entries() {
            var parents, parentPriorities, numParents, parentIndex;
            return _regeneratorRuntime.wrap(function entries$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            parents = this.parents, parentPriorities = this.parentPriorities;
                            numParents = parentPriorities.length;
                            parentIndex = 0;

                        case 3:
                            if (!(parentIndex < numParents && parentPriorities[parentIndex] > 0)) {
                                _context2.next = 7;
                                break;
                            }

                            return _context2.delegateYield(parents[parentIndex].entries(), "t0", 5);

                        case 5:
                            _context2.next = 3;
                            break;

                        case 7:
                            return _context2.delegateYield(this.bindings.entries(), "t1", 8);

                        case 8:
                            if (!(parentIndex < numParents)) {
                                _context2.next = 12;
                                break;
                            }

                            return _context2.delegateYield(parents[parentIndex].entries(), "t2", 10);

                        case 10:
                            _context2.next = 8;
                            break;

                        case 12:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, entries, this);
        })
    }]);

    return HierarchicalMap;
}();
//# sourceMappingURL=hierarchical_map.js.map