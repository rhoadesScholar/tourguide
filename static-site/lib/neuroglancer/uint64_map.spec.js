import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
/**
 * @license
 * This work is a derivative of the Google Neuroglancer project,
 * Copyright 2016 Google Inc.
 * The Derivative Work is covered by
 * Copyright 2019 Howard Hughes Medical Institute
 *
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
import { Uint64Map } from './uint64_map';
import { Uint64 } from './util/uint64';
describe('Uint64Map', function () {
    it('basic', function () {
        var m = new Uint64Map();
        var k1 = new Uint64(1);
        var v1 = new Uint64(11);
        expect(m.has(k1)).toBe(false);
        expect(m.size).toBe(0);
        m.set(k1, v1);
        expect(m.has(k1)).toBe(true);
        expect(m.size).toBe(1);
        var k1Gotten = new Uint64();
        m.get(k1, k1Gotten);
        expect(k1Gotten).toEqual(v1);
        var k2 = new Uint64(2, 3);
        var v2 = new Uint64(22, 33);
        expect(m.has(k2)).toBe(false);
        m.set(k2, v2);
        expect(m.has(k1)).toBe(true);
        expect(m.has(k2)).toBe(true);
        expect(m.size).toBe(2);
        var k2Gotten = new Uint64();
        m.get(k2, k2Gotten);
        expect(k2Gotten).toEqual(v2);
        var v2a = new Uint64(222, 333);
        m.set(k2, v2a);
        expect(m.has(k1)).toBe(true);
        expect(m.has(k2)).toBe(true);
        expect(m.size).toBe(2);
        m.get(k2, k2Gotten);
        expect(k2Gotten).toEqual(v2);
        m.delete(k2);
        expect(m.has(k1)).toBe(true);
        expect(m.has(k2)).toBe(false);
        expect(m.size).toBe(1);
        m.set(k2, v2a);
        expect(m.has(k1)).toBe(true);
        expect(m.has(k2)).toBe(true);
        expect(m.size).toBe(2);
        m.get(k2, k2Gotten);
        expect(k2Gotten).toEqual(v2a);
        m.clear();
        expect(m.has(k1)).toBe(false);
        expect(m.has(k2)).toBe(false);
        expect(m.size).toBe(0);
    });
    it('iterate', function () {
        var m = new Uint64Map();
        var k1 = new Uint64(1);
        var v1 = new Uint64(11);
        var k2 = new Uint64(2, 3);
        var v2 = new Uint64(22, 33);
        var k3 = new Uint64(3, 4);
        var v3 = new Uint64(33, 44);
        m.set(k2, v2);
        m.set(k1, v1);
        m.set(k3, v3);
        var iterated = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(m), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ref = _step.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var k = _ref2[0];
                var v = _ref2[1];

                iterated.push([k.clone(), v.clone()]);
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

        iterated.sort(function (a, b) {
            return Uint64.compare(a[0], b[0]);
        });
        expect(iterated).toEqual([[k1, v1], [k2, v2], [k3, v3]]);
    });
    it('toJSON', function () {
        var m = new Uint64Map();
        var k1 = new Uint64(1);
        var v1 = new Uint64(11);
        var k2 = new Uint64(2, 3);
        var v2 = new Uint64(22, 33);
        var k3 = new Uint64(3, 4);
        var v3 = new Uint64(33, 44);
        m.set(k2, v2);
        m.set(k1, v1);
        m.set(k3, v3);
        var json = m.toJSON();
        var expected = {};
        expected[k1.toString()] = v1.toString();
        expected[k2.toString()] = v2.toString();
        expected[k3.toString()] = v3.toString();
        expect(json).toEqual(expected);
        expect(json.hasOwnProperty(k1.toString())).toBe(true);
        expect(json.hasOwnProperty(k2.toString())).toBe(true);
        expect(json.hasOwnProperty(k3.toString())).toBe(true);
    });
});
//# sourceMappingURL=uint64_map.spec.js.map