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

  canRender(element) {
    return isAny(element, ["factory:Executor", "factory:Connection", "factory:Batch"]) && !element.labelTarget;
  }

  drawShape(parentNode, element, handler) {
    var rect;

    if (is(element, "factory:Executor")) {

      rect = drawHexagon(parentNode, element.width, element.height);

      this.renderEmbeddedLabel(
        parentNode,
        element,
        "center-middle",
        getLabelColor(element, this.defaultLabelColor, this.defaultStrokeColor)
      );

      return rect;
    } else if (is(element, "factory:Batch")) {
      element.type = "bpmn:Task";
      element.width = 100;
      element.height = 80;
      const shape = this.bpmnRenderer.drawShape(parentNode, element, handler);
      element.type = "factory:Batch";

      let color;

      let hasBatchIncoming = true;
      let hasBatchOutgoing = true;

      //check if all incoming executor have products that have batch > 1
      for (let i = 0; i < element.businessObject.incoming?.length; i++) {
        if (element.businessObject.incoming[i]?.sourceRef?.product) {
          for (let j = 0; j < element.businessObject.incoming[i]?.sourceRef?.product.length; j++) {
            if (element.businessObject.incoming[i]?.sourceRef?.product[j]?.batch <= 1) {
              hasBatchIncoming = false;
              break;
            }
          }
        }
      }

      //check if all outgoing executor have products that have batch > 1
      for (let i = 0; i < element.businessObject.outgoing?.length; i++) {
        if (element.businessObject.outgoing[i]?.targetRef?.product) {
          for (let j = 0; j < element.businessObject.outgoing[i]?.targetRef?.product.length; j++) {
            if (element.businessObject.outgoing[i]?.targetRef?.product[j]?.batch <= 1) {
              hasBatchOutgoing = false;
              break;
            }
          }
        }
      }

    
      if (hasBatchIncoming && hasBatchOutgoing) {
        color = "none";
      } else {
        color = "orange";
      }

      //create gear icon
      var pathGear = this.pathMap.getScaledPath('TASK_TYPE_SERVICE', {
        abspos: {
          x: 12,
          y: 18,
        }
      });

      //draw gear icon
      const gear = this.drawPath(parentNode, pathGear, {
        fill: color,
        stroke: "black",
        strokeWidth: 1
      });

      //scale gear icon
      svgAttr(gear, {
        transform: "scale(1.2)"
      });

      return shape;
    }
    else {
      return this.bpmnRenderer.drawShape(parentNode, element, handler);
    }
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

// helpers //////////

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