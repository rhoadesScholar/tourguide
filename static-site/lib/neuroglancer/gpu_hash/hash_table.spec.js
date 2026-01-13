import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _getIterator from 'babel-runtime/core-js/get-iterator';
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
import { HashMapUint64, HashSetUint64 } from './hash_table';
import { Uint64 } from '../util/uint64';
describe('gpu_hash/hash_table', function () {
    it('HashSetUint64', function () {
        var ht = new HashSetUint64();
        var set = new _Set();
        function compareViaIterate() {
            var htValues = new _Set();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(ht), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var v = _step.value;

                    var s = v.toString();
                    expect(htValues.has(s)).toBe(false, 'Duplicate key in hash table: ' + s);
                    expect(set.has(s)).toBe(true, 'Unexpected key ' + s + ' in hash table');
                    htValues.add(s);
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
                for (var _iterator2 = _getIterator(set), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var s = _step2.value;

                    expect(htValues.has(s)).toBe(true, 'Hash table is missing key ' + s);
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
        function compareViaHas() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(set), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var s = _step3.value;

                    var k = Uint64.parseString(s);
                    expect(ht.has(k)).toBe(true, 'Hash table is missing key ' + s);
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
        function compare() {
            compareViaIterate();
            compareViaHas();
        }
        var numInsertions = 100;
        function testInsert(k) {
            var s = '' + k;
            set.add(s);
            expect(ht.has(k)).toBe(false, 'Unexpected positive has result for ' + [k.low, k.high]);
            ht.add(k);
            compare();
        }
        var empty0 = new Uint64(ht.emptyLow, ht.emptyHigh);
        testInsert(empty0);
        for (var i = 0; i < numInsertions; ++i) {
            var k = void 0;
            var s = void 0;
            while (true) {
                k = Uint64.random();
                s = k.toString();
                if (!set.has(s)) {
                    break;
                }
            }
            testInsert(k);
        }
        var empty1 = new Uint64(ht.emptyLow, ht.emptyHigh);
        testInsert(empty1);
    });
    it('HashMapUint64', function () {
        var ht = new HashMapUint64();
        var map = new _Map();
        function compareViaIterate() {
            var htValues = new _Map();
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(ht), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref = _step4.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var key = _ref2[0];
                    var value = _ref2[1];

                    var s = key.toString();
                    expect(htValues.has(s)).toBe(false, 'Duplicate key in hash table: ' + s);
                    expect(map.has(s)).toBe(true, 'Unexpected key ' + s + ' in hash table');
                    htValues.set(s, value.clone());
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

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(map), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _ref3 = _step5.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var s = _ref4[0];
                    var _value = _ref4[1];

                    var v = htValues.get(s);
                    expect(v !== undefined && Uint64.equal(v, _value)).toBe(true, 'Hash table maps ' + s + ' -> ' + v + ' rather than -> ' + _value);
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
        }
        function compareViaGet() {
            var value = new Uint64();
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(map), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _ref5 = _step6.value;

                    var _ref6 = _slicedToArray(_ref5, 2);

                    var s = _ref6[0];
                    var expectedValue = _ref6[1];

                    var key = Uint64.parseString(s);
                    var has = ht.get(key, value);
                    expect(has && Uint64.equal(value, expectedValue)).toBe(true, 'Hash table maps ' + key + ' -> ' + (has ? value : undefined) + ' ' + ('rather than -> ' + expectedValue));
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
        }
        function compare() {
            compareViaIterate();
            compareViaGet();
        }
        var numInsertions = 100;
        function testInsert(k, v) {
            var s = '' + k;
            map.set(s, v);
            expect(ht.has(k)).toBe(false, 'Unexpected positive has result for ' + s);
            ht.set(k, v);
            compare();
        }
        var empty0 = new Uint64(ht.emptyLow, ht.emptyHigh);
        testInsert(empty0, Uint64.random());
        for (var i = 0; i < numInsertions; ++i) {
            var k = void 0;
            var s = void 0;
            while (true) {
                k = Uint64.random();
                s = k.toString();
                if (!map.has(s)) {
                    break;
                }
            }
            testInsert(k, Uint64.random());
        }
        var empty1 = new Uint64(ht.emptyLow, ht.emptyHigh);
        testInsert(empty1, Uint64.random());
    });
});
//# sourceMappingURL=hash_table.spec.js.map