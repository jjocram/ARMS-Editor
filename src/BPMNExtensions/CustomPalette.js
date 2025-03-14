export default class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries() {
    const { bpmnFactory, create, elementFactory, translate } = this;

    function createTask() {
      return function (event) {
        const businessObject = bpmnFactory.create("factory:Executor");
        businessObject.id = 'Executor' + businessObject.id;
        businessObject.quantity = "1"
        businessObject.cost = "0"
        businessObject.energyConsumption = "0"
        businessObject.wasteGeneration = "0"
        businessObject.maintenanceCost = "0"


        const shape = elementFactory.createShape({
          type: "factory:Executor",
          businessObject: businessObject
        });

        create.start(event, shape);
      };
    }

    function createInventory() {
      return function (event) {
        const businessObject = bpmnFactory.create("factory:Inventory");

        const shape = elementFactory.createShape({
          type: "factory:Inventory",
          businessObject: businessObject
        });

        create.start(event, shape);
      }
    }

    const additionalEntries = {
      "create.Executor": {
        group: "factory",
        className: "icon-custom-executor",
        title: translate("Create Executor"),
        action: {
          dragstart: createTask(),
          click: createTask()
        }
      },
      "create.Inventory": {
        group: "factory",
        className: "bpmn-icon-data-store",
        title: translate("Create Inventory"),
        action: {
          dragstart: createInventory(),
          click: createInventory()
        }
      }
    };

    return function (entries) {
      delete entries["create.subprocess-expanded"];
      delete entries["create.data-object"];
      delete entries["create.group"];
      delete entries["create.data-store"];
      delete entries["create.participant-expanded"];

      return {...entries, ...additionalEntries};
    };
  }
}

CustomPalette.$inject = [
  "bpmnFactory",
  "create",
  "elementFactory",
  "palette",
  "translate"
];
