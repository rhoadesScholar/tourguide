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
import { SliceViewChunkSpecification } from '../sliceview/base';
export var ANNOTATION_METADATA_CHUNK_SOURCE_RPC_ID = 'annotation.MetadataChunkSource';
export var ANNOTATION_GEOMETRY_CHUNK_SOURCE_RPC_ID = 'annotation.GeometryChunkSource';
export var ANNOTATION_SUBSET_GEOMETRY_CHUNK_SOURCE_RPC_ID = 'annotation.SubsetGeometryChunkSource';
export var ANNOTATION_REFERENCE_ADD_RPC_ID = 'annotation.reference.add';
export var ANNOTATION_REFERENCE_DELETE_RPC_ID = 'annotation.reference.delete';
export var ANNOTATION_COMMIT_UPDATE_RPC_ID = 'annotation.commit';
export var ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID = 'annotation.commit';
export var AnnotationGeometryChunkSpecification = function (_SliceViewChunkSpecif) {
  _inherits(AnnotationGeometryChunkSpecification, _SliceViewChunkSpecif);

  function AnnotationGeometryChunkSpecification() {
    _classCallCheck(this, AnnotationGeometryChunkSpecification);

    return _possibleConstructorReturn(this, (AnnotationGeometryChunkSpecification.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunkSpecification)).apply(this, arguments));
  }

  return AnnotationGeometryChunkSpecification;
}(SliceViewChunkSpecification);
export var ANNOTATION_PERSPECTIVE_RENDER_LAYER_RPC_ID = 'annotation/PerspectiveRenderLayer';
export var ANNOTATION_RENDER_LAYER_RPC_ID = 'annotation/RenderLayer';
export var ANNOTATION_RENDER_LAYER_UPDATE_SEGMENTATION_RPC_ID = 'annotation/RenderLayer.updateSegmentation';
//# sourceMappingURL=base.js.map