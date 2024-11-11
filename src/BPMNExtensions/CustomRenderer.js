import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { assign } from "min-dash";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from "tiny-svg";
import {
  getRoundRectPath,
  getFillColor,
  getStrokeColor,
  getSemantic,
  getLabelColor
} from "bpmn-js/lib/draw/BpmnRenderUtil";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

const HIGH_PRIORITY = 1500;

export default class CustomRenderer extends BaseRenderer {
  constructor(config, eventBus, bpmnRenderer, textRenderer, styles, pathMap) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;

    this.computeStyle = styles.computeStyle;
    this.textRenderer = textRenderer;

    this.defaultFillColor = config && config.defaultFillColor;
    this.defaultStrokeColor = config && config.defaultStrokeColor;
    this.defaultLabelColor = config && config.defaultLabelColor;
    this.pathMap = pathMap;
  }

  // Not used directly but called by something else. Leave it here
  canRender(element) {
    return isAny(element, ["factory:Executor", "factory:Connection", "factory:Inventory"]) && !element.labelTarget;
  }

  drawShape(parentNode, element, handler) {
    const shapeRenderers = {
      "factory:Executor": this.renderExecutorShape.bind(this),
      "factory:Inventory": this.renderInventoryShape.bind(this),
    }

    const renderShape = shapeRenderers[element.type];

    return renderShape ? renderShape(parentNode, element) : this.bpmnRenderer.drawShape(parentNode, element, handler);
  }

  // Other functions

  renderExecutorShape(parentNode, element) {
    const hexagon = drawHexagon(parentNode, element.width, element.height);

    this.renderEmbeddedLabel(
      parentNode,
      element,
      "center-middle",
      getLabelColor(element, this.defaultLabelColor, this.defaultStrokeColor)
    );

    return hexagon;
  }

  renderInventoryShape(parentNode, element) {
    const originalType = element.type;
    element.type = "bpmn:DataStoreReference";
    const shape = this.bpmnRenderer.drawShape(parentNode, element);
    element.type = originalType; // Revert type after rendering

    return shape;
  }

  drawConnection(parentNode, element) {
    const waypoints = element.waypoints;
    const pathData = createPath(waypoints);

    const connectionElement = svgCreate('path');
    svgAttr(connectionElement, {
      d: pathData,
      stroke: getStrokeColor(element, this.defaultStrokeColor),
      fill: 'none',
      'stroke-dasharray': '5, 5'
    });

    svgAppend(parentNode, connectionElement);

    return connectionElement;
  }


  drawPath(parentGfx, d, attrs) {
    attrs = this.lineStyle(attrs);

    var path = svgCreate('path', {
      ...attrs,
      d
    });

    svgAppend(parentGfx, path);

    return path;
  }

  lineStyle(attrs) {
    return this.computeStyle(attrs, ['no-fill'], {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      stroke: 'red',
      strokeWidth: 2
    });
  }

  getShapePath(shape) {
    if (is(shape, "factory:Executor")) {
      return getRoundRectPath(shape, 6);
    }
    return this.bpmnRenderer.getShapePath(shape);
  }

  renderEmbeddedLabel(parentGfx, element, align) {
    var semantic = getSemantic(element);

    return this.renderLabel(parentGfx, semantic.name, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getLabelColor(
          element,
          this.defaultLabelColor,
          this.defaultStrokeColor
        )
      }
    });
  }

  renderLabel(parentGfx, label, options) {
    options = assign(
      {
        size: {
          width: 100
        }
      },
      options
    );

    var text = this.textRenderer.createText(label || "", options);

    svgClasses(text).add("djs-label");

    svgAppend(parentGfx, text);

    return text;
  }

  _renderer(type) {
    if (type === 'factory:Connection') {
      return this.drawConnection;
    }
    return super._renderer(type);
  }
}

CustomRenderer.$inject = [
  "config.bpmnRenderer",
  "eventBus",
  "bpmnRenderer",
  "textRenderer",
  "styles",
  "pathMap"
];

function drawHexagon(parentNode, width, height) {
  const polygon = svgCreate("polygon");

  const x = width / 2;
  const y = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  const points = [
    x, y - radiusY,
    x + radiusX, y - radiusY / 2,
    x + radiusX, y + radiusY / 2,
    x, y + radiusY,
    x - radiusX, y + radiusY / 2,
    x - radiusX, y - radiusY / 2
  ].join(" ");

  svgAttr(polygon, {
    points: points,
    stroke: "#000",
    strokeWidth: 2,
    fill: "none"
  });

  svgAppend(parentNode, polygon);

  return polygon;
}

function createPath(waypoints) {

  let pathData = 'M ' + waypoints[0].x + ' ' + waypoints[0].y;
  for (let i = 1; i < waypoints.length; i++) {
    pathData += ' L ' + waypoints[i].x + ' ' + waypoints[i].y;
  }

  return pathData;
}