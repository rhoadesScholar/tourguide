import _Promise from 'babel-runtime/core-js/promise';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
/**
 * @license
 * Copyright 2019 Google Inc.
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
import { CANCELED } from '../util/cancellation';
var freeWorkers = [];
var pendingTasks = new _Map();
var tasks = new _Map();
var maxWorkers = Math.min(12, navigator.hardwareConcurrency);
var nextTaskId = 0;
function returnWorker(worker) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(pendingTasks), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _ref = _step.value;

            var _ref2 = _slicedToArray(_ref, 2);

            var id = _ref2[0];
            var task = _ref2[1];

            pendingTasks.delete(id);
            worker.postMessage(task.msg, task.transfer);
            return;
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

    freeWorkers.push(worker);
}
function getNewWorker() {
    var worker = new Worker('async_computation.bundle.js');
    worker.onmessage = function (msg) {
        var _msg$data = msg.data,
            id = _msg$data.id,
            value = _msg$data.value,
            error = _msg$data.error;

        returnWorker(worker);
        var callbacks = tasks.get(id);
        tasks.delete(id);
        if (callbacks === undefined) return;
        callbacks.cleanup();
        if (error !== undefined) {
            callbacks.reject(new Error(error));
        } else {
            callbacks.resolve(value);
        }
    };
    return worker;
}
export function requestAsyncComputation(request, cancellationToken, transfer) {
    for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
    }

    if (cancellationToken.isCanceled) return _Promise.reject(CANCELED);
    var id = nextTaskId++;
    var msg = { t: request.id, id: id, args: args };
    var cleanup = cancellationToken.add(function () {
        pendingTasks.delete(id);
        tasks.delete(id);
    });
    var promise = new _Promise(function (resolve, reject) {
        tasks.set(id, { resolve: resolve, reject: reject, cleanup: cleanup });
    });
    if (freeWorkers.length !== 0) {
        freeWorkers.pop().postMessage(msg, transfer);
    } else if (tasks.size < maxWorkers) {
        getNewWorker().postMessage(msg, transfer);
    } else {
        pendingTasks.set(id, { msg: msg, transfer: transfer });
    }
    return promise;
}
//# sourceMappingURL=request.js.map