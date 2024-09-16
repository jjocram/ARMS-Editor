import { is } from "bpmn-js/lib/util/ModelUtil";
import { isDifferentType } from "./TypeUtil";
import { forEach, filter } from "min-dash";
import * as replaceOptions from "./ReplaceOptions";

export default function CustomMenuProvider(
  popupMenu,
  modeling,
  moddle,
  bpmnReplace,
  rules,
  translate
) {
  this._popupMenu = popupMenu;
  this._modeling = modeling;
  this._moddle = moddle;
  this._bpmnReplace = bpmnReplace;
  this._rules = rules;
  this._translate = translate;

  this.register();
}

CustomMenuProvider.$inject = [
  "popupMenu",
  "modeling",
  "moddle",
  "bpmnReplace",
  "rules",
  "translate"
];

CustomMenuProvider.prototype.register = function () {
  this._popupMenu.registerProvider("bpmn-replace", this);
};

CustomMenuProvider.prototype.getEntries = function (element) {
  var businessObject = element.businessObject;
  var rules = this._rules;
  var entries = [];

  if (!rules.allowed("shape.replace", { element: element })) {
    return [];
  }

  var differentType = isDifferentType(element);
  if (element.type === 'factory:Batch') {
    entries = filter(replaceOptions.BATCH_INTO_ACTIVITY, differentType);
  }
  else if (is(businessObject, "bpmn:Task")) {
    entries = filter(replaceOptions.ACTIVITY_INTO_BATCH, differentType);
  }
  else if (is(businessObject, 'bpmn:Gateway')) {
    entries = filter(replaceOptions.GATEWAY, differentType);
  }
  else if (is(businessObject, 'bpmn:IntermediateCatchEvent') || is(businessObject, 'bpmn:IntermediateThrowEvent')) {
    entries = filter(replaceOptions.INTERMEDIATE_EVENT, differentType);
  }

  /*if (element.type === 'bpmn:Task') {
    element.x = element.x + 5;
    element.y = element.y - 5;
  }*/

  return this._createEntries(element, entries.filter(Boolean));
};

CustomMenuProvider.prototype._createEntries = function (element, replaceOptions) {
  var menuEntries = [];
  var self = this;

  forEach(replaceOptions, function (definition) {
    if (!definition) {
      console.warn("Found undefined definition in replaceOptions");
    } else {
      var entry = self._createMenuEntry(definition, element);
      if (entry) {
        menuEntries.push(entry);
      }
    }
  });

  return menuEntries;
};

CustomMenuProvider.prototype._createMenuEntry = function (definition, element, action) {
  var translate = this._translate;
  var replaceElement = this._bpmnReplace.replaceElement;

  if (!definition) {
    console.warn("definition is undefined or null");
    return null;
  }

  var replaceAction = function () {
    return replaceElement(element, definition.target);
  };

  var label = '';
  if (definition.label) {
    label = typeof definition.label === "function" ? definition.label(element) : definition.label;
  } else {
    console.warn("definition.label is undefined");
  }

  action = action || replaceAction;

  var menuEntry = {
    label: translate(label),
    className: definition.className,
    id: definition.actionName,
    action: action
  };

  return menuEntry;
};
