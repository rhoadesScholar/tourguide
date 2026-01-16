import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Set from 'babel-runtime/core-js/set';
import _createClass from 'babel-runtime/helpers/createClass';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2018 Google Inc.
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
 * @file Basic annotation data structures.
 */
import { RefCounted } from '../util/disposable';
import { mat4 } from '../util/geom';
import { parseArray, verify3dScale, verify3dVec, verifyEnumString, verifyObject, verifyObjectProperty, verifyOptionalString, verifyString } from '../util/json';
import { getRandomHexString } from '../util/random';
import { Signal, NullarySignal } from '../util/signal';
import { Uint64 } from '../util/uint64';
import { numPointAnnotationElements, PointAnnotationSerilizer } from '../_zhaot/utils';
export var AnnotationReference = function (_RefCounted) {
    _inherits(AnnotationReference, _RefCounted);

    function AnnotationReference(id) {
        _classCallCheck(this, AnnotationReference);

        var _this = _possibleConstructorReturn(this, (AnnotationReference.__proto__ || _Object$getPrototypeOf(AnnotationReference)).call(this));

        _this.id = id;
        _this.changed = new NullarySignal();
        return _this;
    }

    return AnnotationReference;
}(RefCounted);
export var AnnotationType;
(function (AnnotationType) {
    AnnotationType[AnnotationType["POINT"] = 0] = "POINT";
    AnnotationType[AnnotationType["LINE"] = 1] = "LINE";
    AnnotationType[AnnotationType["AXIS_ALIGNED_BOUNDING_BOX"] = 2] = "AXIS_ALIGNED_BOUNDING_BOX";
    AnnotationType[AnnotationType["ELLIPSOID"] = 3] = "ELLIPSOID";
})(AnnotationType || (AnnotationType = {}));
export var annotationTypes = [AnnotationType.POINT, AnnotationType.LINE, AnnotationType.AXIS_ALIGNED_BOUNDING_BOX, AnnotationType.ELLIPSOID];
var typeHandlers = new _Map();
export function getAnnotationTypeHandler(type) {
    return typeHandlers.get(type);
}
typeHandlers.set(AnnotationType.LINE, {
    icon: 'ꕹ',
    description: 'Line',
    toJSON: function toJSON(annotation) {
        return {
            pointA: _Array$from(annotation.pointA),
            pointB: _Array$from(annotation.pointB)
        };
    },
    restoreState: function restoreState(annotation, obj) {
        annotation.pointA = verifyObjectProperty(obj, 'pointA', verify3dVec);
        annotation.pointB = verifyObjectProperty(obj, 'pointB', verify3dVec);
    },
    serializedBytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var pointA = annotation.pointA,
                pointB = annotation.pointB;

            var coordinateOffset = index * 6;
            coordinates[coordinateOffset] = pointA[0];
            coordinates[coordinateOffset + 1] = pointA[1];
            coordinates[coordinateOffset + 2] = pointA[2];
            coordinates[coordinateOffset + 3] = pointB[0];
            coordinates[coordinateOffset + 4] = pointB[1];
            coordinates[coordinateOffset + 5] = pointB[2];
        };
    }
});
typeHandlers.set(AnnotationType.POINT, {
    icon: '⚬',
    description: 'Point',
    toJSON: function toJSON(annotation) {
        return {
            point: _Array$from(annotation.point)
        };
    },
    restoreState: function restoreState(annotation, obj) {
        annotation.point = verifyObjectProperty(obj, 'point', verify3dVec);
    },
    serializedBytes: numPointAnnotationElements * 4,
    serializer: PointAnnotationSerilizer
});
typeHandlers.set(AnnotationType.AXIS_ALIGNED_BOUNDING_BOX, {
    icon: '❑',
    description: 'Bounding Box',
    toJSON: function toJSON(annotation) {
        return {
            pointA: _Array$from(annotation.pointA),
            pointB: _Array$from(annotation.pointB)
        };
    },
    restoreState: function restoreState(annotation, obj) {
        annotation.pointA = verifyObjectProperty(obj, 'pointA', verify3dVec);
        annotation.pointB = verifyObjectProperty(obj, 'pointB', verify3dVec);
    },
    serializedBytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var pointA = annotation.pointA,
                pointB = annotation.pointB;

            var coordinateOffset = index * 6;
            coordinates[coordinateOffset] = Math.min(pointA[0], pointB[0]);
            coordinates[coordinateOffset + 1] = Math.min(pointA[1], pointB[1]);
            coordinates[coordinateOffset + 2] = Math.min(pointA[2], pointB[2]);
            coordinates[coordinateOffset + 3] = Math.max(pointA[0], pointB[0]);
            coordinates[coordinateOffset + 4] = Math.max(pointA[1], pointB[1]);
            coordinates[coordinateOffset + 5] = Math.max(pointA[2], pointB[2]);
        };
    }
});
typeHandlers.set(AnnotationType.ELLIPSOID, {
    icon: '◎',
    description: 'Ellipsoid',
    toJSON: function toJSON(annotation) {
        return {
            center: _Array$from(annotation.center),
            radii: _Array$from(annotation.radii)
        };
    },
    restoreState: function restoreState(annotation, obj) {
        annotation.center = verifyObjectProperty(obj, 'center', verify3dVec);
        annotation.radii = verifyObjectProperty(obj, 'radii', verify3dScale);
    },
    serializedBytes: 6 * 4,
    serializer: function serializer(buffer, offset, numAnnotations) {
        var coordinates = new Float32Array(buffer, offset, numAnnotations * 6);
        return function (annotation, index) {
            var center = annotation.center,
                radii = annotation.radii;

            var coordinateOffset = index * 6;
            coordinates.set(center, coordinateOffset);
            coordinates.set(radii, coordinateOffset + 3);
        };
    }
});
export function annotationToJson(annotation) {
    var result = getAnnotationTypeHandler(annotation.type).toJSON(annotation);
    result.type = AnnotationType[annotation.type].toLowerCase();
    result.id = annotation.id;
    result.description = annotation.description || undefined;
    var segments = annotation.segments;

    if (segments !== undefined && segments.length > 0) {
        result.segments = segments.map(function (x) {
            return x.toString();
        });
    }
    return result;
}
export function restoreAnnotation(obj) {
    var allowMissingId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    verifyObject(obj);
    var type = verifyObjectProperty(obj, 'type', function (x) {
        return verifyEnumString(x, AnnotationType);
    });
    var id = verifyObjectProperty(obj, 'id', allowMissingId ? verifyOptionalString : verifyString) || makeAnnotationId();
    var result = {
        id: id,
        description: verifyObjectProperty(obj, 'description', verifyOptionalString),
        segments: verifyObjectProperty(obj, 'segments', function (x) {
            return x === undefined ? undefined : parseArray(x, function (y) {
                return Uint64.parseString(y);
            });
        }),
        type: type
    };
    getAnnotationTypeHandler(type).restoreState(result, obj);
    return result;
}
export var AnnotationSource = function (_RefCounted2) {
    _inherits(AnnotationSource, _RefCounted2);

    function AnnotationSource() {
        var objectToLocal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : mat4.create();

        _classCallCheck(this, AnnotationSource);

        var _this2 = _possibleConstructorReturn(this, (AnnotationSource.__proto__ || _Object$getPrototypeOf(AnnotationSource)).call(this));

        _this2.objectToLocal = objectToLocal;
        _this2.annotationMap = new _Map();
        _this2.changed = new NullarySignal();
        _this2.readonly = false;
        _this2.childAdded = new Signal();
        _this2.childUpdated = new Signal();
        _this2.childDeleted = new Signal();
        _this2.pending = new _Set();
        _this2.references = new _Map();
        return _this2;
    }

    _createClass(AnnotationSource, [{
        key: 'add',
        value: function add(annotation) {
            var commit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            if (!annotation.id) {
                annotation.id = makeAnnotationId();
            } else if (this.annotationMap.has(annotation.id)) {
                throw new Error('Annotation id already exists: ' + _JSON$stringify(annotation.id) + '.');
            }
            this.annotationMap.set(annotation.id, annotation);
            this.changed.dispatch();
            this.childAdded.dispatch(annotation);
            if (!commit) {
                this.pending.add(annotation.id);
            }
            return this.getReference(annotation.id);
        }
    }, {
        key: 'commit',
        value: function commit(reference) {
            var id = reference.id;
            this.pending.delete(id);
        }
    }, {
        key: 'update',
        value: function update(reference, annotation) {
            if (reference.value === null) {
                throw new Error('Annotation already deleted.');
            }
            reference.value = annotation;
            this.annotationMap.set(annotation.id, annotation);
            reference.changed.dispatch();
            this.changed.dispatch();
            this.childUpdated.dispatch(annotation);
        }
    }, {
        key: _Symbol$iterator,
        value: function value() {
            return this.annotationMap.values();
        }
    }, {
        key: 'get',
        value: function get(id) {
            return this.annotationMap.get(id);
        }
    }, {
        key: 'delete',
        value: function _delete(reference) {
            if (reference.value === null) {
                return;
            }
            reference.value = null;
            this.annotationMap.delete(reference.id);
            this.pending.delete(reference.id);
            reference.changed.dispatch();
            this.changed.dispatch();
            this.childDeleted.dispatch(reference.id);
        }
    }, {
        key: 'getReference',
        value: function getReference(id) {
            var _this3 = this;

            var existing = this.references.get(id);
            if (existing !== undefined) {
                return existing.addRef();
            }
            existing = new AnnotationReference(id);
            existing.value = this.annotationMap.get(id) || null;
            this.references.set(id, existing);
            existing.registerDisposer(function () {
                _this3.references.delete(id);
            });
            return existing;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = [];
            var pending = this.pending;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var annotation = _step.value;

                    if (pending.has(annotation.id)) {
                        // Don't serialize uncommitted annotations.
                        continue;
                    }
                    result.push(annotationToJson(annotation));
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

            return result;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.annotationMap.clear();
            this.pending.clear();
            this.changed.dispatch();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var annotationMap = this.annotationMap;

            annotationMap.clear();
            this.pending.clear();
            if (obj !== undefined) {
                parseArray(obj, function (x) {
                    var annotation = restoreAnnotation(x);
                    annotationMap.set(annotation.id, annotation);
                });
            }
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.references.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var reference = _step2.value;
                    var id = reference.id;

                    var value = annotationMap.get(id);
                    reference.value = value || null;
                    reference.changed.dispatch();
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

            this.changed.dispatch();
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.clear();
        }
    }]);

    return AnnotationSource;
}(RefCounted);
export var LocalAnnotationSource = function (_AnnotationSource) {
    _inherits(LocalAnnotationSource, _AnnotationSource);

    function LocalAnnotationSource() {
        _classCallCheck(this, LocalAnnotationSource);

        return _possibleConstructorReturn(this, (LocalAnnotationSource.__proto__ || _Object$getPrototypeOf(LocalAnnotationSource)).apply(this, arguments));
    }

    return LocalAnnotationSource;
}(AnnotationSource);
export var DATA_BOUNDS_DESCRIPTION = 'Data Bounds';
export function makeAnnotationId() {
    return getRandomHexString(160);
}
export function makeDataBoundsBoundingBox(lowerVoxelBound, upperVoxelBound) {
    return {
        type: AnnotationType.AXIS_ALIGNED_BOUNDING_BOX,
        id: 'data-bounds',
        description: DATA_BOUNDS_DESCRIPTION,
        pointA: lowerVoxelBound,
        pointB: upperVoxelBound
    };
}
function compare3WayById(a, b) {
    return a.id < b.id ? -1 : a.id === b.id ? 0 : 1;
}
export function serializeAnnotations(allAnnotations) {
    var totalBytes = 0;
    var typeToOffset = [];
    var typeToSegmentListIndexOffset = [];
    var totalNumSegments = 0;
    var totalNumAnnotations = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(annotationTypes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var annotationType = _step3.value;

            typeToOffset[annotationType] = totalBytes;
            typeToSegmentListIndexOffset[annotationType] = totalNumAnnotations;
            var annotations = allAnnotations[annotationType];
            var numSegments = 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(annotations), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var annotation = _step5.value;
                    var segments = annotation.segments;

                    if (segments !== undefined) {
                        numSegments += segments.length;
                    }
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

            totalNumAnnotations += annotations.length;
            totalNumSegments += numSegments;
            annotations.sort(compare3WayById);
            var count = annotations.length;
            var handler = getAnnotationTypeHandler(annotationType);
            totalBytes += handler.serializedBytes * count;
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

    var segmentListIndex = new Uint32Array(totalNumAnnotations + 1);
    var segmentList = new Uint32Array(totalNumSegments * 2);
    var typeToIds = [];
    var data = new ArrayBuffer(totalBytes);
    var segmentListOffset = 0;
    var segmentListIndexOffset = 0;

    var _loop = function _loop(_annotationType) {
        var annotations = allAnnotations[_annotationType];
        typeToIds[_annotationType] = annotations.map(function (x) {
            return x.id;
        });
        var count = annotations.length;
        var handler = getAnnotationTypeHandler(_annotationType);
        var serializer = handler.serializer(data, typeToOffset[_annotationType], count);
        annotations.forEach(function (annotation, index) {
            serializer(annotation, index);
            segmentListIndex[segmentListIndexOffset++] = segmentListOffset;
            var segments = annotation.segments;

            if (segments !== undefined) {
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = _getIterator(segments), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var segment = _step6.value;

                        segmentList[segmentListOffset * 2] = segment.low;
                        segmentList[segmentListOffset * 2 + 1] = segment.high;
                        ++segmentListOffset;
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
        });
    };

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = _getIterator(annotationTypes), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _annotationType = _step4.value;

            _loop(_annotationType);
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

    return { data: new Uint8Array(data), typeToIds: typeToIds, typeToOffset: typeToOffset, segmentListIndex: segmentListIndex, segmentList: segmentList };
}
export var AnnotationSerializer = function () {
    function AnnotationSerializer() {
        _classCallCheck(this, AnnotationSerializer);

        this.annotations = [[], [], [], []];
    }

    _createClass(AnnotationSerializer, [{
        key: 'add',
        value: function add(annotation) {
            this.annotations[annotation.type].push(annotation);
        }
    }, {
        key: 'serialize',
        value: function serialize() {
            return serializeAnnotations(this.annotations);
        }
    }]);

    return AnnotationSerializer;
}();
export function deserializeAnnotation(obj) {
    if (obj == null) {
        return obj;
    }
    var segments = obj.segments;
    if (segments !== undefined) {
        obj.segments = segments.map(function (x) {
            return new Uint64(x.low, x.high);
        });
    }
    return obj;
}
//# sourceMappingURL=index.js.map