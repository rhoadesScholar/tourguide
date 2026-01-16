import _toArray from 'babel-runtime/helpers/toArray';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Set from 'babel-runtime/core-js/set';
import _typeof from 'babel-runtime/helpers/typeof';
import _Map from 'babel-runtime/core-js/map';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';

import debounce from 'lodash/debounce'; /**
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

import { ChunkDownloadStatistics, ChunkMemoryStatistics, ChunkPriorityTier, ChunkState, getChunkDownloadStatisticIndex, getChunkStateStatisticIndex, numChunkMemoryStatistics, numChunkStates, REQUEST_CHUNK_STATISTICS_RPC_ID } from '../chunk_manager/base';
import { TrackableBoolean } from '../trackable_boolean';
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { removeChildren, removeFromParent } from '../util/dom';
import { verifyPositiveInt } from '../util/json';
import { CompoundTrackable } from '../util/trackable';
export var StatisticsDisplayState = function () {
    function StatisticsDisplayState() {
        _classCallCheck(this, StatisticsDisplayState);

        this.tracker = new CompoundTrackable();
        this.visible = new TrackableBoolean(false);
        this.size = new TrackableValue(100, verifyPositiveInt);
        this.tracker.add('visible', this.visible);
        this.tracker.add('size', this.size);
    }

    _createClass(StatisticsDisplayState, [{
        key: 'restoreState',
        value: function restoreState(obj) {
            this.tracker.restoreState(obj);
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.tracker.reset();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var obj = this.tracker.toJSON();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(_Object$keys(obj)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var k = _step.value;

                    if (obj[k] !== undefined) return obj;
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

            return undefined;
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.tracker.changed;
        }
    }]);

    return StatisticsDisplayState;
}();
function getProperties(obj) {
    var map = new _Map();
    function handleObject(o, prefix) {
        if ((typeof o === 'undefined' ? 'undefined' : _typeof(o)) !== 'object') {
            map.set(prefix, '' + o);
            return;
        }
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _getIterator(_Object$keys(o)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var key = _step2.value;

                handleObject(o[key], prefix + '.' + key);
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
    handleObject(obj, '');
    return map;
}
function getDistinguishingProperties(properties) {
    var selected = new _Set();
    selected.add('.type');
    var allProps = new _Set();
    function areDistinguished(i, j) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = _getIterator(selected), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var prop = _step3.value;

                if (properties[i].get(prop) !== properties[j].get(prop)) {
                    return true;
                }
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

        return false;
    }
    for (var i = 0, n = properties.length; i < n; ++i) {
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = _getIterator(properties[i].keys()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var prop = _step4.value;

                allProps.add(prop);
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

        var matches = [];
        for (var j = 0; j < i; ++j) {
            if (!areDistinguished(i, j)) {
                matches.push(j);
            }
        }
        while (matches.length > 0) {
            var bestReducedMatches = matches;
            var bestProp = undefined;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(allProps), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _prop = _step5.value;

                    if (selected.has(_prop)) continue;
                    var reducedMatches = [];
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = _getIterator(matches), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var _j = _step6.value;

                            if (properties[_j].get(_prop) === properties[i].get(_prop)) {
                                reducedMatches.push(_j);
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

                    if (reducedMatches.length < bestReducedMatches.length) {
                        bestReducedMatches = reducedMatches;
                        bestProp = _prop;
                    }
                    if (reducedMatches.length === 0) break;
                }
                // Prevent infinite loop if there are no distinguishing properties.
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

            if (bestProp === undefined) break;
            matches = bestReducedMatches;
            selected.add(bestProp);
        }
    }
    return _Array$from(selected);
}
function getNameFromProps(properties, selected) {
    var result = {};
    var _iteratorNormalCompletion7 = true;
    var _didIteratorError7 = false;
    var _iteratorError7 = undefined;

    try {
        for (var _iterator7 = _getIterator(selected), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var prop = _step7.value;

            var value = properties.get(prop);
            if (value === undefined) continue;
            if (prop === '') return value;
            result[prop] = value;
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

    return _JSON$stringify(result);
}
function getFormattedNames(objects) {
    var properties = objects.map(getProperties);
    var selectedProps = getDistinguishingProperties(properties);
    return properties.map(function (p) {
        return getNameFromProps(p, selectedProps);
    });
}
/**
 * Interval in ms at which to request new statistics from the backend thread.
 */
var requestDataInterval = 1000;
export var StatisticsPanel = function (_RefCounted) {
    _inherits(StatisticsPanel, _RefCounted);

    function StatisticsPanel(chunkQueueManager, displayState) {
        _classCallCheck(this, StatisticsPanel);

        var _this = _possibleConstructorReturn(this, (StatisticsPanel.__proto__ || _Object$getPrototypeOf(StatisticsPanel)).call(this));

        _this.chunkQueueManager = chunkQueueManager;
        _this.displayState = displayState;
        _this.element = document.createElement('div');
        _this.columns = new _Map();
        _this.data = undefined;
        _this.requestDataTimerId = -1;
        _this.dataRequested = false;
        _this.debouncedUpdateView = _this.registerCancellable(debounce(function () {
            return _this.updateView();
        }, 0));
        var element = _this.element;

        element.className = 'neuroglancer-statistics-panel';
        _this.registerDisposer(_this.displayState.changed.add(_this.debouncedUpdateView));
        _this.registerDisposer(_this.displayState.visible.changed.add(function () {
            return _this.requestData();
        }));
        _this.requestData();
        var columns = _this.columns;
        // Total number of visible-priority chunks
        //    number in downloading state
        //    number in other system memory state
        //    number in gpu memory state
        //    number in failed state

        columns.set('Visible chunks/T', function (statistics) {
            var sum = 0;
            for (var state = 0; state < numChunkStates; ++state) {
                sum += statistics[getChunkStateStatisticIndex(state, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks];
            }
            return sum;
        });
        columns.set('Visible chunks/D', function (statistics) {
            return statistics[getChunkStateStatisticIndex(ChunkState.DOWNLOADING, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks];
        });
        columns.set('Visible chunks/M', function (statistics) {
            return statistics[getChunkStateStatisticIndex(ChunkState.SYSTEM_MEMORY, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks] + statistics[getChunkStateStatisticIndex(ChunkState.SYSTEM_MEMORY_WORKER, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks];
        });
        columns.set('Visible chunks/G', function (statistics) {
            return statistics[getChunkStateStatisticIndex(ChunkState.GPU_MEMORY, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks];
        });
        columns.set('Visible chunks/F', function (statistics) {
            return statistics[getChunkStateStatisticIndex(ChunkState.FAILED, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.numChunks];
        });
        columns.set('Visible memory', function (statistics) {
            return statistics[getChunkStateStatisticIndex(ChunkState.GPU_MEMORY, ChunkPriorityTier.VISIBLE) * numChunkMemoryStatistics + ChunkMemoryStatistics.gpuMemoryBytes];
        });
        columns.set('Download latency', function (statistics) {
            return statistics[getChunkDownloadStatisticIndex(ChunkDownloadStatistics.totalTime)] / statistics[getChunkDownloadStatisticIndex(ChunkDownloadStatistics.totalChunks)];
        });
        return _this;
    }

    _createClass(StatisticsPanel, [{
        key: 'disposed',
        value: function disposed() {
            clearTimeout(this.requestDataTimerId);
            removeFromParent(this.element);
            _get(StatisticsPanel.prototype.__proto__ || _Object$getPrototypeOf(StatisticsPanel.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'requestData',
        value: function requestData() {
            var _this2 = this;

            if (!this.displayState.visible) return;
            if (this.dataRequested) return;
            var chunkQueueManager = this.chunkQueueManager;

            var rpc = chunkQueueManager.rpc;
            this.dataRequested = true;
            rpc.promiseInvoke(REQUEST_CHUNK_STATISTICS_RPC_ID, { queue: chunkQueueManager.rpcId }).then(function (data) {
                _this2.dataRequested = false;
                _this2.data = data;
                _this2.debouncedUpdateView();
                _this2.requestDataTimerId = setTimeout(function () {
                    _this2.requestDataTimerId = -1;
                    _this2.requestData();
                }, requestDataInterval);
            });
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            if (!this.displayState.visible.value) return;
            var data = this.data;

            if (data === undefined) return;
            var columns = this.columns;

            var rpc = this.chunkQueueManager.rpc;
            var table = document.createElement('table');
            var rows = [];
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(data), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _ref = _step8.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var id = _ref2[0];
                    var statistics = _ref2[1];

                    var source = rpc.get(id);
                    if (source === undefined) continue;
                    var row = [source];
                    var _iteratorNormalCompletion12 = true;
                    var _didIteratorError12 = false;
                    var _iteratorError12 = undefined;

                    try {
                        for (var _iterator12 = _getIterator(columns.values()), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                            var _column2 = _step12.value;

                            row.push(_column2(statistics));
                        }
                    } catch (err) {
                        _didIteratorError12 = true;
                        _iteratorError12 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                _iterator12.return();
                            }
                        } finally {
                            if (_didIteratorError12) {
                                throw _iteratorError12;
                            }
                        }
                    }

                    rows.push(row);
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            var formattedNames = getFormattedNames(rows.map(function (x) {
                return _Object$assign({ type: x[0].RPC_TYPE_ID }, x[0].key || {});
            }));
            var sourceFormattedNames = new _Map();
            formattedNames.forEach(function (name, i) {
                sourceFormattedNames.set(rows[i][0], name);
            });
            {
                var thead = document.createElement('thead');
                var tr = document.createElement('tr');
                thead.appendChild(tr);
                var addHeaderColumn = function addHeaderColumn(label) {
                    var td = document.createElement('td');
                    td.textContent = label;
                    tr.appendChild(td);
                };
                addHeaderColumn('Name');
                var prevPrefix = undefined;
                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = _getIterator(columns.keys()), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var column = _step9.value;

                        var sepIndex = column.indexOf('/');
                        var prefix = column;
                        if (sepIndex !== -1) {
                            prefix = column.substring(0, sepIndex);
                            if (prefix === prevPrefix) {
                                ++tr.lastElementChild.colSpan;
                                continue;
                            }
                            prevPrefix = prefix;
                        }
                        addHeaderColumn(prefix);
                    }
                } catch (err) {
                    _didIteratorError9 = true;
                    _iteratorError9 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion9 && _iterator9.return) {
                            _iterator9.return();
                        }
                    } finally {
                        if (_didIteratorError9) {
                            throw _iteratorError9;
                        }
                    }
                }

                tr = document.createElement('tr');
                thead.appendChild(tr);
                {
                    var td = document.createElement('td');
                    tr.appendChild(td);
                }
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = _getIterator(columns.keys()), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var _column = _step10.value;

                        var sepIndex = _column.indexOf('/');
                        var suffix = '';
                        if (sepIndex !== -1) {
                            suffix = _column.substring(sepIndex + 1);
                        }
                        var _td = document.createElement('td');
                        _td.textContent = suffix;
                        tr.appendChild(_td);
                    }
                } catch (err) {
                    _didIteratorError10 = true;
                    _iteratorError10 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion10 && _iterator10.return) {
                            _iterator10.return();
                        }
                    } finally {
                        if (_didIteratorError10) {
                            throw _iteratorError10;
                        }
                    }
                }

                table.appendChild(thead);
            }
            var tbody = document.createElement('tbody');
            // TODO: sort rows

            var _loop = function _loop(source, values) {
                var tr = document.createElement('tr');
                var addColumn = function addColumn(label) {
                    var td = document.createElement('td');
                    td.textContent = label;
                    tr.appendChild(td);
                };
                addColumn(sourceFormattedNames.get(source));
                var _iteratorNormalCompletion13 = true;
                var _didIteratorError13 = false;
                var _iteratorError13 = undefined;

                try {
                    for (var _iterator13 = _getIterator(values), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                        var value = _step13.value;

                        addColumn('' + value);
                    }
                } catch (err) {
                    _didIteratorError13 = true;
                    _iteratorError13 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion13 && _iterator13.return) {
                            _iterator13.return();
                        }
                    } finally {
                        if (_didIteratorError13) {
                            throw _iteratorError13;
                        }
                    }
                }

                tbody.appendChild(tr);
            };

            var _iteratorNormalCompletion11 = true;
            var _didIteratorError11 = false;
            var _iteratorError11 = undefined;

            try {
                for (var _iterator11 = _getIterator(rows), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                    var _ref3 = _step11.value;

                    var _ref4 = _toArray(_ref3);

                    var source = _ref4[0];

                    var values = _ref4.slice(1);

                    _loop(source, values);
                }
            } catch (err) {
                _didIteratorError11 = true;
                _iteratorError11 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion11 && _iterator11.return) {
                        _iterator11.return();
                    }
                } finally {
                    if (_didIteratorError11) {
                        throw _iteratorError11;
                    }
                }
            }

            table.appendChild(tbody);
            removeChildren(this.element);
            this.element.appendChild(table);
        }
    }]);

    return StatisticsPanel;
}(RefCounted);
//# sourceMappingURL=statistics.js.map