import _Promise from "babel-runtime/core-js/promise";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _Set from "babel-runtime/core-js/set";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _toConsumableArray from "babel-runtime/helpers/toConsumableArray";
import _Map from "babel-runtime/core-js/map";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _get from "babel-runtime/helpers/get";
import _inherits from "babel-runtime/helpers/inherits";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
import { CHUNK_MANAGER_RPC_ID, CHUNK_QUEUE_MANAGER_RPC_ID, CHUNK_SOURCE_INVALIDATE_RPC_ID, ChunkDownloadStatistics, ChunkMemoryStatistics, ChunkPriorityTier, ChunkState, getChunkDownloadStatisticIndex, getChunkStateStatisticIndex, numChunkMemoryStatistics, numChunkStatistics, REQUEST_CHUNK_STATISTICS_RPC_ID } from "./base";
import { CancellationTokenSource } from "../util/cancellation";
import { RefCounted } from "../util/disposable";
import LinkedList0 from "../util/linked_list.0";
import LinkedList1 from "../util/linked_list.1";
import { StringMemoize } from "../util/memoize";
import PairingHeap0 from "../util/pairing_heap.0";
import PairingHeap1 from "../util/pairing_heap.1";
import { NullarySignal } from "../util/signal";
import { initializeSharedObjectCounterpart, registerPromiseRPC, registerRPC, registerSharedObject, registerSharedObjectOwner, SharedObject, SharedObjectCounterpart } from "../worker_rpc";
var DEBUG_CHUNK_UPDATES = false;
export var Chunk = function () {
    function Chunk() {
        _classCallCheck(this, Chunk);

        // Node properties used for eviction/promotion heaps and LRU linked lists.
        this.child0 = null;
        this.next0 = null;
        this.prev0 = null;
        this.child1 = null;
        this.next1 = null;
        this.prev1 = null;
        this.source = null;
        this.key = null;
        this.state_ = ChunkState.NEW;
        this.error = null;
        /**
         * Specifies existing priority within priority tier.  Only meaningful if priorityTier in
         * CHUNK_ORDERED_PRIORITY_TIERS.
         */
        this.priority = 0;
        /**
         * Specifies updated priority within priority tier, not yet reflected in priority queue state.
         * Only meaningful if newPriorityTier in CHUNK_ORDERED_PRIORITY_TIERS.
         */
        this.newPriority = 0;
        this.priorityTier = ChunkPriorityTier.RECENT;
        /**
         * Specifies updated priority tier, not yet reflected in priority queue state.
         */
        this.newPriorityTier = ChunkPriorityTier.RECENT;
        this.backendOnly = false;
        this.isComputational = false;
        this.newlyRequestedToFrontend = false;
        this.requestedToFrontend = false;
        /**
         * Cancellation token used to cancel the pending download.  Set to undefined except when state !==
         * DOWNLOADING.  This should not be accessed by code outside this module.
         */
        this.downloadCancellationToken = undefined;
    }

    _createClass(Chunk, [{
        key: "initialize",
        value: function initialize(key) {
            this.key = key;
            this.priority = Number.NEGATIVE_INFINITY;
            this.priorityTier = ChunkPriorityTier.RECENT;
            this.newPriority = Number.NEGATIVE_INFINITY;
            this.newPriorityTier = ChunkPriorityTier.RECENT;
            this.error = null;
            this.state = ChunkState.NEW;
            this.requestedToFrontend = false;
            this.newlyRequestedToFrontend = false;
        }
        /**
         * Sets this.priority{Tier,} to this.newPriority{Tier,}, and resets this.newPriorityTier to
         * ChunkPriorityTier.RECENT.
         *
         * This does not actually update any queues to reflect this change.
         */

    }, {
        key: "updatePriorityProperties",
        value: function updatePriorityProperties() {
            this.priorityTier = this.newPriorityTier;
            this.priority = this.newPriority;
            this.newPriorityTier = ChunkPriorityTier.RECENT;
            this.newPriority = Number.NEGATIVE_INFINITY;
            this.requestedToFrontend = this.newlyRequestedToFrontend;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.source = null;
            this.error = null;
        }
    }, {
        key: "downloadFailed",
        value: function downloadFailed(error) {
            this.error = error;
            this.queueManager.updateChunkState(this, ChunkState.FAILED);
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            this.queueManager.updateChunkState(this, ChunkState.SYSTEM_MEMORY_WORKER);
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {}
    }, {
        key: "serialize",
        value: function serialize(msg, _transfers) {
            msg['id'] = this.key;
            msg['source'] = this.source.rpcId;
            msg['new'] = true;
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.key;
        }
    }, {
        key: "registerListener",
        value: function registerListener(listener) {
            if (!this.source) {
                return false;
            }
            return this.source.registerChunkListener(this.key, listener);
        }
    }, {
        key: "unregisterListener",
        value: function unregisterListener(listener) {
            if (!this.source) {
                return false;
            }
            return this.source.unregisterChunkListener(this.key, listener);
        }
    }, {
        key: "chunkManager",
        get: function get() {
            return this.source.chunkManager;
        }
    }, {
        key: "queueManager",
        get: function get() {
            return this.source.chunkManager.queueManager;
        }
    }, {
        key: "state",
        set: function set(newState) {
            if (newState === this.state_) {
                return;
            }
            var oldState = this.state_;
            this.state_ = newState;
            this.source.chunkStateChanged(this, oldState);
        },
        get: function get() {
            return this.state_;
        }
    }, {
        key: "systemMemoryBytes",
        set: function set(bytes) {
            updateChunkStatistics(this, -1);
            this.chunkManager.queueManager.adjustCapacitiesForChunk(this, false);
            this.systemMemoryBytes_ = bytes;
            this.chunkManager.queueManager.adjustCapacitiesForChunk(this, true);
            updateChunkStatistics(this, 1);
            this.chunkManager.queueManager.scheduleUpdate();
        },
        get: function get() {
            return this.systemMemoryBytes_;
        }
    }, {
        key: "gpuMemoryBytes",
        set: function set(bytes) {
            updateChunkStatistics(this, -1);
            this.chunkManager.queueManager.adjustCapacitiesForChunk(this, false);
            this.gpuMemoryBytes_ = bytes;
            this.chunkManager.queueManager.adjustCapacitiesForChunk(this, true);
            updateChunkStatistics(this, 1);
            this.chunkManager.queueManager.scheduleUpdate();
        },
        get: function get() {
            return this.gpuMemoryBytes_;
        }
    }], [{
        key: "priorityLess",
        value: function priorityLess(a, b) {
            return a.priority < b.priority;
        }
    }, {
        key: "priorityGreater",
        value: function priorityGreater(a, b) {
            return a.priority > b.priority;
        }
    }]);

    return Chunk;
}();
var numSourceQueueLevels = 2;
/**
 * Base class inherited by both ChunkSource, for implementing the backend part of chunk sources that
 * also have a frontend-part, as well as other chunk sources, such as the GenericFileSource, that
 * has only a backend part.
 */
export var ChunkSourceBase = function (_SharedObject) {
    _inherits(ChunkSourceBase, _SharedObject);

    function ChunkSourceBase(chunkManager) {
        _classCallCheck(this, ChunkSourceBase);

        var _this = _possibleConstructorReturn(this, (ChunkSourceBase.__proto__ || _Object$getPrototypeOf(ChunkSourceBase)).call(this));

        _this.chunkManager = chunkManager;
        _this.listeners_ = new _Map();
        _this.chunks = new _Map();
        _this.freeChunks = new Array();
        _this.statistics = new Float64Array(numChunkStatistics);
        /**
         * sourceQueueLevel must be greater than the sourceQueueLevel of any ChunkSource whose download
         * method depends on chunks from this source.  A normal ChunkSource with no other dependencies
         * should have a level of 0.
         */
        _this.sourceQueueLevel = 0;
        chunkManager.queueManager.sources.add(_this);
        return _this;
    }

    _createClass(ChunkSourceBase, [{
        key: "disposed",
        value: function disposed() {
            this.chunkManager.queueManager.sources.delete(this);
            _get(ChunkSourceBase.prototype.__proto__ || _Object$getPrototypeOf(ChunkSourceBase.prototype), "disposed", this).call(this);
        }
    }, {
        key: "getNewChunk_",
        value: function getNewChunk_(chunkType) {
            var freeChunks = this.freeChunks;
            var freeChunksLength = freeChunks.length;
            if (freeChunksLength > 0) {
                var _chunk = freeChunks[freeChunksLength - 1];
                freeChunks.length = freeChunksLength - 1;
                _chunk.source = this;
                return _chunk;
            }
            var chunk = new chunkType();
            chunk.source = this;
            return chunk;
        }
        /**
         * Adds the specified chunk to the chunk cache.
         *
         * If the chunk cache was previously empty, also call this.addRef() to increment the reference
         * count.
         */

    }, {
        key: "addChunk",
        value: function addChunk(chunk) {
            var chunks = this.chunks;

            if (chunks.size === 0) {
                this.addRef();
            }
            chunks.set(chunk.key, chunk);
            updateChunkStatistics(chunk, 1);
        }
        /**
         * Remove the specified chunk from the chunk cache.
         *
         * If the chunk cache becomes empty, also call this.dispose() to decrement the reference count.
         */

    }, {
        key: "removeChunk",
        value: function removeChunk(chunk) {
            var chunks = this.chunks,
                freeChunks = this.freeChunks;

            chunks.delete(chunk.key);
            chunk.dispose();
            freeChunks[freeChunks.length] = chunk;
            if (chunks.size === 0) {
                this.dispose();
            }
        }
    }, {
        key: "registerChunkListener",
        value: function registerChunkListener(key, listener) {
            if (!this.listeners_.has(key)) {
                this.listeners_.set(key, [listener]);
            } else {
                this.listeners_.get(key).push(listener);
            }
            return true;
        }
    }, {
        key: "unregisterChunkListener",
        value: function unregisterChunkListener(key, listener) {
            if (!this.listeners_.has(key)) {
                return false;
            }
            var keyListeners = this.listeners_.get(key);
            var idx = keyListeners.indexOf(listener);
            if (idx < 0) {
                return false;
            }
            keyListeners.splice(idx, 1);
            if (keyListeners.length === 0) {
                this.listeners_.delete(key);
            }
            return true;
        }
    }, {
        key: "chunkStateChanged",
        value: function chunkStateChanged(chunk, oldState) {
            if (!chunk.key) {
                return;
            }
            if (!this.listeners_.has(chunk.key)) {
                return;
            }

            var _arr = [].concat(_toConsumableArray(this.listeners_.get(chunk.key)));

            for (var _i = 0; _i < _arr.length; _i++) {
                var listener = _arr[_i];
                listener.stateChanged(chunk, oldState);
            }
        }
    }]);

    return ChunkSourceBase;
}(SharedObject);
function updateChunkStatistics(chunk, sign) {
    var statistics = chunk.source.statistics;
    var systemMemoryBytes = chunk.systemMemoryBytes,
        gpuMemoryBytes = chunk.gpuMemoryBytes;

    var index = getChunkStateStatisticIndex(chunk.state, chunk.priorityTier);
    statistics[index * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks] += sign;
    statistics[index * numChunkMemoryStatistics + ChunkMemoryStatistics.systemMemoryBytes] += sign * systemMemoryBytes;
    statistics[index * numChunkMemoryStatistics + ChunkMemoryStatistics.gpuMemoryBytes] += sign * gpuMemoryBytes;
}
export var ChunkSource = function (_ChunkSourceBase) {
    _inherits(ChunkSource, _ChunkSourceBase);

    function ChunkSource(rpc, options) {
        _classCallCheck(this, ChunkSource);

        // No need to add a reference, since the owner counterpart will hold a reference to the owner
        // counterpart of chunkManager.
        var chunkManager = rpc.get(options['chunkManager']);

        var _this2 = _possibleConstructorReturn(this, (ChunkSource.__proto__ || _Object$getPrototypeOf(ChunkSource)).call(this, chunkManager));

        initializeSharedObjectCounterpart(_this2, rpc, options);
        return _this2;
    }

    return ChunkSource;
}(ChunkSourceBase);
function startChunkDownload(chunk) {
    var downloadCancellationToken = chunk.downloadCancellationToken = new CancellationTokenSource();
    var startTime = Date.now();
    chunk.source.download(chunk, downloadCancellationToken).then(function () {
        if (chunk.downloadCancellationToken === downloadCancellationToken) {
            chunk.downloadCancellationToken = undefined;
            var endTime = Date.now();
            var statistics = chunk.source.statistics;

            statistics[getChunkDownloadStatisticIndex(ChunkDownloadStatistics.totalTime)] += endTime - startTime;
            ++statistics[getChunkDownloadStatisticIndex(ChunkDownloadStatistics.totalChunks)];
            chunk.downloadSucceeded();
        }
    }, function (error) {
        if (chunk.downloadCancellationToken === downloadCancellationToken) {
            chunk.downloadCancellationToken = undefined;
            chunk.downloadFailed(error);
            console.log("Error retrieving chunk " + chunk + ": " + error);
        }
    });
}
function cancelChunkDownload(chunk) {
    var token = chunk.downloadCancellationToken;
    chunk.downloadCancellationToken = undefined;
    token.cancel();
}

var ChunkPriorityQueue = function () {
    function ChunkPriorityQueue(heapOperations, linkedListOperations) {
        _classCallCheck(this, ChunkPriorityQueue);

        this.heapOperations = heapOperations;
        this.linkedListOperations = linkedListOperations;
        /**
         * Heap roots for VISIBLE and PREFETCH priority tiers.
         */
        this.heapRoots = [null, null];
        /**
         * Head node for RECENT linked list.
         */
        this.recentHead = new Chunk();
        linkedListOperations.initializeHead(this.recentHead);
    }

    _createClass(ChunkPriorityQueue, [{
        key: "add",
        value: function add(chunk) {
            var priorityTier = chunk.priorityTier;
            if (priorityTier === ChunkPriorityTier.RECENT) {
                this.linkedListOperations.insertAfter(this.recentHead, chunk);
            } else {
                var heapRoots = this.heapRoots;

                heapRoots[priorityTier] = this.heapOperations.meld(heapRoots[priorityTier], chunk);
            }
        }
    }, {
        key: "candidates",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function candidates() {
            var linkedListOperations, recentHead, chunk, heapRoots, tier, root, _heapRoots, _tier, _root, _linkedListOperations, _recentHead, _chunk2;

            return _regeneratorRuntime.wrap(function candidates$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!(this.heapOperations.compare === Chunk.priorityLess)) {
                                _context.next = 30;
                                break;
                            }

                            // Start with least-recently used RECENT chunk.
                            linkedListOperations = this.linkedListOperations, recentHead = this.recentHead;

                        case 2:
                            if (!true) {
                                _context.next = 12;
                                break;
                            }

                            chunk = linkedListOperations.back(recentHead);

                            if (!(chunk == null)) {
                                _context.next = 8;
                                break;
                            }

                            return _context.abrupt("break", 12);

                        case 8:
                            _context.next = 10;
                            return chunk;

                        case 10:
                            _context.next = 2;
                            break;

                        case 12:
                            heapRoots = this.heapRoots;
                            tier = ChunkPriorityTier.LAST_ORDERED_TIER;

                        case 14:
                            if (!(tier >= ChunkPriorityTier.FIRST_ORDERED_TIER)) {
                                _context.next = 28;
                                break;
                            }

                        case 15:
                            if (!true) {
                                _context.next = 25;
                                break;
                            }

                            root = heapRoots[tier];

                            if (!(root == null)) {
                                _context.next = 21;
                                break;
                            }

                            return _context.abrupt("break", 25);

                        case 21:
                            _context.next = 23;
                            return root;

                        case 23:
                            _context.next = 15;
                            break;

                        case 25:
                            --tier;
                            _context.next = 14;
                            break;

                        case 28:
                            _context.next = 57;
                            break;

                        case 30:
                            _heapRoots = this.heapRoots;
                            _tier = ChunkPriorityTier.FIRST_ORDERED_TIER;

                        case 32:
                            if (!(_tier <= ChunkPriorityTier.LAST_ORDERED_TIER)) {
                                _context.next = 46;
                                break;
                            }

                        case 33:
                            if (!true) {
                                _context.next = 43;
                                break;
                            }

                            _root = _heapRoots[_tier];

                            if (!(_root == null)) {
                                _context.next = 39;
                                break;
                            }

                            return _context.abrupt("break", 43);

                        case 39:
                            _context.next = 41;
                            return _root;

                        case 41:
                            _context.next = 33;
                            break;

                        case 43:
                            ++_tier;
                            _context.next = 32;
                            break;

                        case 46:
                            _linkedListOperations = this.linkedListOperations, _recentHead = this.recentHead;

                        case 47:
                            if (!true) {
                                _context.next = 57;
                                break;
                            }

                            _chunk2 = _linkedListOperations.front(_recentHead);

                            if (!(_chunk2 == null)) {
                                _context.next = 53;
                                break;
                            }

                            return _context.abrupt("break", 57);

                        case 53:
                            _context.next = 55;
                            return _chunk2;

                        case 55:
                            _context.next = 47;
                            break;

                        case 57:
                        case "end":
                            return _context.stop();
                    }
                }
            }, candidates, this);
        })
        /**
         * Deletes a chunk from this priority queue.
         * @param chunk The chunk to delete from the priority queue.
         */

    }, {
        key: "delete",
        value: function _delete(chunk) {
            var priorityTier = chunk.priorityTier;
            if (priorityTier === ChunkPriorityTier.RECENT) {
                this.linkedListOperations.pop(chunk);
            } else {
                var heapRoots = this.heapRoots;
                heapRoots[priorityTier] = this.heapOperations.remove(heapRoots[priorityTier], chunk);
            }
        }
    }]);

    return ChunkPriorityQueue;
}();

function makeChunkPriorityQueue0(compare) {
    return new ChunkPriorityQueue(new PairingHeap0(compare), LinkedList0);
}
function makeChunkPriorityQueue1(compare) {
    return new ChunkPriorityQueue(new PairingHeap1(compare), LinkedList1);
}
function tryToFreeCapacity(size, capacity, priorityTier, priority, evictionCandidates, evict) {
    while (capacity.availableItems < 1 || capacity.availableSize < size) {
        var evictionCandidate = evictionCandidates.next().value;
        if (evictionCandidate === undefined) {
            // No eviction candidates available, promotions are done.
            return false;
        } else {
            var evictionTier = evictionCandidate.priorityTier;
            if (evictionTier < priorityTier || evictionTier === priorityTier && evictionCandidate.priority >= priority) {
                // Lowest priority eviction candidate has priority >= highest
                // priority promotion candidate.  No more promotions are
                // possible.
                return false;
            }
            evict(evictionCandidate);
        }
    }
    return true;
}

var AvailableCapacity = function (_RefCounted) {
    _inherits(AvailableCapacity, _RefCounted);

    function AvailableCapacity(itemLimit, sizeLimit) {
        _classCallCheck(this, AvailableCapacity);

        var _this3 = _possibleConstructorReturn(this, (AvailableCapacity.__proto__ || _Object$getPrototypeOf(AvailableCapacity)).call(this));

        _this3.itemLimit = itemLimit;
        _this3.sizeLimit = sizeLimit;
        _this3.currentSize = 0;
        _this3.currentItems = 0;
        _this3.capacityChanged = new NullarySignal();
        _this3.registerDisposer(itemLimit.changed.add(_this3.capacityChanged.dispatch));
        _this3.registerDisposer(sizeLimit.changed.add(_this3.capacityChanged.dispatch));
        return _this3;
    }
    /**
     * Adjust available capacity by the specified amounts.
     */


    _createClass(AvailableCapacity, [{
        key: "adjust",
        value: function adjust(items, size) {
            this.currentItems -= items;
            this.currentSize -= size;
        }
    }, {
        key: "availableSize",
        get: function get() {
            return this.sizeLimit.value - this.currentSize;
        }
    }, {
        key: "availableItems",
        get: function get() {
            return this.itemLimit.value - this.currentItems;
        }
    }]);

    return AvailableCapacity;
}(RefCounted);

var ChunkQueueManager = function (_SharedObjectCounterp) {
    _inherits(ChunkQueueManager, _SharedObjectCounterp);

    function ChunkQueueManager(rpc, options) {
        _classCallCheck(this, ChunkQueueManager);

        /**
         * Set of chunk sources associated with this queue manager.
         */
        var _this4 = _possibleConstructorReturn(this, (ChunkQueueManager.__proto__ || _Object$getPrototypeOf(ChunkQueueManager)).call(this, rpc, options));

        _this4.sources = new _Set();
        /**
         * Contains all chunks in QUEUED state pending download, for each sourceQueueLevel.
         */
        _this4.queuedDownloadPromotionQueue = [makeChunkPriorityQueue1(Chunk.priorityGreater), makeChunkPriorityQueue1(Chunk.priorityGreater)];
        /**
         * Contains all chunks in QUEUED state pending compute.
         */
        _this4.queuedComputePromotionQueue = makeChunkPriorityQueue1(Chunk.priorityGreater);
        /**
         * Contains all chunks in DOWNLOADING state, for each sourceQueueLevel.
         */
        _this4.downloadEvictionQueue = [makeChunkPriorityQueue1(Chunk.priorityLess), makeChunkPriorityQueue1(Chunk.priorityLess)];
        /**
         * Contains all chunks in COMPUTING state.
         */
        _this4.computeEvictionQueue = makeChunkPriorityQueue1(Chunk.priorityLess);
        /**
         * Contains all chunks that take up memory (DOWNLOADING, SYSTEM_MEMORY,
         * GPU_MEMORY).
         */
        _this4.systemMemoryEvictionQueue = makeChunkPriorityQueue0(Chunk.priorityLess);
        /**
         * Contains all chunks in SYSTEM_MEMORY state not in RECENT priority tier.
         */
        _this4.gpuMemoryPromotionQueue = makeChunkPriorityQueue1(Chunk.priorityGreater);
        /**
         * Contains all chunks in GPU_MEMORY state.
         */
        _this4.gpuMemoryEvictionQueue = makeChunkPriorityQueue1(Chunk.priorityLess);
        _this4.updatePending = null;
        _this4.numQueued = 0;
        _this4.numFailed = 0;
        var getCapacity = function getCapacity(capacity) {
            var result = _this4.registerDisposer(new AvailableCapacity(rpc.get(capacity['itemLimit']), rpc.get(capacity['sizeLimit'])));
            result.capacityChanged.add(function () {
                return _this4.scheduleUpdate();
            });
            return result;
        };
        _this4.gpuMemoryCapacity = getCapacity(options['gpuMemoryCapacity']);
        _this4.systemMemoryCapacity = getCapacity(options['systemMemoryCapacity']);
        _this4.downloadCapacity = [getCapacity(options['downloadCapacity']), getCapacity(options['downloadCapacity'])];
        _this4.computeCapacity = getCapacity(options['computeCapacity']);
        console.log('Chunk queue manager constructed', _this4);
        return _this4;
    }

    _createClass(ChunkQueueManager, [{
        key: "scheduleUpdate",
        value: function scheduleUpdate() {
            // console.log('Chunk queue manager scheduling update');
            if (this.updatePending === null) {
                this.updatePending = setTimeout(this.process.bind(this), 0);
            }
        }
    }, {
        key: "chunkQueuesForChunk",
        value: /*#__PURE__*/_regeneratorRuntime.mark(function chunkQueuesForChunk(chunk) {
            return _regeneratorRuntime.wrap(function chunkQueuesForChunk$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            _context2.t0 = chunk.state;
                            _context2.next = _context2.t0 === ChunkState.QUEUED ? 3 : _context2.t0 === ChunkState.DOWNLOADING ? 11 : _context2.t0 === ChunkState.SYSTEM_MEMORY_WORKER ? 21 : _context2.t0 === ChunkState.SYSTEM_MEMORY ? 21 : _context2.t0 === ChunkState.GPU_MEMORY ? 27 : 32;
                            break;

                        case 3:
                            if (!chunk.isComputational) {
                                _context2.next = 8;
                                break;
                            }

                            _context2.next = 6;
                            return this.queuedComputePromotionQueue;

                        case 6:
                            _context2.next = 10;
                            break;

                        case 8:
                            _context2.next = 10;
                            return this.queuedDownloadPromotionQueue[chunk.source.sourceQueueLevel];

                        case 10:
                            return _context2.abrupt("break", 32);

                        case 11:
                            if (!chunk.isComputational) {
                                _context2.next = 16;
                                break;
                            }

                            _context2.next = 14;
                            return this.computeEvictionQueue;

                        case 14:
                            _context2.next = 20;
                            break;

                        case 16:
                            _context2.next = 18;
                            return this.downloadEvictionQueue[chunk.source.sourceQueueLevel];

                        case 18:
                            _context2.next = 20;
                            return this.systemMemoryEvictionQueue;

                        case 20:
                            return _context2.abrupt("break", 32);

                        case 21:
                            _context2.next = 23;
                            return this.systemMemoryEvictionQueue;

                        case 23:
                            if (!(chunk.priorityTier !== ChunkPriorityTier.RECENT && !chunk.backendOnly && chunk.requestedToFrontend)) {
                                _context2.next = 26;
                                break;
                            }

                            _context2.next = 26;
                            return this.gpuMemoryPromotionQueue;

                        case 26:
                            return _context2.abrupt("break", 32);

                        case 27:
                            _context2.next = 29;
                            return this.systemMemoryEvictionQueue;

                        case 29:
                            _context2.next = 31;
                            return this.gpuMemoryEvictionQueue;

                        case 31:
                            return _context2.abrupt("break", 32);

                        case 32:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, chunkQueuesForChunk, this);
        })
    }, {
        key: "adjustCapacitiesForChunk",
        value: function adjustCapacitiesForChunk(chunk, add) {
            var factor = add ? -1 : 1;
            switch (chunk.state) {
                case ChunkState.FAILED:
                    this.numFailed -= factor;
                    break;
                case ChunkState.QUEUED:
                    this.numQueued -= factor;
                    break;
                case ChunkState.DOWNLOADING:
                    (chunk.isComputational ? this.computeCapacity : this.downloadCapacity[chunk.source.sourceQueueLevel]).adjust(factor, factor * chunk.systemMemoryBytes);
                    this.systemMemoryCapacity.adjust(factor, factor * chunk.systemMemoryBytes);
                    break;
                case ChunkState.SYSTEM_MEMORY:
                case ChunkState.SYSTEM_MEMORY_WORKER:
                    this.systemMemoryCapacity.adjust(factor, factor * chunk.systemMemoryBytes);
                    break;
                case ChunkState.GPU_MEMORY:
                    this.systemMemoryCapacity.adjust(factor, factor * chunk.systemMemoryBytes);
                    this.gpuMemoryCapacity.adjust(factor, factor * chunk.gpuMemoryBytes);
                    break;
            }
        }
    }, {
        key: "removeChunkFromQueues_",
        value: function removeChunkFromQueues_(chunk) {
            updateChunkStatistics(chunk, -1);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.chunkQueuesForChunk(chunk)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var queue = _step.value;

                    queue.delete(chunk);
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
        // var freedChunks = 0;

    }, {
        key: "addChunkToQueues_",
        value: function addChunkToQueues_(chunk) {
            if (chunk.state === ChunkState.QUEUED && chunk.priorityTier === ChunkPriorityTier.RECENT) {
                // Delete this chunk.
                var source = chunk.source;

                source.removeChunk(chunk);
                this.adjustCapacitiesForChunk(chunk, false);
                return false;
            } else {
                updateChunkStatistics(chunk, 1);
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(this.chunkQueuesForChunk(chunk)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var queue = _step2.value;

                        queue.add(chunk);
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

                return true;
            }
        }
    }, {
        key: "performChunkPriorityUpdate",
        value: function performChunkPriorityUpdate(chunk) {
            if (chunk.priorityTier === chunk.newPriorityTier && chunk.priority === chunk.newPriority) {
                chunk.newPriorityTier = ChunkPriorityTier.RECENT;
                chunk.newPriority = Number.NEGATIVE_INFINITY;
                return;
            }
            if (DEBUG_CHUNK_UPDATES) {
                console.log(chunk + ": changed priority " + chunk.priorityTier + ":" + (chunk.priority + " -> " + chunk.newPriorityTier + ":" + chunk.newPriority));
            }
            this.removeChunkFromQueues_(chunk);
            chunk.updatePriorityProperties();
            if (chunk.state === ChunkState.NEW) {
                chunk.state = ChunkState.QUEUED;
                this.adjustCapacitiesForChunk(chunk, true);
            }
            this.addChunkToQueues_(chunk);
        }
    }, {
        key: "updateChunkState",
        value: function updateChunkState(chunk, newState) {
            if (newState === chunk.state) {
                return;
            }
            if (DEBUG_CHUNK_UPDATES) {
                console.log(chunk + ": changed state " + chunk.state + " -> " + newState);
            }
            this.adjustCapacitiesForChunk(chunk, false);
            this.removeChunkFromQueues_(chunk);
            chunk.state = newState;
            this.adjustCapacitiesForChunk(chunk, true);
            this.addChunkToQueues_(chunk);
            this.scheduleUpdate();
        }
    }, {
        key: "processGPUPromotions_",
        value: function processGPUPromotions_() {
            var queueManager = this;
            function evictFromGPUMemory(chunk) {
                queueManager.freeChunkGPUMemory(chunk);
                chunk.source.chunkManager.queueManager.updateChunkState(chunk, ChunkState.SYSTEM_MEMORY);
            }
            var promotionCandidates = this.gpuMemoryPromotionQueue.candidates();
            var evictionCandidates = this.gpuMemoryEvictionQueue.candidates();
            var capacity = this.gpuMemoryCapacity;
            while (true) {
                var promotionCandidate = promotionCandidates.next().value;
                if (promotionCandidate === undefined) {
                    break;
                } else {
                    var priorityTier = promotionCandidate.priorityTier;
                    var priority = promotionCandidate.priority;
                    if (!tryToFreeCapacity(promotionCandidate.gpuMemoryBytes, capacity, priorityTier, priority, evictionCandidates, evictFromGPUMemory)) {
                        break;
                    }
                    this.copyChunkToGPU(promotionCandidate);
                    this.updateChunkState(promotionCandidate, ChunkState.GPU_MEMORY);
                }
            }
        }
    }, {
        key: "freeChunkGPUMemory",
        value: function freeChunkGPUMemory(chunk) {
            this.rpc.invoke('Chunk.update', { 'id': chunk.key, 'state': ChunkState.SYSTEM_MEMORY, 'source': chunk.source.rpcId });
        }
    }, {
        key: "freeChunkSystemMemory",
        value: function freeChunkSystemMemory(chunk) {
            if (chunk.state === ChunkState.SYSTEM_MEMORY_WORKER) {
                chunk.freeSystemMemory();
            } else {
                this.rpc.invoke('Chunk.update', { 'id': chunk.key, 'state': ChunkState.EXPIRED, 'source': chunk.source.rpcId });
            }
        }
    }, {
        key: "retrieveChunkData",
        value: function retrieveChunkData(chunk) {
            return this.rpc.promiseInvoke('Chunk.retrieve', { key: chunk.key, source: chunk.source.rpcId });
        }
    }, {
        key: "copyChunkToGPU",
        value: function copyChunkToGPU(chunk) {
            var rpc = this.rpc;
            if (chunk.state === ChunkState.SYSTEM_MEMORY) {
                rpc.invoke('Chunk.update', { 'id': chunk.key, 'source': chunk.source.rpcId, 'state': ChunkState.GPU_MEMORY });
            } else {
                var msg = {};
                var transfers = [];
                chunk.serialize(msg, transfers);
                msg['state'] = ChunkState.GPU_MEMORY;
                rpc.invoke('Chunk.update', msg, transfers);
            }
        }
    }, {
        key: "processQueuePromotions_",
        value: function processQueuePromotions_() {
            var _this5 = this;

            var queueManager = this;
            var evict = function evict(chunk) {
                switch (chunk.state) {
                    case ChunkState.DOWNLOADING:
                        cancelChunkDownload(chunk);
                        break;
                    case ChunkState.GPU_MEMORY:
                        queueManager.freeChunkGPUMemory(chunk);
                    case ChunkState.SYSTEM_MEMORY_WORKER:
                    case ChunkState.SYSTEM_MEMORY:
                        queueManager.freeChunkSystemMemory(chunk);
                        break;
                }
                // Note: After calling this, chunk may no longer be valid.
                _this5.updateChunkState(chunk, ChunkState.QUEUED);
            };
            var promotionLambda = function promotionLambda(promotionCandidates, evictionCandidates, capacity) {
                var systemMemoryEvictionCandidates = _this5.systemMemoryEvictionQueue.candidates();
                var systemMemoryCapacity = _this5.systemMemoryCapacity;
                while (true) {
                    var promotionCandidateResult = promotionCandidates.next();
                    if (promotionCandidateResult.done) {
                        return;
                    }
                    var promotionCandidate = promotionCandidateResult.value;
                    var size = 0; /* unknown size, since it hasn't been downloaded yet. */
                    var priorityTier = promotionCandidate.priorityTier;
                    var priority = promotionCandidate.priority;
                    // console.log("Download capacity: " + downloadCapacity);
                    if (!tryToFreeCapacity(size, capacity, priorityTier, priority, evictionCandidates, evict)) {
                        return;
                    }
                    if (!tryToFreeCapacity(size, systemMemoryCapacity, priorityTier, priority, systemMemoryEvictionCandidates, evict)) {
                        return;
                    }
                    _this5.updateChunkState(promotionCandidate, ChunkState.DOWNLOADING);
                    startChunkDownload(promotionCandidate);
                }
            };
            for (var sourceQueueLevel = 0; sourceQueueLevel < numSourceQueueLevels; ++sourceQueueLevel) {
                promotionLambda(this.queuedDownloadPromotionQueue[sourceQueueLevel].candidates(), this.downloadEvictionQueue[sourceQueueLevel].candidates(), this.downloadCapacity[sourceQueueLevel]);
            }
            promotionLambda(this.queuedComputePromotionQueue.candidates(), this.computeEvictionQueue.candidates(), this.computeCapacity);
        }
    }, {
        key: "process",
        value: function process() {
            if (!this.updatePending) {
                return;
            }
            this.updatePending = null;
            this.processGPUPromotions_();
            this.processQueuePromotions_();
            this.logStatistics();
        }
    }, {
        key: "logStatistics",
        value: function logStatistics() {
            if (DEBUG_CHUNK_UPDATES) {
                console.log("[Chunk status] QUEUED: " + this.numQueued + ", FAILED: " + (this.numFailed + ", DOWNLOAD: " + this.downloadCapacity + ", ") + ("MEM: " + this.systemMemoryCapacity + ", GPU: " + this.gpuMemoryCapacity));
            }
        }
    }, {
        key: "invalidateSourceCache",
        value: function invalidateSourceCache(source) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(source.chunks.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var chunk = _step3.value;

                    switch (chunk.state) {
                        case ChunkState.DOWNLOADING:
                            cancelChunkDownload(chunk);
                            break;
                        case ChunkState.SYSTEM_MEMORY_WORKER:
                            chunk.freeSystemMemory();
                            break;
                    }
                    // Note: After calling this, chunk may no longer be valid.
                    this.updateChunkState(chunk, ChunkState.QUEUED);
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

            this.rpc.invoke('Chunk.update', { 'source': source.rpcId });
            this.scheduleUpdate();
        }
    }]);

    return ChunkQueueManager;
}(SharedObjectCounterpart);
ChunkQueueManager = __decorate([registerSharedObject(CHUNK_QUEUE_MANAGER_RPC_ID)], ChunkQueueManager);
export { ChunkQueueManager };
var ChunkManager = function (_SharedObjectCounterp2) {
    _inherits(ChunkManager, _SharedObjectCounterp2);

    function ChunkManager(rpc, options) {
        _classCallCheck(this, ChunkManager);

        /**
         * Array of chunks within each existing priority tier.
         */
        var _this6 = _possibleConstructorReturn(this, (ChunkManager.__proto__ || _Object$getPrototypeOf(ChunkManager)).call(this, rpc, options));

        _this6.existingTierChunks = [];
        /**
         * Array of chunks whose new priorities have not yet been reflected in the
         * queue states.
         */
        _this6.newTierChunks = [];
        _this6.updatePending = null;
        _this6.recomputeChunkPriorities = new NullarySignal();
        /**
         * Dispatched immediately after recomputeChunkPriorities is dispatched.
         * This signal should be used for handlers that depend on the result of another handler.
         */
        _this6.recomputeChunkPrioritiesLate = new NullarySignal();
        _this6.memoize = new StringMemoize();
        _this6.queueManager = rpc.get(options['chunkQueueManager']).addRef();
        for (var tier = ChunkPriorityTier.FIRST_TIER; tier <= ChunkPriorityTier.LAST_TIER; ++tier) {
            if (tier === ChunkPriorityTier.RECENT) {
                continue;
            }
            _this6.existingTierChunks[tier] = [];
        }
        return _this6;
    }

    _createClass(ChunkManager, [{
        key: "scheduleUpdateChunkPriorities",
        value: function scheduleUpdateChunkPriorities() {
            if (this.updatePending === null) {
                this.updatePending = setTimeout(this.recomputeChunkPriorities_.bind(this), 0);
            }
        }
    }, {
        key: "recomputeChunkPriorities_",
        value: function recomputeChunkPriorities_() {
            this.updatePending = null;
            this.recomputeChunkPriorities.dispatch();
            this.recomputeChunkPrioritiesLate.dispatch();
            this.updateQueueState([ChunkPriorityTier.VISIBLE]);
        }
        /**
         * @param chunk
         * @param tier New priority tier.  Must not equal ChunkPriorityTier.RECENT.
         * @param priority Priority within tier.
         * @param toFrontend true if the chunk should be moved to the frontend when ready.
         */

    }, {
        key: "requestChunk",
        value: function requestChunk(chunk, tier, priority) {
            var toFrontend = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            if (tier === ChunkPriorityTier.RECENT) {
                throw new Error('Not going to request a chunk with the RECENT tier');
            }
            chunk.newlyRequestedToFrontend = chunk.newlyRequestedToFrontend || toFrontend;
            if (chunk.newPriorityTier === ChunkPriorityTier.RECENT) {
                this.newTierChunks.push(chunk);
            }
            var newPriorityTier = chunk.newPriorityTier;
            if (tier < newPriorityTier || tier === newPriorityTier && priority > chunk.newPriority) {
                chunk.newPriorityTier = tier;
                chunk.newPriority = priority;
            }
        }
        /**
         * Update queue state to reflect updated contents of the specified priority tiers.  Existing
         * chunks within those tiers not present in this.newTierChunks will be moved to the RECENT tier
         * (and removed if in the QUEUED state).
         */

    }, {
        key: "updateQueueState",
        value: function updateQueueState(tiers) {
            var existingTierChunks = this.existingTierChunks;
            var queueManager = this.queueManager;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(tiers), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var tier = _step4.value;

                    var chunks = existingTierChunks[tier];
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = _getIterator(chunks), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var _chunk3 = _step6.value;

                            if (_chunk3.newPriorityTier === ChunkPriorityTier.RECENT) {
                                // Downgrade the priority of this chunk.
                                queueManager.performChunkPriorityUpdate(_chunk3);
                            }
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

                    chunks.length = 0;
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

            var newTierChunks = this.newTierChunks;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(newTierChunks), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var chunk = _step5.value;

                    queueManager.performChunkPriorityUpdate(chunk);
                    existingTierChunks[chunk.priorityTier].push(chunk);
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

            if (DEBUG_CHUNK_UPDATES) {
                console.log("updateQueueState: newTierChunks.length = " + newTierChunks.length);
            }
            newTierChunks.length = 0;
            this.queueManager.scheduleUpdate();
        }
    }]);

    return ChunkManager;
}(SharedObjectCounterpart);
ChunkManager = __decorate([registerSharedObject(CHUNK_MANAGER_RPC_ID)], ChunkManager);
export { ChunkManager };
/**
 * Mixin for adding a `parameters` member to a ChunkSource, and for registering the shared object
 * type based on the `RPC_ID` member of the Parameters class.
 */
export function WithParameters(Base, parametersConstructor) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this7 = _possibleConstructorReturn(this, (_ref = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref, [this].concat(args)));

            var options = args[1];
            _this7.parameters = options['parameters'];
            return _this7;
        }

        return C;
    }(Base);
    C = __decorate([registerSharedObjectOwner(parametersConstructor.RPC_ID)], C);
    return C;
}
/**
 * Mixin that adds a chunkManager property initialized from the RPC-supplied options.
 *
 * The resultant class implements `ChunkRequester`.
 */
export function withChunkManager(Base) {
    return function (_Base2) {
        _inherits(_class, _Base2);

        function _class() {
            var _ref2;

            _classCallCheck(this, _class);

            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            var _this8 = _possibleConstructorReturn(this, (_ref2 = _class.__proto__ || _Object$getPrototypeOf(_class)).call.apply(_ref2, [this].concat(args)));

            var rpc = args[0];
            var options = args[1];
            // We don't increment the reference count, because our owner owns a reference to the
            // ChunkManager.
            _this8.chunkManager = rpc.get(options['chunkManager']);
            return _this8;
        }

        return _class;
    }(Base);
}
registerRPC(CHUNK_SOURCE_INVALIDATE_RPC_ID, function (x) {
    var source = this.get(x['id']);
    source.chunkManager.queueManager.invalidateSourceCache(source);
});
registerPromiseRPC(REQUEST_CHUNK_STATISTICS_RPC_ID, function (x) {
    var queue = this.get(x.queue);
    var results = new _Map();
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = _getIterator(queue.sources), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var source = _step7.value;

            results.set(source.rpcId, source.statistics);
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

    return _Promise.resolve({ value: results });
});
//# sourceMappingURL=backend.js.map