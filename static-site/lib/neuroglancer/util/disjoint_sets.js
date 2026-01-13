import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _Symbol from 'babel-runtime/core-js/symbol';

var _marked = /*#__PURE__*/_regeneratorRuntime.mark(setElementIterator);

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
import { Uint64 } from './uint64';
var rankSymbol = _Symbol('disjoint_sets:rank');
var parentSymbol = _Symbol('disjoint_sets:parent');
var nextSymbol = _Symbol('disjoint_sets:next');
var prevSymbol = _Symbol('disjoint_sets:prev');
function findRepresentative(v) {
    // First pass: find the root, which will be stored in ancestor.
    var old = v;
    var ancestor = v[parentSymbol];
    while (ancestor !== v) {
        v = ancestor;
        ancestor = v[parentSymbol];
    }
    // Second pass: set all of the parent pointers along the path from the
    // original element `old' to refer directly to the root `ancestor'.
    v = old[parentSymbol];
    while (ancestor !== v) {
        old[parentSymbol] = ancestor;
        old = v;
        v = old[parentSymbol];
    }
    return ancestor;
}
function linkUnequalSetRepresentatives(i, j) {
    var iRank = i[rankSymbol];
    var jRank = j[rankSymbol];
    if (iRank > jRank) {
        j[parentSymbol] = i;
        return i;
    }
    i[parentSymbol] = j;
    if (iRank === jRank) {
        j[rankSymbol] = jRank + 1;
    }
    return j;
}
function spliceCircularLists(i, j) {
    var iPrev = i[prevSymbol];
    var jPrev = j[prevSymbol];
    // Connect end of i to beginning of j.
    j[prevSymbol] = iPrev;
    iPrev[nextSymbol] = j;
    // Connect end of j to beginning of i.
    i[prevSymbol] = jPrev;
    jPrev[nextSymbol] = i;
}
function setElementIterator(i) {
    var j;
    return _regeneratorRuntime.wrap(function setElementIterator$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    j = i;

                case 1:
                    _context.next = 3;
                    return j;

                case 3:
                    j = j[nextSymbol];

                case 4:
                    if (j !== i) {
                        _context.next = 1;
                        break;
                    }

                case 5:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked, this);
}
function initializeElement(v) {
    v[parentSymbol] = v;
    v[rankSymbol] = 0;
    v[nextSymbol] = v[prevSymbol] = v;
}
var minSymbol = _Symbol('disjoint_sets:min');
function isRootElement(v) {
    return v[parentSymbol] === v;
}
/**
 * Represents a collection of disjoint sets of Uint64 values.
 *
 * Supports merging sets, retrieving the minimum Uint64 value contained in a set (the representative
 * value), and iterating over the elements contained in a set.
 */
export var DisjointUint64Sets = function () {
    function DisjointUint64Sets() {
        _classCallCheck(this, DisjointUint64Sets);

        this.map = new _Map();
        this.generation = 0;
    }

    _createClass(DisjointUint64Sets, [{
        key: 'get',
        value: function get(x) {
            var key = x.toString();
            var element = this.map.get(key);
            if (element === undefined) {
                return x;
            }
            return findRepresentative(element)[minSymbol];
        }
    }, {
        key: 'isMinElement',
        value: function isMinElement(x) {
            var y = this.get(x);
            return y === x || Uint64.equal(y, x);
        }
    }, {
        key: 'makeSet',
        value: function makeSet(x) {
            var key = x.toString();
            var map = this.map;

            var element = map.get(key);
            if (element === undefined) {
                element = x.clone();
                initializeElement(element);
                element[minSymbol] = element;
                map.set(key, element);
                return element;
            }
            return findRepresentative(element);
        }
    }, {
        key: 'link',
        value: function link(a, b) {
            a = this.makeSet(a);
            b = this.makeSet(b);
            if (a === b) {
                return false;
            }
            this.generation++;
            var newNode = linkUnequalSetRepresentatives(a, b);
            spliceCircularLists(a, b);
            var aMin = a[minSymbol];
            var bMin = b[minSymbol];
            newNode[minSymbol] = Uint64.less(aMin, bMin) ? aMin : bMin;
            return true;
        }
    }, {
        key: 'setElements',
        value: /*#__PURE__*/_regeneratorRuntime.mark(function setElements(a) {
            var key, element;
            return _regeneratorRuntime.wrap(function setElements$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            key = a.toString();
                            element = this.map.get(key);

                            if (!(element === undefined)) {
                                _context2.next = 7;
                                break;
                            }

                            _context2.next = 5;
                            return a;

                        case 5:
                            _context2.next = 8;
                            break;

                        case 7:
                            return _context2.delegateYield(setElementIterator(element), 't0', 8);

                        case 8:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, setElements, this);
        })
    }, {
        key: 'clear',
        value: function clear() {
            var map = this.map;

            if (map.size === 0) {
                return false;
            }
            ++this.generation;
            map.clear();
            return true;
        }
    }, {
        key: 'mappings',
        value: /*#__PURE__*/_regeneratorRuntime.mark(function mappings() {
            var temp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Array(2);

            var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, element;

            return _regeneratorRuntime.wrap(function mappings$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context3.prev = 3;
                            _iterator = _getIterator(this.map.values());

                        case 5:
                            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                _context3.next = 14;
                                break;
                            }

                            element = _step.value;

                            temp[0] = element;
                            temp[1] = findRepresentative(element)[minSymbol];
                            _context3.next = 11;
                            return temp;

                        case 11:
                            _iteratorNormalCompletion = true;
                            _context3.next = 5;
                            break;

                        case 14:
                            _context3.next = 20;
                            break;

                        case 16:
                            _context3.prev = 16;
                            _context3.t0 = _context3['catch'](3);
                            _didIteratorError = true;
                            _iteratorError = _context3.t0;

                        case 20:
                            _context3.prev = 20;
                            _context3.prev = 21;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }

                        case 23:
                            _context3.prev = 23;

                            if (!_didIteratorError) {
                                _context3.next = 26;
                                break;
                            }

                            throw _iteratorError;

                        case 26:
                            return _context3.finish(23);

                        case 27:
                            return _context3.finish(20);

                        case 28:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, mappings, this, [[3, 16, 20, 28], [21,, 23, 27]]);
        })
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.mappings();
        }
        /**
         * Returns an array of arrays of strings, where the arrays contained in the outer array correspond
         * to the disjoint sets, and the strings are the base-10 string representations of the members of
         * each set.  The members are sorted in numerical order, and the sets are sorted in numerical
         * order of their smallest elements.
         */

    }, {
        key: 'toJSON',
        value: function toJSON() {
            var sets = new Array();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.map.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var element = _step2.value;

                    if (isRootElement(element)) {
                        var members = new Array();
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = _getIterator(setElementIterator(element)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var member = _step3.value;

                                members.push(member);
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

                        members.sort(Uint64.compare);
                        sets.push(members);
                    }
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

            sets.sort(function (a, b) {
                return Uint64.compare(a[0], b[0]);
            });
            return sets.map(function (set) {
                return set.map(function (element) {
                    return element.toString();
                });
            });
        }
    }, {
        key: 'size',
        get: function get() {
            return this.map.size;
        }
    }]);

    return DisjointUint64Sets;
}();
//# sourceMappingURL=disjoint_sets.js.map