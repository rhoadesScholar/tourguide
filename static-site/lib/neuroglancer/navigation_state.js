import _Number$isFinite from 'babel-runtime/core-js/number/is-finite';
import _Number$isNaN from 'babel-runtime/core-js/number/is-nan';
import _Math$sign from 'babel-runtime/core-js/math/sign';
import _Object$keys from 'babel-runtime/core-js/object/keys';
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
import { RefCounted } from './util/disposable';
import { mat3, mat4, quat, vec3 } from './util/geom';
import { parseFiniteVec, verifyObject, verifyObjectProperty } from './util/json';
import { NullarySignal } from './util/signal';
import { TrackableEnum } from './util/trackable_enum';
export var NavigationLinkType;
(function (NavigationLinkType) {
    NavigationLinkType[NavigationLinkType["LINKED"] = 0] = "LINKED";
    NavigationLinkType[NavigationLinkType["RELATIVE"] = 1] = "RELATIVE";
    NavigationLinkType[NavigationLinkType["UNLINKED"] = 2] = "UNLINKED";
})(NavigationLinkType || (NavigationLinkType = {}));
export var TrackableNavigationLink = function (_TrackableEnum) {
    _inherits(TrackableNavigationLink, _TrackableEnum);

    function TrackableNavigationLink() {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : NavigationLinkType.LINKED;

        _classCallCheck(this, TrackableNavigationLink);

        return _possibleConstructorReturn(this, (TrackableNavigationLink.__proto__ || _Object$getPrototypeOf(TrackableNavigationLink)).call(this, NavigationLinkType, value));
    }

    return TrackableNavigationLink;
}(TrackableEnum);
export var VoxelSize = function (_RefCounted) {
    _inherits(VoxelSize, _RefCounted);

    function VoxelSize(voxelSize) {
        _classCallCheck(this, VoxelSize);

        var _this2 = _possibleConstructorReturn(this, (VoxelSize.__proto__ || _Object$getPrototypeOf(VoxelSize)).call(this));

        _this2.changed = new NullarySignal();
        var valid = true;
        if (voxelSize == null) {
            voxelSize = vec3.create();
            valid = false;
        }
        _this2.size = voxelSize;
        _this2.valid = valid;
        return _this2;
    }

    _createClass(VoxelSize, [{
        key: 'reset',
        value: function reset() {
            this.valid = false;
            this.changed.dispatch();
        }
        /**
         * This should be called after setting the voxel size initially.  The voxel
         * size should not be changed once it is valid.
         */

    }, {
        key: 'setValid',
        value: function setValid() {
            if (!this.valid) {
                this.valid = true;
                this.changed.dispatch();
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            if (!this.valid) {
                return undefined;
            }
            return Array.prototype.slice.call(this.size);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            try {
                parseFiniteVec(this.size, obj);
                this.valid = true;
                this.changed.dispatch();
            } catch (e) {
                this.valid = false;
                this.changed.dispatch();
            }
        }
    }, {
        key: 'toString',
        value: function toString() {
            if (!this.valid) {
                return null;
            }
            return this.size.toString();
        }
    }, {
        key: 'voxelFromSpatial',
        value: function voxelFromSpatial(voxel, spatial) {
            return vec3.divide(voxel, spatial, this.size);
        }
    }, {
        key: 'spatialFromVoxel',
        value: function spatialFromVoxel(spatial, voxel) {
            return vec3.multiply(spatial, voxel, this.size);
        }
    }]);

    return VoxelSize;
}(RefCounted);
var tempVec3 = vec3.create();
var tempQuat = quat.create();
function makeLinked(self, peer, link, operations) {
    var updatingSelf = false;
    var updatingPeer = false;
    var selfMinusPeer = void 0;
    self.registerDisposer(peer);
    var handlePeerUpdate = function handlePeerUpdate() {
        if (updatingPeer) {
            return;
        }
        updatingSelf = true;
        switch (link.value) {
            case NavigationLinkType.UNLINKED:
                if (operations.isValid(self)) {
                    break;
                } else {
                    // Fallthrough to LINKED case.
                }
            case NavigationLinkType.LINKED:
                operations.assign(self, peer);
                break;
            case NavigationLinkType.RELATIVE:
                operations.add(self, peer, selfMinusPeer);
                break;
        }
        updatingSelf = false;
    };
    var handleSelfUpdate = function handleSelfUpdate() {
        if (updatingSelf) {
            return;
        }
        switch (link.value) {
            case NavigationLinkType.UNLINKED:
                break;
            case NavigationLinkType.LINKED:
                operations.assign(peer, self);
                break;
            case NavigationLinkType.RELATIVE:
                operations.subtract(peer, self, selfMinusPeer);
                break;
        }
    };
    var previousLinkValue = NavigationLinkType.UNLINKED;
    var handleLinkUpdate = function handleLinkUpdate() {
        var linkValue = link.value;
        if (linkValue !== previousLinkValue) {
            switch (linkValue) {
                case NavigationLinkType.UNLINKED:
                    selfMinusPeer = undefined;
                    break;
                case NavigationLinkType.LINKED:
                    selfMinusPeer = undefined;
                    operations.assign(self, peer);
                    break;
                case NavigationLinkType.RELATIVE:
                    selfMinusPeer = operations.difference(self, peer);
                    break;
            }
        }
        previousLinkValue = linkValue;
        self.changed.dispatch();
    };
    self.registerDisposer(self.changed.add(handleSelfUpdate));
    self.registerDisposer(peer.changed.add(handlePeerUpdate));
    self.registerDisposer(link.changed.add(handleLinkUpdate));
    handleLinkUpdate();
    return self;
}
export var SpatialPosition = function (_RefCounted2) {
    _inherits(SpatialPosition, _RefCounted2);

    function SpatialPosition(voxelSize, spatialCoordinates) {
        _classCallCheck(this, SpatialPosition);

        var _this3 = _possibleConstructorReturn(this, (SpatialPosition.__proto__ || _Object$getPrototypeOf(SpatialPosition)).call(this));

        _this3.voxelCoordinates = null;
        _this3.changed = new NullarySignal();
        if (voxelSize == null) {
            voxelSize = new VoxelSize();
        }
        _this3.voxelSize = voxelSize;
        var spatialCoordinatesValid = true;
        if (spatialCoordinates == null) {
            spatialCoordinates = vec3.create();
            spatialCoordinatesValid = false;
        }
        _this3.spatialCoordinates = spatialCoordinates;
        _this3.spatialCoordinatesValid = spatialCoordinatesValid;
        _this3.registerDisposer(voxelSize);
        _this3.registerDisposer(voxelSize.changed.add(function () {
            _this3.handleVoxelSizeChanged();
        }));
        return _this3;
    }

    _createClass(SpatialPosition, [{
        key: 'reset',
        value: function reset() {
            this.spatialCoordinatesValid = false;
            this.voxelCoordinates = null;
            this.voxelSize.reset();
            this.changed.dispatch();
        }
    }, {
        key: 'getVoxelCoordinates',
        value: function getVoxelCoordinates(out) {
            var voxelCoordinates = this.voxelCoordinates;

            if (voxelCoordinates) {
                vec3.copy(out, voxelCoordinates);
            } else if (this.valid) {
                this.voxelSize.voxelFromSpatial(out, this.spatialCoordinates);
            } else {
                return false;
            }
            return true;
        }
        /**
         * Sets this position to the spatial coordinats corresponding to the specified
         * voxelPosition.  If this.voxelSize.valid == false, then this position won't
         * be set until it is.
         */

    }, {
        key: 'setVoxelCoordinates',
        value: function setVoxelCoordinates(voxelCoordinates) {
            var voxelSize = this.voxelSize;
            if (voxelSize.valid) {
                voxelSize.spatialFromVoxel(this.spatialCoordinates, voxelCoordinates);
                this.markSpatialCoordinatesChanged();
            } else {
                var voxelCoordinates_ = this.voxelCoordinates;
                if (!voxelCoordinates_) {
                    this.voxelCoordinates = voxelCoordinates_ = vec3.clone(voxelCoordinates);
                } else {
                    vec3.copy(voxelCoordinates_, voxelCoordinates);
                }
            }
            this.changed.dispatch();
        }
    }, {
        key: 'markSpatialCoordinatesChanged',
        value: function markSpatialCoordinatesChanged() {
            this.spatialCoordinatesValid = true;
            this.voxelCoordinates = null;
            this.changed.dispatch();
        }
    }, {
        key: 'handleVoxelSizeChanged',
        value: function handleVoxelSizeChanged() {
            if (this.voxelCoordinates != null && !this.spatialCoordinatesValid) {
                this.voxelSize.spatialFromVoxel(this.spatialCoordinates, this.voxelCoordinates);
                this.spatialCoordinatesValid = true;
            }
            this.voxelCoordinates = null;
            this.changed.dispatch();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var empty = true;
            var voxelSizeJson = this.voxelSize.toJSON();
            var obj = {};
            if (voxelSizeJson !== undefined) {
                empty = false;
                obj['voxelSize'] = voxelSizeJson;
            }
            if (this.voxelCoordinatesValid) {
                var voxelCoordinates = tempVec3;
                this.getVoxelCoordinates(voxelCoordinates);
                obj['voxelCoordinates'] = Array.prototype.slice.call(voxelCoordinates);
                empty = false;
            } else if (this.spatialCoordinatesValid) {
                obj['spatialCoordinates'] = Array.prototype.slice.call(this.spatialCoordinates);
                empty = false;
            }
            if (empty) {
                return undefined;
            }
            return obj;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this4 = this;

            verifyObject(obj);
            verifyObjectProperty(obj, 'voxelSize', function (x) {
                if (x !== undefined) {
                    _this4.voxelSize.restoreState(x);
                }
            });
            this.spatialCoordinatesValid = false;
            verifyObjectProperty(obj, 'voxelCoordinates', function (x) {
                if (x !== undefined) {
                    _this4.setVoxelCoordinates(parseFiniteVec(vec3.create(), x));
                }
            });
            verifyObjectProperty(obj, 'spatialCoordinates', function (x) {
                if (x !== undefined) {
                    parseFiniteVec(_this4.spatialCoordinates, x);
                    _this4.markSpatialCoordinatesChanged();
                }
            });
        }
    }, {
        key: 'snapToVoxel',
        value: function snapToVoxel() {
            if (!this.valid) {
                var voxelCoordinates = this.voxelCoordinates;

                if (voxelCoordinates != null) {
                    for (var i = 0; i < 3; ++i) {
                        voxelCoordinates[i] = Math.round(voxelCoordinates[i]);
                    }
                    this.changed.dispatch();
                }
            } else {
                var spatialCoordinates = this.spatialCoordinates;
                var voxelSize = this.voxelSize.size;
                for (var _i = 0; _i < 3; ++_i) {
                    var voxelSizeValue = voxelSize[_i];
                    spatialCoordinates[_i] = Math.round(spatialCoordinates[_i] / voxelSizeValue) * voxelSizeValue;
                }
                this.changed.dispatch();
            }
        }
    }, {
        key: 'assign',
        value: function assign(other) {
            this.spatialCoordinatesValid = other.spatialCoordinatesValid;
            vec3.copy(this.spatialCoordinates, other.spatialCoordinates);
            var voxelCoordinates = other.voxelCoordinates;

            this.voxelCoordinates = voxelCoordinates && vec3.clone(voxelCoordinates);
            this.changed.dispatch();
        }
        /**
         * Get the offset of `a` relative to `b`.
         */

    }, {
        key: 'valid',
        get: function get() {
            return this.spatialCoordinatesValid && this.voxelSize.valid;
        }
    }, {
        key: 'voxelCoordinatesValid',
        get: function get() {
            return this.valid || this.voxelCoordinates != null;
        }
    }], [{
        key: 'getOffset',
        value: function getOffset(a, b) {
            if (a.spatialCoordinatesValid && b.spatialCoordinatesValid) {
                return {
                    spatialOffset: vec3.subtract(vec3.create(), a.spatialCoordinates, b.spatialCoordinates)
                };
            }
            if (a.voxelCoordinates && b.voxelCoordinates) {
                if (a.voxelSize !== b.voxelSize) {
                    throw new Error('Voxel offsets are only meaningful with identical voxelSize.');
                }
                return { voxelOffset: vec3.subtract(vec3.create(), a.voxelCoordinates, b.voxelCoordinates) };
            }
            return {};
        }
    }, {
        key: 'addOffset',
        value: function addOffset(target, source, offset) {
            var scale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var spatialOffset = offset.spatialOffset,
                voxelOffset = offset.voxelOffset;

            if (spatialOffset !== undefined && source.spatialCoordinatesValid) {
                vec3.scaleAndAdd(target.spatialCoordinates, source.spatialCoordinates, spatialOffset, scale);
                target.markSpatialCoordinatesChanged();
            } else if (voxelOffset !== undefined && source.getVoxelCoordinates(tempVec3)) {
                target.setVoxelCoordinates(vec3.scaleAndAdd(tempVec3, tempVec3, voxelOffset, scale));
            }
        }
    }]);

    return SpatialPosition;
}(RefCounted);

var LinkedBase = function () {
    function LinkedBase(peer) {
        var link = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new TrackableNavigationLink();

        _classCallCheck(this, LinkedBase);

        this.peer = peer;
        this.link = link;
    }

    _createClass(LinkedBase, [{
        key: 'toJSON',
        value: function toJSON() {
            var link = this.link;

            if (link.value === NavigationLinkType.LINKED) {
                return undefined;
            }
            return { link: link.toJSON(), value: this.getValueJson() };
        }
    }, {
        key: 'getValueJson',
        value: function getValueJson() {
            return this.value.toJSON();
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.link.value = NavigationLinkType.LINKED;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this5 = this;

            if (obj === undefined || _Object$keys(obj).length === 0) {
                this.link.value = NavigationLinkType.LINKED;
                return;
            }
            verifyObject(obj);
            this.link.value = NavigationLinkType.UNLINKED;
            verifyObjectProperty(obj, 'value', function (x) {
                if (x !== undefined) {
                    _this5.value.restoreState(x);
                }
            });
            verifyObjectProperty(obj, 'link', function (x) {
                return _this5.link.restoreState(x);
            });
        }
    }, {
        key: 'copyToPeer',
        value: function copyToPeer() {
            if (this.link.value !== NavigationLinkType.LINKED) {
                this.link.value = NavigationLinkType.UNLINKED;
                this.peer.assign(this.value);
                this.link.value = NavigationLinkType.LINKED;
            }
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.value.changed;
        }
    }]);

    return LinkedBase;
}();

export var LinkedSpatialPosition = function (_LinkedBase) {
    _inherits(LinkedSpatialPosition, _LinkedBase);

    function LinkedSpatialPosition() {
        _classCallCheck(this, LinkedSpatialPosition);

        var _this6 = _possibleConstructorReturn(this, (LinkedSpatialPosition.__proto__ || _Object$getPrototypeOf(LinkedSpatialPosition)).apply(this, arguments));

        _this6.value = makeLinked(new SpatialPosition(_this6.peer.voxelSize.addRef()), _this6.peer, _this6.link, {
            assign: function assign(a, b) {
                return a.assign(b);
            },
            isValid: function isValid(a) {
                return a.spatialCoordinatesValid || a.voxelCoordinatesValid;
            },
            difference: SpatialPosition.getOffset,
            add: SpatialPosition.addOffset,
            subtract: function subtract(target, source, amount) {
                SpatialPosition.addOffset(target, source, amount, -1);
            }
        });
        return _this6;
    }

    _createClass(LinkedSpatialPosition, [{
        key: 'getValueJson',
        value: function getValueJson() {
            var value = this.value.toJSON() || {};
            delete value['voxelSize'];
            return value;
        }
    }]);

    return LinkedSpatialPosition;
}(LinkedBase);
function quaternionIsIdentity(q) {
    return q[0] === 0 && q[1] === 0 && q[2] === 0 && q[3] === 1;
}
export var OrientationState = function (_RefCounted3) {
    _inherits(OrientationState, _RefCounted3);

    function OrientationState(orientation) {
        _classCallCheck(this, OrientationState);

        var _this7 = _possibleConstructorReturn(this, (OrientationState.__proto__ || _Object$getPrototypeOf(OrientationState)).call(this));

        _this7.changed = new NullarySignal();
        if (orientation == null) {
            orientation = quat.create();
        }
        _this7.orientation = orientation;
        return _this7;
    }

    _createClass(OrientationState, [{
        key: 'toJSON',
        value: function toJSON() {
            var orientation = this.orientation;

            quat.normalize(this.orientation, this.orientation);
            if (quaternionIsIdentity(orientation)) {
                return undefined;
            }
            return Array.prototype.slice.call(this.orientation);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            try {
                parseFiniteVec(this.orientation, obj);
                quat.normalize(this.orientation, this.orientation);
            } catch (ignoredError) {
                quat.identity(this.orientation);
            }
            this.changed.dispatch();
        }
    }, {
        key: 'reset',
        value: function reset() {
            quat.identity(this.orientation);
            this.changed.dispatch();
        }
    }, {
        key: 'snap',
        value: function snap() {
            var mat = mat3.create();
            mat3.fromQuat(mat, this.orientation);
            var usedAxes = [false, false, false];
            for (var i = 0; i < 3; ++i) {
                var maxComponent = 0;
                var argmaxComponent = 0;
                for (var j = 0; j < 3; ++j) {
                    var value = mat[i * 3 + j];
                    mat[i * 3 + j] = 0;
                    if (usedAxes[j]) {
                        continue;
                    }
                    if (Math.abs(value) > Math.abs(maxComponent)) {
                        maxComponent = value;
                        argmaxComponent = j;
                    }
                }
                mat[i * 3 + argmaxComponent] = _Math$sign(maxComponent);
                usedAxes[argmaxComponent] = true;
            }
            quat.fromMat3(this.orientation, mat);
            this.changed.dispatch();
        }
        /**
         * Returns a new OrientationState with orientation fixed to peerToSelf * peer.orientation.  Any
         * changes to the returned OrientationState will cause a corresponding change in peer, and vice
         * versa.
         */

    }, {
        key: 'assign',
        value: function assign(other) {
            quat.copy(this.orientation, other.orientation);
            this.changed.dispatch();
        }
    }], [{
        key: 'makeRelative',
        value: function makeRelative(peer, peerToSelf) {
            var self = new OrientationState(quat.multiply(quat.create(), peer.orientation, peerToSelf));
            var updatingPeer = false;
            self.registerDisposer(peer.changed.add(function () {
                if (!updatingPeer) {
                    updatingSelf = true;
                    quat.multiply(self.orientation, peer.orientation, peerToSelf);
                    self.changed.dispatch();
                    updatingSelf = false;
                }
            }));
            var updatingSelf = false;
            var selfToPeer = quat.invert(quat.create(), peerToSelf);
            self.registerDisposer(self.changed.add(function () {
                if (!updatingSelf) {
                    updatingPeer = true;
                    quat.multiply(peer.orientation, self.orientation, selfToPeer);
                    peer.changed.dispatch();
                    updatingPeer = false;
                }
            }));
            return self;
        }
    }]);

    return OrientationState;
}(RefCounted);
export var LinkedOrientationState = function (_LinkedBase2) {
    _inherits(LinkedOrientationState, _LinkedBase2);

    function LinkedOrientationState() {
        _classCallCheck(this, LinkedOrientationState);

        var _this8 = _possibleConstructorReturn(this, (LinkedOrientationState.__proto__ || _Object$getPrototypeOf(LinkedOrientationState)).apply(this, arguments));

        _this8.value = makeLinked(new OrientationState(), _this8.peer, _this8.link, {
            assign: function assign(a, b) {
                return a.assign(b);
            },
            isValid: function isValid() {
                return true;
            },
            difference: function difference(a, b) {
                var temp = quat.create();
                return quat.multiply(temp, quat.invert(temp, b.orientation), a.orientation);
            },
            add: function add(target, source, amount) {
                quat.multiply(target.orientation, source.orientation, amount);
                target.changed.dispatch();
            },
            subtract: function subtract(target, source, amount) {
                quat.multiply(target.orientation, source.orientation, quat.invert(tempQuat, amount));
                target.changed.dispatch();
            }
        });
        return _this8;
    }

    return LinkedOrientationState;
}(LinkedBase);
export var Pose = function (_RefCounted4) {
    _inherits(Pose, _RefCounted4);

    function Pose(position, orientation) {
        _classCallCheck(this, Pose);

        var _this9 = _possibleConstructorReturn(this, (Pose.__proto__ || _Object$getPrototypeOf(Pose)).call(this));

        _this9.changed = new NullarySignal();
        if (position == null) {
            position = new SpatialPosition();
        }
        _this9.position = position;
        if (orientation == null) {
            orientation = new OrientationState();
        }
        _this9.orientation = orientation;
        _this9.registerDisposer(_this9.position);
        _this9.registerDisposer(_this9.orientation);
        _this9.registerDisposer(_this9.position.changed.add(_this9.changed.dispatch));
        _this9.registerDisposer(_this9.orientation.changed.add(_this9.changed.dispatch));
        return _this9;
    }

    _createClass(Pose, [{
        key: 'reset',

        /**
         * Resets everything.
         */
        value: function reset() {
            this.position.reset();
            this.orientation.reset();
        }
    }, {
        key: 'toMat4',
        value: function toMat4(mat) {
            mat4.fromRotationTranslation(mat, this.orientation.orientation, this.position.spatialCoordinates);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var positionJson = this.position.toJSON();
            var orientationJson = this.orientation.toJSON();
            if (positionJson === undefined && orientationJson === undefined) {
                return undefined;
            }
            return { 'position': positionJson, 'orientation': orientationJson };
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this10 = this;

            verifyObject(obj);
            verifyObjectProperty(obj, 'position', function (x) {
                if (x !== undefined) {
                    _this10.position.restoreState(x);
                }
            });
            verifyObjectProperty(obj, 'orientation', function (x) {
                if (x !== undefined) {
                    _this10.orientation.restoreState(x);
                }
            });
        }
        /**
         * Snaps the orientation to the nearest axis-aligned orientation, and
         * snaps the position to the nearest voxel.
         */

    }, {
        key: 'snap',
        value: function snap() {
            this.orientation.snap();
            this.position.snapToVoxel();
            this.changed.dispatch();
        }
    }, {
        key: 'translateAbsolute',
        value: function translateAbsolute(translation) {
            vec3.add(this.position.spatialCoordinates, this.position.spatialCoordinates, translation);
            this.position.changed.dispatch();
        }
    }, {
        key: 'translateRelative',
        value: function translateRelative(translation) {
            if (!this.valid) {
                return;
            }
            var temp = tempVec3;
            vec3.transformQuat(temp, translation, this.orientation.orientation);
            vec3.add(this.position.spatialCoordinates, this.position.spatialCoordinates, temp);
            this.position.changed.dispatch();
        }
    }, {
        key: 'translateVoxelsRelative',
        value: function translateVoxelsRelative(translation) {
            if (!this.valid) {
                return;
            }
            var temp = vec3.create();
            vec3.transformQuat(temp, translation, this.orientation.orientation);
            vec3.multiply(temp, temp, this.position.voxelSize.size);
            vec3.add(this.position.spatialCoordinates, this.position.spatialCoordinates, temp);
            this.position.changed.dispatch();
        }
    }, {
        key: 'rotateRelative',
        value: function rotateRelative(axis, angle) {
            var temp = quat.create();
            quat.setAxisAngle(temp, axis, angle);
            var orientation = this.orientation.orientation;
            quat.multiply(orientation, orientation, temp);
            this.orientation.changed.dispatch();
        }
    }, {
        key: 'rotateAbsolute',
        value: function rotateAbsolute(axis, angle, fixedPoint) {
            var temp = quat.create();
            quat.setAxisAngle(temp, axis, angle);
            var orientation = this.orientation.orientation;
            if (fixedPoint !== undefined) {
                // We want the coordinates in the transformed coordinate frame of the fixed point to remain
                // the same after the rotation.
                // We have the invariants:
                // oldOrienation * fixedPointLocal + oldPosition == fixedPoint.
                // newOrientation * fixedPointLocal + newPosition == fixedPoint.
                // Therefore, we compute fixedPointLocal by:
                // fixedPointLocal == inverse(oldOrientation) * (fixedPoint - oldPosition).
                var spatialCoordinates = this.position.spatialCoordinates;

                var fixedPointLocal = vec3.subtract(tempVec3, fixedPoint, spatialCoordinates);
                var invOrientation = quat.invert(tempQuat, orientation);
                vec3.transformQuat(fixedPointLocal, fixedPointLocal, invOrientation);
                // We then compute the newPosition by:
                // newPosition := fixedPoint - newOrientation * fixedPointLocal.
                quat.multiply(orientation, temp, orientation);
                vec3.transformQuat(spatialCoordinates, fixedPointLocal, orientation);
                vec3.subtract(spatialCoordinates, fixedPoint, spatialCoordinates);
                this.position.changed.dispatch();
            } else {
                quat.multiply(orientation, temp, orientation);
            }
            this.orientation.changed.dispatch();
        }
    }, {
        key: 'valid',
        get: function get() {
            return this.position.valid;
        }
    }]);

    return Pose;
}(RefCounted);
export var TrackableZoomState = function (_RefCounted5) {
    _inherits(TrackableZoomState, _RefCounted5);

    function TrackableZoomState() {
        var value_ = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Number.NaN;
        var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : value_;

        _classCallCheck(this, TrackableZoomState);

        var _this11 = _possibleConstructorReturn(this, (TrackableZoomState.__proto__ || _Object$getPrototypeOf(TrackableZoomState)).call(this));

        _this11.value_ = value_;
        _this11.defaultValue = defaultValue;
        _this11.changed = new NullarySignal();
        return _this11;
    }

    _createClass(TrackableZoomState, [{
        key: 'toJSON',
        value: function toJSON() {
            var value_ = this.value_,
                defaultValue = this.defaultValue;

            if (_Number$isNaN(value_) && _Number$isNaN(defaultValue) || value_ === defaultValue) {
                return undefined;
            }
            return value_;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            if (typeof obj === 'number' && _Number$isFinite(obj) && obj > 0) {
                this.value = obj;
            } else {
                this.value = this.defaultValue;
            }
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = this.defaultValue;
        }
    }, {
        key: 'zoomBy',
        value: function zoomBy(factor) {
            var value_ = this.value_;

            if (_Number$isNaN(value_)) {
                return;
            }
            this.value = value_ * factor;
        }
    }, {
        key: 'assign',
        value: function assign(other) {
            this.value = other.value;
        }
    }, {
        key: 'value',
        get: function get() {
            return this.value_;
        },
        set: function set(newValue) {
            if (newValue !== this.value_) {
                this.value_ = newValue;
                this.changed.dispatch();
            }
        }
    }, {
        key: 'valid',
        get: function get() {
            return !_Number$isNaN(this.value);
        }
    }]);

    return TrackableZoomState;
}(RefCounted);
export var LinkedZoomState = function (_LinkedBase3) {
    _inherits(LinkedZoomState, _LinkedBase3);

    function LinkedZoomState() {
        _classCallCheck(this, LinkedZoomState);

        var _this12 = _possibleConstructorReturn(this, (LinkedZoomState.__proto__ || _Object$getPrototypeOf(LinkedZoomState)).apply(this, arguments));

        _this12.value = function () {
            var self = new TrackableZoomState();
            var assign = function assign(target, source) {
                return target.assign(source);
            };
            var difference = function difference(a, b) {
                return a.value / b.value;
            };
            var add = function add(target, source, amount) {
                target.value = source.value * amount;
            };
            var subtract = function subtract(target, source, amount) {
                target.value = source.value / amount;
            };
            var isValid = function isValid(x) {
                return x.valid;
            };
            return makeLinked(self, _this12.peer, _this12.link, { assign: assign, isValid: isValid, difference: difference, add: add, subtract: subtract });
        }();
        return _this12;
    }

    return LinkedZoomState;
}(LinkedBase);
export var NavigationState = function (_RefCounted6) {
    _inherits(NavigationState, _RefCounted6);

    function NavigationState() {
        var pose = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Pose();
        var zoomFactor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Number.NaN;

        _classCallCheck(this, NavigationState);

        var _this13 = _possibleConstructorReturn(this, (NavigationState.__proto__ || _Object$getPrototypeOf(NavigationState)).call(this));

        _this13.pose = pose;
        _this13.changed = new NullarySignal();
        if (typeof zoomFactor === 'number') {
            _this13.zoomFactor = new TrackableZoomState(zoomFactor);
        } else {
            _this13.zoomFactor = zoomFactor;
        }
        _this13.registerDisposer(_this13.zoomFactor);
        _this13.registerDisposer(pose);
        _this13.registerDisposer(_this13.pose.changed.add(function () {
            _this13.changed.dispatch();
        }));
        _this13.registerDisposer(_this13.zoomFactor.changed.add(function () {
            _this13.changed.dispatch();
        }));
        _this13.registerDisposer(_this13.voxelSize.changed.add(function () {
            _this13.handleVoxelSizeChanged();
        }));
        _this13.handleVoxelSizeChanged();
        return _this13;
    }

    _createClass(NavigationState, [{
        key: 'reset',

        /**
         * Resets everything.
         */
        value: function reset() {
            this.pose.reset();
            this.zoomFactor.reset();
        }
    }, {
        key: 'setZoomFactorFromVoxelSize',
        value: function setZoomFactorFromVoxelSize() {
            var voxelSize = this.voxelSize;

            if (voxelSize.valid) {
                this.zoomFactor.value = Math.min.apply(null, this.voxelSize.size);
            }
        }
        /**
         * Sets the zoomFactor to the minimum voxelSize if it is not already set.
         */

    }, {
        key: 'handleVoxelSizeChanged',
        value: function handleVoxelSizeChanged() {
            if (!this.zoomFactor.valid) {
                this.setZoomFactorFromVoxelSize();
            }
        }
    }, {
        key: 'toMat4',
        value: function toMat4(mat) {
            this.pose.toMat4(mat);
            var zoom = this.zoomFactor.value;
            mat4.scale(mat, mat, vec3.fromValues(zoom, zoom, zoom));
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var poseJson = this.pose.toJSON();
            var zoomFactorJson = this.zoomFactor.toJSON();
            if (poseJson === undefined && zoomFactorJson === undefined) {
                return undefined;
            }
            return { 'pose': poseJson, 'zoomFactor': zoomFactorJson };
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this14 = this;

            try {
                verifyObject(obj);
                verifyObjectProperty(obj, 'pose', function (x) {
                    if (x !== undefined) {
                        _this14.pose.restoreState(x);
                    }
                });
                verifyObjectProperty(obj, 'zoomFactor', function (x) {
                    if (x !== undefined) {
                        _this14.zoomFactor.restoreState(x);
                    }
                });
                this.handleVoxelSizeChanged();
                this.changed.dispatch();
            } catch (parseError) {
                this.reset();
            }
        }
    }, {
        key: 'zoomBy',
        value: function zoomBy(factor) {
            this.zoomFactor.zoomBy(factor);
        }
    }, {
        key: 'voxelSize',
        get: function get() {
            return this.pose.position.voxelSize;
        }
    }, {
        key: 'position',
        get: function get() {
            return this.pose.position;
        }
    }, {
        key: 'valid',
        get: function get() {
            return this.pose.valid;
        }
    }]);

    return NavigationState;
}(RefCounted);
//# sourceMappingURL=navigation_state.js.map