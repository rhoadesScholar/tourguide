import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _get from 'babel-runtime/helpers/get';
import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { hashCombine } from './hash_function';
import { getRandomValues } from '../util/random';
import { Uint64 } from '../util/uint64';
export var NUM_ALTERNATIVES = 3;
var DEFAULT_LOAD_FACTOR = 0.9;
var DEBUG = false;
// Key that needs to be inserted.  Temporary variables used during insert.  These can safely be
// global because control never leaves functions defined in this module while these are in use.
var pendingLow = 0,
    pendingHigh = 0,
    backupPendingLow = 0,
    backupPendingHigh = 0;
export var HashTableBase = function () {
    function HashTableBase() {
        var hashSeeds = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : HashTableBase.generateHashSeeds(NUM_ALTERNATIVES);

        _classCallCheck(this, HashTableBase);

        this.hashSeeds = hashSeeds;
        this.loadFactor = DEFAULT_LOAD_FACTOR;
        this.size = 0;
        this.emptyLow = 4294967295;
        this.emptyHigh = 4294967295;
        this.maxRehashAttempts = 5;
        this.maxAttempts = 5;
        this.generation = 0;
        this.mungedEmptyKey = -1;
        // Minimum size must be greater than 2 * hashSeeds.length.  Otherwise, tableWithMungedEmptyKey
        // may loop infinitely.
        var initialSize = 8;
        while (initialSize < 2 * hashSeeds.length) {
            initialSize *= 2;
        }
        this.allocate(initialSize);
    }

    _createClass(HashTableBase, [{
        key: 'updateHashFunctions',
        value: function updateHashFunctions(numHashes) {
            this.hashSeeds = HashTableBase.generateHashSeeds(numHashes);
            this.mungedEmptyKey = -1;
        }
        /**
         * Invokes callback with a modified version of the hash table data array.
         *
         * Replaces all slots that appear to be valid entries for (emptyLow, emptyHigh), i.e. slots that
         * contain (emptyLow, emptyHigh) and to which (emptyLow, emptyHigh) hashes, with (mungedEmptyKey,
         * mungedEmptyKey).
         *
         * mungedEmptyKey is chosen to be a 32-bit value with the property that the 64-bit value
         * (mungedEmptyKey, mungedEmptyKey) does not hash to any of the same slots as (emptyLow,
         * emptyHigh).
         *
         * This allows the modified data array to be used for lookups without special casing the empty
         * key.
         */

    }, {
        key: 'tableWithMungedEmptyKey',
        value: function tableWithMungedEmptyKey(callback) {
            var numHashes = this.hashSeeds.length;
            var emptySlots = new Array(numHashes);
            for (var i = 0; i < numHashes; ++i) {
                emptySlots[i] = this.getHash(i, this.emptyLow, this.emptyHigh);
            }
            var mungedEmptyKey = this.mungedEmptyKey;

            if (mungedEmptyKey === -1) {
                chooseMungedEmptyKey: while (true) {
                    mungedEmptyKey = Math.random() * 0x1000000 >>> 0;
                    for (var _i = 0; _i < numHashes; ++_i) {
                        var h = this.getHash(_i, mungedEmptyKey, mungedEmptyKey);
                        for (var j = 0; j < numHashes; ++j) {
                            if (emptySlots[j] === h) {
                                continue chooseMungedEmptyKey;
                            }
                        }
                    }
                    this.mungedEmptyKey = mungedEmptyKey;
                    break;
                }
            }
            var table = this.table,
                emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh;

            for (var _i2 = 0; _i2 < numHashes; ++_i2) {
                var _h = emptySlots[_i2];
                if (table[_h] === emptyLow && table[_h + 1] === emptyHigh) {
                    table[_h] = mungedEmptyKey;
                    table[_h + 1] = mungedEmptyKey;
                }
            }
            try {
                callback(table);
            } finally {
                for (var _i3 = 0; _i3 < numHashes; ++_i3) {
                    var _h2 = emptySlots[_i3];
                    if (table[_h2] === mungedEmptyKey && table[_h2 + 1] === mungedEmptyKey) {
                        table[_h2] = emptyLow;
                        table[_h2 + 1] = emptyHigh;
                    }
                }
            }
        }
    }, {
        key: 'getHash',
        value: function getHash(hashIndex, low, high) {
            var hash = this.hashSeeds[hashIndex];
            hash = hashCombine(hash, low);
            hash = hashCombine(hash, high);
            return this.entryStride * (hash & this.tableSize - 1);
        }
        /**
         * Iterates over the Uint64 keys contained in the hash set.
         *
         * The same temp value will be modified and yielded at every iteration.
         */

    }, {
        key: 'keys',
        value: /*#__PURE__*/_regeneratorRuntime.mark(function keys() {
            var temp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Uint64();
            var emptyLow, emptyHigh, entryStride, table, i, length, low, high;
            return _regeneratorRuntime.wrap(function keys$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            emptyLow = this.emptyLow, emptyHigh = this.emptyHigh, entryStride = this.entryStride;
                            table = this.table;
                            i = 0, length = table.length;

                        case 3:
                            if (!(i < length)) {
                                _context.next = 13;
                                break;
                            }

                            low = table[i], high = table[i + 1];

                            if (!(low !== emptyLow || high !== emptyHigh)) {
                                _context.next = 10;
                                break;
                            }

                            temp.low = low;
                            temp.high = high;
                            _context.next = 10;
                            return temp;

                        case 10:
                            i += entryStride;
                            _context.next = 3;
                            break;

                        case 13:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, keys, this);
        })
    }, {
        key: 'indexOfPair',
        value: function indexOfPair(low, high) {
            var table = this.table,
                emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh;

            if (low === emptyLow && high === emptyHigh) {
                return -1;
            }
            for (var i = 0, numHashes = this.hashSeeds.length; i < numHashes; ++i) {
                var h = this.getHash(i, low, high);
                if (table[h] === low && table[h + 1] === high) {
                    return h;
                }
            }
            return -1;
        }
        /**
         * Returns the offset into the hash table of the specified element, or -1 if the element is not
         * present.
         */

    }, {
        key: 'indexOf',
        value: function indexOf(x) {
            return this.indexOfPair(x.low, x.high);
        }
        /**
         * Changes the empty key to a value that is not equal to the current empty key and is not present
         * in the table.
         *
         * This is called when an attempt is made to insert the empty key.
         */

    }, {
        key: 'chooseAnotherEmptyKey',
        value: function chooseAnotherEmptyKey() {
            var emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh,
                table = this.table,
                entryStride = this.entryStride;

            var newLow = void 0,
                newHigh = void 0;
            while (true) {
                newLow = Math.random() * 0x100000000 >>> 0;
                newHigh = Math.random() * 0x100000000 >>> 0;
                if (newLow === emptyLow && newHigh === emptyHigh) {
                    continue;
                }
                if (this.hasPair(newLow, newHigh)) {
                    continue;
                }
                break;
            }
            this.emptyLow = newLow;
            this.emptyHigh = newHigh;
            // Replace empty keys in the table.
            for (var h = 0, length = table.length; h < length; h += entryStride) {
                if (table[h] === emptyLow && table[h + 1] === emptyHigh) {
                    table[h] = newLow;
                    table[h + 1] = newHigh;
                }
            }
        }
        /**
         * Returns true iff the specified element is present.
         */

    }, {
        key: 'has',
        value: function has(x) {
            return this.indexOf(x) !== -1;
        }
        /**
         * Returns true iff the specified element is present.
         */

    }, {
        key: 'hasPair',
        value: function hasPair(low, high) {
            return this.indexOfPair(low, high) !== -1;
        }
    }, {
        key: 'delete',
        value: function _delete(x) {
            var index = this.indexOf(x);
            if (index !== -1) {
                var table = this.table;

                table[index] = this.emptyLow;
                table[index + 1] = this.emptyHigh;
                ++this.generation;
                this.size--;
                return true;
            }
            return false;
        }
    }, {
        key: 'clearTable',
        value: function clearTable() {
            var table = this.table,
                entryStride = this.entryStride,
                emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh;

            var length = table.length;
            for (var h = 0; h < length; h += entryStride) {
                table[h] = emptyLow;
                table[h + 1] = emptyHigh;
            }
        }
    }, {
        key: 'clear',
        value: function clear() {
            if (this.size === 0) {
                return false;
            }
            this.size = 0;
            ++this.generation;
            this.clearTable();
            return true;
        }
    }, {
        key: 'swapPending',
        value: function swapPending(table, offset) {
            var tempLow = pendingLow,
                tempHigh = pendingHigh;
            this.storePending(table, offset);
            table[offset] = tempLow;
            table[offset + 1] = tempHigh;
        }
    }, {
        key: 'storePending',
        value: function storePending(table, offset) {
            pendingLow = table[offset];
            pendingHigh = table[offset + 1];
        }
    }, {
        key: 'backupPending',
        value: function backupPending() {
            backupPendingLow = pendingLow;
            backupPendingHigh = pendingHigh;
        }
    }, {
        key: 'restorePending',
        value: function restorePending() {
            pendingLow = backupPendingLow;
            pendingHigh = backupPendingHigh;
        }
    }, {
        key: 'tryToInsert',
        value: function tryToInsert() {
            if (DEBUG) {
                console.log('tryToInsert: ' + pendingLow + ', ' + pendingHigh);
            }
            var attempt = 0;
            var emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh,
                maxAttempts = this.maxAttempts,
                table = this.table;

            var numHashes = this.hashSeeds.length;
            var tableIndex = Math.floor(Math.random() * numHashes);
            while (true) {
                var h = this.getHash(tableIndex, pendingLow, pendingHigh);
                this.swapPending(table, h);
                if (pendingLow === emptyLow && pendingHigh === emptyHigh) {
                    return true;
                }
                if (++attempt === maxAttempts) {
                    break;
                }
                tableIndex = (tableIndex + Math.floor(Math.random() * (numHashes - 1)) + 1) % numHashes;
            }
            return false;
        }
    }, {
        key: 'allocate',
        value: function allocate(tableSize) {
            this.tableSize = tableSize;
            var entryStride = this.entryStride;

            this.table = new Uint32Array(tableSize * entryStride);
            this.maxAttempts = tableSize;
            this.clearTable();
            this.capacity = tableSize * this.loadFactor;
            this.mungedEmptyKey = -1;
        }
    }, {
        key: 'rehash',
        value: function rehash(oldTable, tableSize) {
            if (DEBUG) {
                console.log('rehash begin');
            }
            this.allocate(tableSize);
            this.updateHashFunctions(this.hashSeeds.length);
            var emptyLow = this.emptyLow,
                emptyHigh = this.emptyHigh,
                entryStride = this.entryStride;

            for (var h = 0, length = oldTable.length; h < length; h += entryStride) {
                var low = oldTable[h],
                    high = oldTable[h + 1];
                if (low !== emptyLow || high !== emptyHigh) {
                    this.storePending(oldTable, h);
                    if (!this.tryToInsert()) {
                        if (DEBUG) {
                            console.log('rehash failed');
                        }
                        return false;
                    }
                }
            }
            if (DEBUG) {
                console.log('rehash end');
            }
            return true;
        }
    }, {
        key: 'grow',
        value: function grow(desiredTableSize) {
            if (DEBUG) {
                console.log('grow: ' + desiredTableSize);
            }
            var oldTable = this.table;
            var tableSize = this.tableSize;

            while (tableSize < desiredTableSize) {
                tableSize *= 2;
            }
            while (true) {
                for (var rehashAttempt = 0; rehashAttempt < this.maxRehashAttempts; ++rehashAttempt) {
                    if (this.rehash(oldTable, tableSize)) {
                        if (DEBUG) {
                            console.log('grow end');
                        }
                        return;
                    }
                }
                tableSize *= 2;
            }
        }
    }, {
        key: 'insertInternal',
        value: function insertInternal() {
            ++this.generation;
            if (pendingLow === this.emptyLow && pendingHigh === this.emptyHigh) {
                this.chooseAnotherEmptyKey();
            }
            if (++this.size > this.capacity) {
                this.backupPending();
                this.grow(this.tableSize * 2);
                this.restorePending();
            }
            while (!this.tryToInsert()) {
                this.backupPending();
                this.grow(this.tableSize);
                this.restorePending();
            }
        }
    }], [{
        key: 'generateHashSeeds',
        value: function generateHashSeeds() {
            var numAlternatives = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : NUM_ALTERNATIVES;

            return getRandomValues(new Uint32Array(numAlternatives));
        }
    }]);

    return HashTableBase;
}();
export var HashSetUint64 = function (_HashTableBase) {
    _inherits(HashSetUint64, _HashTableBase);

    function HashSetUint64() {
        _classCallCheck(this, HashSetUint64);

        return _possibleConstructorReturn(this, (HashSetUint64.__proto__ || _Object$getPrototypeOf(HashSetUint64)).apply(this, arguments));
    }

    _createClass(HashSetUint64, [{
        key: 'add',
        value: function add(x) {
            var low = x.low,
                high = x.high;

            if (this.hasPair(low, high)) {
                return false;
            }
            if (DEBUG) {
                console.log('add: ' + low + ',' + high);
            }
            pendingLow = low;
            pendingHigh = high;
            this.insertInternal();
            return true;
        }
        /**
         * Iterates over the keys.  The same temporary value will be modified and yielded at every
         * iteration.
         */

    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.keys();
        }
    }]);

    return HashSetUint64;
}(HashTableBase);
HashSetUint64.prototype.entryStride = 2;
// Value that needs to be inserted.  Temporary variables used during insert.  These can safely be
// global because control never leaves functions defined in this module while these are in use.
var pendingValueLow = 0,
    pendingValueHigh = 0,
    backupPendingValueLow = 0,
    backupPendingValueHigh = 0;
export var HashMapUint64 = function (_HashTableBase2) {
    _inherits(HashMapUint64, _HashTableBase2);

    function HashMapUint64() {
        _classCallCheck(this, HashMapUint64);

        return _possibleConstructorReturn(this, (HashMapUint64.__proto__ || _Object$getPrototypeOf(HashMapUint64)).apply(this, arguments));
    }

    _createClass(HashMapUint64, [{
        key: 'set',
        value: function set(key, value) {
            var low = key.low,
                high = key.high;

            if (this.hasPair(low, high)) {
                return false;
            }
            if (DEBUG) {
                console.log('add: ' + low + ',' + high + ' -> ' + value.low + ',' + value.high);
            }
            pendingLow = low;
            pendingHigh = high;
            pendingValueLow = value.low;
            pendingValueHigh = value.high;
            this.insertInternal();
            return true;
        }
    }, {
        key: 'get',
        value: function get(key, value) {
            var h = this.indexOf(key);
            if (h === -1) {
                return false;
            }
            var table = this.table;

            value.low = table[h + 2];
            value.high = table[h + 3];
            return true;
        }
    }, {
        key: 'swapPending',
        value: function swapPending(table, offset) {
            var tempLow = pendingValueLow,
                tempHigh = pendingValueHigh;
            _get(HashMapUint64.prototype.__proto__ || _Object$getPrototypeOf(HashMapUint64.prototype), 'swapPending', this).call(this, table, offset);
            table[offset + 2] = tempLow;
            table[offset + 3] = tempHigh;
        }
    }, {
        key: 'storePending',
        value: function storePending(table, offset) {
            _get(HashMapUint64.prototype.__proto__ || _Object$getPrototypeOf(HashMapUint64.prototype), 'storePending', this).call(this, table, offset);
            pendingValueLow = table[offset + 2];
            pendingValueHigh = table[offset + 3];
        }
    }, {
        key: 'backupPending',
        value: function backupPending() {
            _get(HashMapUint64.prototype.__proto__ || _Object$getPrototypeOf(HashMapUint64.prototype), 'backupPending', this).call(this);
            backupPendingValueLow = pendingValueLow;
            backupPendingValueHigh = pendingValueHigh;
        }
    }, {
        key: 'restorePending',
        value: function restorePending() {
            _get(HashMapUint64.prototype.__proto__ || _Object$getPrototypeOf(HashMapUint64.prototype), 'restorePending', this).call(this);
            pendingValueLow = backupPendingValueLow;
            pendingValueHigh = backupPendingValueHigh;
        }
        /**
         * Iterates over entries.  The same temporary value will be modified and yielded at every
         * iteration.
         */

    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.entries();
        }
        /**
         * Iterates over entries.  The same temporary value will be modified and yielded at every
         * iteration.
         */

    }, {
        key: 'entries',
        value: /*#__PURE__*/_regeneratorRuntime.mark(function entries() {
            var temp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [new Uint64(), new Uint64()];

            var emptyLow, emptyHigh, entryStride, table, _temp, key, value, i, length, low, high;

            return _regeneratorRuntime.wrap(function entries$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            emptyLow = this.emptyLow, emptyHigh = this.emptyHigh, entryStride = this.entryStride;
                            table = this.table;
                            _temp = _slicedToArray(temp, 2), key = _temp[0], value = _temp[1];
                            i = 0, length = table.length;

                        case 4:
                            if (!(i < length)) {
                                _context2.next = 16;
                                break;
                            }

                            low = table[i], high = table[i + 1];

                            if (!(low !== emptyLow || high !== emptyHigh)) {
                                _context2.next = 13;
                                break;
                            }

                            key.low = low;
                            key.high = high;
                            value.low = table[i + 2];
                            value.high = table[i + 3];
                            _context2.next = 13;
                            return temp;

                        case 13:
                            i += entryStride;
                            _context2.next = 4;
                            break;

                        case 16:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, entries, this);
        })
    }]);

    return HashMapUint64;
}(HashTableBase);
HashMapUint64.prototype.entryStride = 4;
//# sourceMappingURL=hash_table.js.map