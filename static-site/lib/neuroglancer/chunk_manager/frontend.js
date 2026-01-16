import _Object$assign from "babel-runtime/core-js/object/assign";
import _Map from "babel-runtime/core-js/map";
import _get from "babel-runtime/helpers/get";
import _Promise from "babel-runtime/core-js/promise";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _JSON$stringify from "babel-runtime/core-js/json/stringify";
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
import { CHUNK_MANAGER_RPC_ID, CHUNK_QUEUE_MANAGER_RPC_ID, CHUNK_SOURCE_INVALIDATE_RPC_ID, ChunkState } from "./base";
import { SharedWatchableValue } from "../shared_watchable_value";
import { TrackableValue } from "../trackable_value";
import { CANCELED } from "../util/cancellation";
import { stableStringify } from "../util/json";
import { StringMemoize } from "../util/memoize";
import { getObjectId } from "../util/object_id";
import { NullarySignal } from "../util/signal";
import { registerPromiseRPC, registerRPC, registerSharedObjectOwner, SharedObject } from "../worker_rpc";
var DEBUG_CHUNK_UPDATES = false;
export var Chunk = function () {
    function Chunk(source) {
        _classCallCheck(this, Chunk);

        this.source = source;
        this.state = ChunkState.SYSTEM_MEMORY;
    }

    _createClass(Chunk, [{
        key: "copyToGPU",
        value: function copyToGPU(_gl) {
            this.state = ChunkState.GPU_MEMORY;
        }
    }, {
        key: "freeGPUMemory",
        value: function freeGPUMemory(_gl) {
            this.state = ChunkState.SYSTEM_MEMORY;
        }
    }, {
        key: "gl",
        get: function get() {
            return this.source.gl;
        }
    }]);

    return Chunk;
}();
function validateLimitValue(x) {
    if (typeof x !== 'number' || x < 0) {
        throw new Error("Expected non-negative number as limit, but received: " + _JSON$stringify(x));
    }
    return x;
}
export var CapacitySpecification = function CapacitySpecification() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$defaultItemLimit = _ref.defaultItemLimit,
        defaultItemLimit = _ref$defaultItemLimit === undefined ? Number.POSITIVE_INFINITY : _ref$defaultItemLimit,
        _ref$defaultSizeLimit = _ref.defaultSizeLimit,
        defaultSizeLimit = _ref$defaultSizeLimit === undefined ? Number.POSITIVE_INFINITY : _ref$defaultSizeLimit;

    _classCallCheck(this, CapacitySpecification);

    this.sizeLimit = new TrackableValue(defaultSizeLimit, validateLimitValue);
    this.itemLimit = new TrackableValue(defaultItemLimit, validateLimitValue);
};
var ChunkQueueManager = function (_SharedObject) {
    _inherits(ChunkQueueManager, _SharedObject);

    function ChunkQueueManager(rpc, gl, frameNumberCounter, capacities) {
        _classCallCheck(this, ChunkQueueManager);

        var _this = _possibleConstructorReturn(this, (ChunkQueueManager.__proto__ || _Object$getPrototypeOf(ChunkQueueManager)).call(this));

        _this.gl = gl;
        _this.frameNumberCounter = frameNumberCounter;
        _this.capacities = capacities;
        _this.visibleChunksChanged = new NullarySignal();
        _this.pendingChunkUpdates = null;
        _this.pendingChunkUpdatesTail = null;
        /**
         * If non-null, deadline in milliseconds since epoch after which chunk copies to the GPU may not
         * start (until the next frame).
         */
        _this.chunkUpdateDeadline = null;
        _this.chunkUpdateDelay = 30;
        var makeCapacityCounterparts = function makeCapacityCounterparts(capacity) {
            return {
                itemLimit: _this.registerDisposer(SharedWatchableValue.makeFromExisting(rpc, capacity.itemLimit)).rpcId,
                sizeLimit: _this.registerDisposer(SharedWatchableValue.makeFromExisting(rpc, capacity.sizeLimit)).rpcId
            };
        };
        _this.initializeCounterpart(rpc, {
            'gpuMemoryCapacity': makeCapacityCounterparts(capacities.gpuMemory),
            'systemMemoryCapacity': makeCapacityCounterparts(capacities.systemMemory),
            'downloadCapacity': makeCapacityCounterparts(capacities.download),
            'computeCapacity': makeCapacityCounterparts(capacities.compute)
        });
        return _this;
    }

    _createClass(ChunkQueueManager, [{
        key: "scheduleChunkUpdate",
        value: function scheduleChunkUpdate() {
            var deadline = this.chunkUpdateDeadline;
            var delay = void 0;
            if (deadline === null || Date.now() < deadline) {
                delay = 0;
            } else {
                delay = this.chunkUpdateDelay;
            }
            setTimeout(this.processPendingChunkUpdates.bind(this), delay);
        }
    }, {
        key: "processPendingChunkUpdates",
        value: function processPendingChunkUpdates() {
            var deadline = this.chunkUpdateDeadline;
            if (deadline === null) {
                deadline = Date.now() + 30;
            }
            var visibleChunksChanged = false;
            while (true) {
                if (Date.now() > deadline) {
                    // No time to perform chunk update now, we will wait some more.
                    setTimeout(this.processPendingChunkUpdates.bind(this), this.chunkUpdateDelay);
                    break;
                }
                var update = this.pendingChunkUpdates;
                if (this.applyChunkUpdate(update)) {
                    visibleChunksChanged = true;
                }
                // FIXME: do chunk update
                var nextUpdate = this.pendingChunkUpdates = update.nextUpdate;
                --window.numPendingChunkUpdates;
                if (nextUpdate == null) {
                    this.pendingChunkUpdatesTail = null;
                    break;
                }
            }
            if (visibleChunksChanged) {
                this.visibleChunksChanged.dispatch();
            }
        }
    }, {
        key: "handleFetch_",
        value: function handleFetch_(source, update) {
            var _update$promise = update['promise'],
                resolve = _update$promise.resolve,
                reject = _update$promise.reject,
                cancellationToken = _update$promise.cancellationToken;

            if (cancellationToken.isCanceled) {
                reject(CANCELED);
                return;
            }
            var key = update['key'];
            var chunk = source.chunks.get(key);
            if (!chunk) {
                reject(new Error("No chunk found at " + key + " for source " + source.constructor.name));
                return;
            }
            var data = chunk['data'];
            if (!data) {
                reject(new Error("At " + key + " for source " + source.constructor.name + ": chunk has no data"));
                return;
            }
            resolve({ value: data });
        }
    }, {
        key: "applyChunkUpdate",
        value: function applyChunkUpdate(update) {
            var visibleChunksChanged = false;
            var rpc = this.rpc;

            var source = rpc.get(update['source']);
            if (DEBUG_CHUNK_UPDATES) {
                console.log(Date.now() + " Chunk.update processed: " + source.rpcId + " " + (update['id'] + " " + update['state']));
            }
            if (update['promise'] !== undefined) {
                this.handleFetch_(source, update);
            } else if (update['id'] === undefined) {
                // Invalidate source.
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(source.chunks.keys()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var chunkKey = _step.value;

                        source.deleteChunk(chunkKey);
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

                visibleChunksChanged = true;
            } else {
                var newState = update['state'];
                if (newState === ChunkState.EXPIRED) {
                    // FIXME: maybe use freeList for chunks here
                    source.deleteChunk(update['id']);
                } else {
                    var chunk = void 0;
                    var key = update['id'];
                    if (update['new']) {
                        chunk = source.getChunk(update);
                        source.addChunk(key, chunk);
                    } else {
                        chunk = source.chunks.get(key);
                    }
                    var oldState = chunk.state;
                    if (newState !== oldState) {
                        switch (newState) {
                            case ChunkState.GPU_MEMORY:
                                // console.log("Copying to GPU", chunk);
                                chunk.copyToGPU(this.gl);
                                visibleChunksChanged = true;
                                break;
                            case ChunkState.SYSTEM_MEMORY:
                                chunk.freeGPUMemory(this.gl);
                                break;
                            default:
                                throw new Error("INTERNAL ERROR: Invalid chunk state: " + ChunkState[newState]);
                        }
                    }
                }
            }
            return visibleChunksChanged;
        }
    }]);

    return ChunkQueueManager;
}(SharedObject);
ChunkQueueManager = __decorate([registerSharedObjectOwner(CHUNK_QUEUE_MANAGER_RPC_ID)], ChunkQueueManager);
export { ChunkQueueManager };
window.numPendingChunkUpdates = 0;
function updateChunk(rpc, x) {
    var source = rpc.get(x['source']);
    if (DEBUG_CHUNK_UPDATES) {
        console.log(Date.now() + " Chunk.update received: " + (source.rpcId + " " + x['id'] + " " + x['state'] + " with chunkDataSize " + x['chunkDataSize']));
    }
    var queueManager = source.chunkManager.chunkQueueManager;
    if (source.immediateChunkUpdates) {
        if (queueManager.applyChunkUpdate(x)) {
            queueManager.visibleChunksChanged.dispatch();
        }
        return;
    }
    var pendingTail = queueManager.pendingChunkUpdatesTail;
    if (++window.numPendingChunkUpdates > 3) {
        // console.log(`numPendingChunkUpdates=${(<any>window).numPendingChunkUpdates}`);
    }
    if (pendingTail == null) {
        queueManager.pendingChunkUpdates = x;
        queueManager.pendingChunkUpdatesTail = x;
        queueManager.scheduleChunkUpdate();
    } else {
        pendingTail.nextUpdate = x;
        queueManager.pendingChunkUpdatesTail = x;
    }
}
registerRPC('Chunk.update', function (x) {
    updateChunk(this, x);
});
registerPromiseRPC('Chunk.retrieve', function (x, cancellationToken) {
    var _this2 = this;

    return new _Promise(function (resolve, reject) {
        x['promise'] = { resolve: resolve, reject: reject, cancellationToken: cancellationToken };
        updateChunk(_this2, x);
    });
});
var ChunkManager = function (_SharedObject2) {
    _inherits(ChunkManager, _SharedObject2);

    function ChunkManager(chunkQueueManager) {
        _classCallCheck(this, ChunkManager);

        var _this3 = _possibleConstructorReturn(this, (ChunkManager.__proto__ || _Object$getPrototypeOf(ChunkManager)).call(this));

        _this3.chunkQueueManager = chunkQueueManager;
        _this3.memoize = new StringMemoize();
        _this3.registerDisposer(chunkQueueManager.addRef());
        _this3.initializeCounterpart(chunkQueueManager.rpc, { 'chunkQueueManager': chunkQueueManager.rpcId });
        return _this3;
    }

    _createClass(ChunkManager, [{
        key: "getChunkSource",
        value: function getChunkSource(constructorFunction, options) {
            var _this4 = this;

            var keyObject = constructorFunction.encodeOptions(options);
            keyObject['constructorId'] = getObjectId(constructorFunction);
            var key = stableStringify(keyObject);
            return this.memoize.get(key, function () {
                var newSource = new constructorFunction(_this4, options);
                newSource.initializeCounterpart(_this4.rpc, {});
                newSource.key = keyObject;
                return newSource;
            });
        }
    }, {
        key: "forgetChunkSource",
        value: function forgetChunkSource(constructorFunction, options) {
            var keyObject = constructorFunction.encodeOptions(options);
            keyObject['constructorId'] = getObjectId(constructorFunction);
            var key = stableStringify(keyObject);
            this.memoize.forget(key);
        }
    }, {
        key: "gl",
        get: function get() {
            return this.chunkQueueManager.gl;
        }
    }]);

    return ChunkManager;
}(SharedObject);
ChunkManager = __decorate([registerSharedObjectOwner(CHUNK_MANAGER_RPC_ID)], ChunkManager);
export { ChunkManager };
export var ChunkSource = function (_SharedObject3) {
    _inherits(ChunkSource, _SharedObject3);

    function ChunkSource(chunkManager) {
        var _options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, ChunkSource);

        var _this5 = _possibleConstructorReturn(this, (ChunkSource.__proto__ || _Object$getPrototypeOf(ChunkSource)).call(this));

        _this5.chunkManager = chunkManager;
        _this5.chunks = new _Map();
        /**
         * If set to true, chunk updates will be applied to this source immediately, rather than queueing
         * them.  Sources that dynamically update chunks and need to ensure a consistent order of
         * processing relative to other messages between the frontend and worker should set this to true.
         */
        _this5.immediateChunkUpdates = false;
        return _this5;
    }

    _createClass(ChunkSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            options['chunkManager'] = this.chunkManager.rpcId;
            _get(ChunkSource.prototype.__proto__ || _Object$getPrototypeOf(ChunkSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "deleteChunk",
        value: function deleteChunk(key) {
            var chunk = this.chunks.get(key);
            if (chunk.state === ChunkState.GPU_MEMORY) {
                chunk.freeGPUMemory(this.gl);
            }
            this.chunks.delete(key);
        }
    }, {
        key: "addChunk",
        value: function addChunk(key, chunk) {
            this.chunks.set(key, chunk);
        }
        /**
         * Default implementation for use with backendOnly chunk sources.
         */

    }, {
        key: "getChunk",
        value: function getChunk(_x) {
            throw new Error('Not implemented.');
        }
        /**
         * Invalidates the chunk cache.  Operates asynchronously.
         */

    }, {
        key: "invalidateCache",
        value: function invalidateCache() {
            this.rpc.invoke(CHUNK_SOURCE_INVALIDATE_RPC_ID, { 'id': this.rpcId });
        }
    }, {
        key: "gl",
        get: function get() {
            return this.chunkManager.chunkQueueManager.gl;
        }
    }], [{
        key: "encodeOptions",
        value: function encodeOptions(_options) {
            return {};
        }
    }]);

    return ChunkSource;
}(SharedObject);
export function WithParameters(Base, parametersConstructor) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref2;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this6 = _possibleConstructorReturn(this, (_ref2 = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref2, [this].concat(args)));

            var options = args[1];
            _this6.parameters = options.parameters;
            return _this6;
        }

        _createClass(C, [{
            key: "initializeCounterpart",
            value: function initializeCounterpart(rpc, options) {
                options['parameters'] = this.parameters;
                _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), "initializeCounterpart", this).call(this, rpc, options);
            }
        }], [{
            key: "encodeOptions",
            value: function encodeOptions(options) {
                return _Object$assign({ parameters: options.parameters }, _get(C.__proto__ || _Object$getPrototypeOf(C), "encodeOptions", this).call(this, options));
            }
        }]);

        return C;
    }(Base);
    C = __decorate([registerSharedObjectOwner(parametersConstructor.RPC_ID)], C);
    return C;
}
//# sourceMappingURL=frontend.js.map