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
export function getSelectedAnnotation(mouseState, layerManager) {
    if (!mouseState.active) {
        return undefined;
    }
    if (mouseState.pickedAnnotationId === undefined) {
        return undefined;
    }
    var renderLayer = mouseState.pickedRenderLayer;
    if (renderLayer === null) {
        return undefined;
    }
    var annotationLayer = mouseState.pickedAnnotationLayer;
    if (annotationLayer === undefined) {
        return undefined;
    }
    var managedLayer = layerManager.renderLayerToManagedLayerMap.get(renderLayer);
    if (managedLayer === undefined) {
        return undefined;
    }
    return {
        layer: managedLayer,
        annotationLayer: annotationLayer,
        id: mouseState.pickedAnnotationId,
        partIndex: mouseState.pickedOffset
    };
}
export function setAnnotationHoverStateFromMouseState(annotationLayer, mouseState) {
    annotationLayer.registerDisposer(mouseState.changed.add(function () {
        if (mouseState.active && mouseState.pickedAnnotationLayer === annotationLayer) {
            var existingValue = annotationLayer.hoverState.value;
            if (existingValue === undefined || existingValue.id !== mouseState.pickedAnnotationId || existingValue.partIndex !== mouseState.pickedOffset) {
                annotationLayer.hoverState.value = {
                    id: mouseState.pickedAnnotationId,
                    partIndex: mouseState.pickedOffset
                };
            }
        } else {
            annotationLayer.hoverState.value = undefined;
        }
    }));
}
//# sourceMappingURL=selection.js.map