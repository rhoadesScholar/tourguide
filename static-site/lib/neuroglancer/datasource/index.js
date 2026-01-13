import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Promise from 'babel-runtime/core-js/promise';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { uncancelableToken } from '../util/cancellation';
import { applyCompletionOffset } from '../util/completion';
import { RefCounted } from '../util/disposable';
/**
 * Returns the length of the prefix of path that corresponds to the "group", according to the
 * specified separator.
 *
 * If the separator is not specified, gueses whether it is '/' or ':'.
 */
export function findSourceGroupBasedOnSeparator(path, separator) {
    if (separator === undefined) {
        // Try to guess whether '/' or ':' is the separator.
        if (path.indexOf('/') === -1) {
            separator = ':';
        } else {
            separator = '/';
        }
    }
    var index = path.lastIndexOf(separator);
    if (index === -1) {
        return 0;
    }
    return index + 1;
}
/**
 * Returns the last "component" of path, according to the specified separator.
 * If the separator is not specified, gueses whether it is '/' or ':'.
 */
export function suggestLayerNameBasedOnSeparator(path, separator) {
    var groupIndex = findSourceGroupBasedOnSeparator(path, separator);
    return path.substring(groupIndex);
}
export var DataSource = function (_RefCounted) {
    _inherits(DataSource, _RefCounted);

    function DataSource() {
        _classCallCheck(this, DataSource);

        return _possibleConstructorReturn(this, (DataSource.__proto__ || _Object$getPrototypeOf(DataSource)).apply(this, arguments));
    }

    return DataSource;
}(RefCounted);
var protocolPattern = /^(?:([a-zA-Z][a-zA-Z0-9-+_]*):\/\/)?(.*)$/;
export var DataSourceProvider = function (_RefCounted2) {
    _inherits(DataSourceProvider, _RefCounted2);

    function DataSourceProvider() {
        _classCallCheck(this, DataSourceProvider);

        var _this2 = _possibleConstructorReturn(this, (DataSourceProvider.__proto__ || _Object$getPrototypeOf(DataSourceProvider)).apply(this, arguments));

        _this2.dataSources = new _Map();
        return _this2;
    }

    _createClass(DataSourceProvider, [{
        key: 'register',
        value: function register(name, dataSource) {
            this.dataSources.set(name, this.registerDisposer(dataSource));
        }
    }, {
        key: 'getDataSource',
        value: function getDataSource(url) {
            var m = url.match(protocolPattern);
            if (m === null || m[1] === undefined) {
                throw new Error('Data source URL must have the form "<protocol>://<path>".');
            }
            var dataSource = m[1];
            var factory = this.dataSources.get(dataSource);
            if (factory === undefined) {
                throw new Error('Unsupported data source: ' + _JSON$stringify(dataSource) + '.');
            }
            return [factory, m[2], dataSource];
        }
    }, {
        key: 'getVolume',
        value: function getVolume(chunkManager, url) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var cancellationToken = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : uncancelableToken;

            var _getDataSource = this.getDataSource(url),
                _getDataSource2 = _slicedToArray(_getDataSource, 2),
                dataSource = _getDataSource2[0],
                path = _getDataSource2[1];

            if (options === undefined) {
                options = {};
            }
            options.dataSourceProvider = this;
            return new _Promise(function (resolve) {
                resolve(dataSource.getVolume(chunkManager, path, options, cancellationToken));
            });
        }
    }, {
        key: 'getAnnotationSource',
        value: function getAnnotationSource(chunkManager, url) {
            var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;

            var _getDataSource3 = this.getDataSource(url),
                _getDataSource4 = _slicedToArray(_getDataSource3, 2),
                dataSource = _getDataSource4[0],
                path = _getDataSource4[1];

            return new _Promise(function (resolve) {
                resolve(dataSource.getAnnotationSource(chunkManager, path, cancellationToken));
            });
        }
    }, {
        key: 'getVectorGraphicsSource',
        value: function getVectorGraphicsSource(chunkManager, url) {
            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
            var cancellationToken = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : uncancelableToken;

            var _getDataSource5 = this.getDataSource(url),
                _getDataSource6 = _slicedToArray(_getDataSource5, 2),
                dataSource = _getDataSource6[0],
                path = _getDataSource6[1];

            return new _Promise(function (resolve) {
                resolve(dataSource.getVectorGraphicsSource(chunkManager, path, options, cancellationToken));
            });
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource(chunkManager, url) {
            var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;

            var _getDataSource7 = this.getDataSource(url),
                _getDataSource8 = _slicedToArray(_getDataSource7, 2),
                dataSource = _getDataSource8[0],
                path = _getDataSource8[1];

            return new _Promise(function (resolve) {
                resolve(dataSource.getMeshSource(chunkManager, path, cancellationToken));
            });
        }
    }, {
        key: 'getSkeletonSource',
        value: function getSkeletonSource(chunkManager, url) {
            var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;

            var _getDataSource9 = this.getDataSource(url),
                _getDataSource10 = _slicedToArray(_getDataSource9, 2),
                dataSource = _getDataSource10[0],
                path = _getDataSource10[1];

            return new _Promise(function (resolve) {
                resolve(dataSource.getSkeletonSource(chunkManager, path, cancellationToken));
            });
        }
    }, {
        key: 'volumeCompleter',
        value: function volumeCompleter(url, chunkManager) {
            var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;

            // Check if url matches a protocol.  Note that protocolPattern always matches.
            var protocolMatch = url.match(protocolPattern);
            var protocol = protocolMatch[1];
            if (protocol === undefined) {
                // Return protocol completions.
                var completions = [];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(this.dataSources), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _ref = _step.value;

                        var _ref2 = _slicedToArray(_ref, 2);

                        var name = _ref2[0];
                        var factory = _ref2[1];

                        name = name + '://';
                        if (name.startsWith(url)) {
                            completions.push({ value: name, description: factory.description });
                        }
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

                return _Promise.resolve({ offset: 0, completions: completions });
            } else {
                var _factory = this.dataSources.get(protocol);
                if (_factory !== undefined) {
                    if (_factory.volumeCompleter !== undefined) {
                        return _factory.volumeCompleter(protocolMatch[2], chunkManager, cancellationToken).then(function (completions) {
                            return applyCompletionOffset(protocol.length + 3, completions);
                        });
                    }
                }
                return _Promise.reject(null);
            }
        }
    }, {
        key: 'suggestLayerName',
        value: function suggestLayerName(url) {
            var _getDataSource11 = this.getDataSource(url),
                _getDataSource12 = _slicedToArray(_getDataSource11, 2),
                dataSource = _getDataSource12[0],
                path = _getDataSource12[1];

            var suggestor = dataSource.suggestLayerName;
            if (suggestor !== undefined) {
                return suggestor(path);
            }
            return suggestLayerNameBasedOnSeparator(path);
        }
    }, {
        key: 'findSourceGroup',
        value: function findSourceGroup(url) {
            var _getDataSource13 = this.getDataSource(url),
                _getDataSource14 = _slicedToArray(_getDataSource13, 3),
                dataSource = _getDataSource14[0],
                path = _getDataSource14[1],
                dataSourceName = _getDataSource14[2];

            var helper = dataSource.findSourceGroup || findSourceGroupBasedOnSeparator;
            return helper(path) + dataSourceName.length + 3;
        }
    }]);

    return DataSourceProvider;
}(RefCounted);
//# sourceMappingURL=index.js.map