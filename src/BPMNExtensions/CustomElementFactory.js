import {assign, forEach, omit} from "min-dash";

import inherits from "inherits-browser";

import BpmnElementFactory from "bpmn-js/lib/features/modeling/ElementFactory";
import {DEFAULT_LABEL_SIZE} from "bpmn-js/lib/util/LabelUtil";

import {ensureCompatDiRef} from "bpmn-js/lib/util/CompatibilityUtil";

import {isAny} from "bpmn-js/lib/features/modeling/util/ModelingUtil";
import {is} from "bpmn-js/lib/util/ModelUtil";

/**
 * A custom factory that knows how to create BPMN _and_ custom elements.
 */
export default function CustomElementFactory(bpmnFactory, moddle) {
    BpmnElementFactory.call(this, bpmnFactory, moddle);

    var self = this;

    /**
     * Create a diagram-js element with the given type (any of shape, connection, label).
     *
     * @param  {String} elementType
     * @param  {Object} attrs
     *
     * @return {djs.model.Base}
     */
    this.create = function (elementType, attrs) {
        var type = attrs.type;

        if (elementType === "label") {
            return self._baseCreate(
                elementType,
                assign({type: "label"}, DEFAULT_LABEL_SIZE, attrs)
            );
        }

        var size,
            businessObject = attrs.businessObject,
            di = attrs.di;

        if (/^factory:/.test(type)) {
            if (!businessObject) {
                businessObject = this._bpmnFactory.create(attrs.type);
                ensureCompatDiRef(businessObject);
            }

            if (!isModdleDi(di)) {
                var diAttrs = assign({}, di || {}, {id: businessObject.id + "_di"});

                if (type === 'factory:Connection') {
                    di = this._bpmnFactory.createDiEdge(businessObject, diAttrs);
                } else {
                    di = this._bpmnFactory.createDiShape(businessObject, diAttrs);
                }
            }

            size = this._getCustomElementSize(businessObject, di);

            attrs = applyAttributes(businessObject, attrs, [
                "processRef",
                "isInterrupting",
                "associationDirection",
                "isForCompensation"
            ]);

            attrs = assign(
                {
                    id: businessObject.id
                },
                attrs,
                size,
                {
                    businessObject: businessObject,
                    di: di
                }
            );

            // END minic ModdleElement API

            return this._baseCreate(elementType, attrs);
        }

        return this.createElement(elementType, attrs);
    };
}

inherits(CustomElementFactory, BpmnElementFactory);

CustomElementFactory.$inject = ["bpmnFactory", "moddle"];

/**
 * Returns the default size of custom shapes.
 *
 * The following example shows an interface on how
 * to setup the custom shapes's dimensions.
 *
 * @example
 *
 * var shapes = {
 *   triangle: { width: 40, height: 40 },
 *   rectangle: { width: 100, height: 20 }
 * };
 *
 * return shapes[type];
 *
 *
 * @param {Shape} shape
 *
 * @return {Dimensions} a {width, height} object representing the size of the element
 */
CustomElementFactory.prototype._getCustomElementSize = function (shape) {
    const shapes = {
        "factory:Inventory": {width: 60, height: 60},
        "factory:Executor": {width: 120, height: 60},
        "factory:Connection": {width: 0, height: 0},
        __default: {width: 120, height: 60}
    }

    return shapes[shape.$type] || shapes.__default;
};

/**
 * Apply attributes from a map to the given element,
 * remove attribute from the map on application.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {Array<string>} attributeNames name of attributes to apply
 *
 * @return {Object} changed attrs
 */
function applyAttributes(element, attrs, attributeNames) {
    forEach(attributeNames, function (property) {
        attrs = applyAttribute(element, attrs, property);
    });

    return attrs;
}

/**
 * Apply named property to element and drain it from the attrs
 * collection.
 *
 * @param {Base} element
 * @param {Object} attrs (in/out map of attributes)
 * @param {string} attributeName to apply
 *
 * @return {Object} changed attrs
 */
function applyAttribute(element, attrs, attributeName) {
    if (attrs[attributeName] === undefined) {
        return attrs;
    }

    element[attributeName] = attrs[attributeName];

    return omit(attrs, [attributeName]);
}

function isModdleDi(element) {
    return isAny(element, [
        "bpmndi:BPMNShape",
        "bpmndi:BPMNEdge",
        "bpmndi:BPMNDiagram",
        "bpmndi:BPMNPlane"
    ]);
}
