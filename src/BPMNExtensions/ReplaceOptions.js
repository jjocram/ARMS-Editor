export var ACTIVITY_INTO_BATCH = [
  {
    label: "Batch Activity",
    actionName: "replace-with-batch",
    className: "bpmn-icon-service",
    target: {
      type: "factory:Batch"
    }
  }
];


export var BATCH_INTO_ACTIVITY = [
  {
    label: "Task",
    actionName: "replace-with-task",
    className: "bpmn-icon-task",
    target: {
      type: "bpmn:Task"
    }
  }
];

export var GATEWAY = [
  {
    label: 'Exclusive gateway',
    actionName: 'replace-with-exclusive-gateway',
    className: 'bpmn-icon-gateway-xor',
    target: {
      type: 'bpmn:ExclusiveGateway'
    }
  },
  {
    label: 'Parallel gateway',
    actionName: 'replace-with-parallel-gateway',
    className: 'bpmn-icon-gateway-parallel',
    target: {
      type: 'bpmn:ParallelGateway'
    }
  },
  {
    label: 'Inclusive gateway',
    actionName: 'replace-with-inclusive-gateway',
    className: 'bpmn-icon-gateway-or',
    target: {
      type: 'bpmn:InclusiveGateway'
    }
  },
  // {
  //   label: 'Complex gateway',
  //   actionName: 'replace-with-complex-gateway',
  //   className: 'bpmn-icon-gateway-complex',
  //   target: {
  //     type: 'bpmn:ComplexGateway'
  //   }
  // },
  // {
  //   label: 'Event-based gateway',
  //   actionName: 'replace-with-event-based-gateway',
  //   className: 'bpmn-icon-gateway-eventbased',
  //   target: {
  //     type: 'bpmn:EventBasedGateway',
  //     instantiate: false,
  //     eventGatewayType: 'Exclusive'
  //   }
  // }
];

export var INTERMEDIATE_EVENT = [
  // {
  //   label: 'Start event',
  //   actionName: 'replace-with-none-start',
  //   className: 'bpmn-icon-start-event-none',
  //   target: {
  //     type: 'bpmn:StartEvent'
  //   }
  // },
  // {
  //   label: 'Intermediate throw event',
  //   actionName: 'replace-with-none-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-none',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent'
  //   }
  // },
  // {
  //   label: 'End event',
  //   actionName: 'replace-with-none-end',
  //   className: 'bpmn-icon-end-event-none',
  //   target: {
  //     type: 'bpmn:EndEvent'
  //   }
  // },
  // {
  //   label: 'Message intermediate catch event',
  //   actionName: 'replace-with-message-intermediate-catch',
  //   className: 'bpmn-icon-intermediate-event-catch-message',
  //   target: {
  //     type: 'bpmn:IntermediateCatchEvent',
  //     eventDefinitionType: 'bpmn:MessageEventDefinition'
  //   }
  // },
  // {
  //   label: 'Message intermediate throw event',
  //   actionName: 'replace-with-message-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-throw-message',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent',
  //     eventDefinitionType: 'bpmn:MessageEventDefinition'
  //   }
  // },
  {
    label: 'Timer intermediate catch event',
    actionName: 'replace-with-timer-intermediate-catch',
    className: 'bpmn-icon-intermediate-event-catch-timer',
    target: {
      type: 'bpmn:IntermediateCatchEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    }
  },
  // {
  //   label: 'Escalation intermediate throw event',
  //   actionName: 'replace-with-escalation-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-throw-escalation',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent',
  //     eventDefinitionType: 'bpmn:EscalationEventDefinition'
  //   }
  // },
  // {
  //   label: 'Conditional intermediate catch event',
  //   actionName: 'replace-with-conditional-intermediate-catch',
  //   className: 'bpmn-icon-intermediate-event-catch-condition',
  //   target: {
  //     type: 'bpmn:IntermediateCatchEvent',
  //     eventDefinitionType: 'bpmn:ConditionalEventDefinition'
  //   }
  // },
  // {
  //   label: 'Link intermediate catch event',
  //   actionName: 'replace-with-link-intermediate-catch',
  //   className: 'bpmn-icon-intermediate-event-catch-link',
  //   target: {
  //     type: 'bpmn:IntermediateCatchEvent',
  //     eventDefinitionType: 'bpmn:LinkEventDefinition',
  //     eventDefinitionAttrs: {
  //       name: ''
  //     }
  //   }
  // },
  // {
  //   label: 'Link intermediate throw event',
  //   actionName: 'replace-with-link-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-throw-link',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent',
  //     eventDefinitionType: 'bpmn:LinkEventDefinition',
  //     eventDefinitionAttrs: {
  //       name: ''
  //     }
  //   }
  // },
  // {
  //   label: 'Compensation intermediate throw event',
  //   actionName: 'replace-with-compensation-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-throw-compensation',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent',
  //     eventDefinitionType: 'bpmn:CompensateEventDefinition'
  //   }
  // },
  // {
  //   label: 'Signal intermediate catch event',
  //   actionName: 'replace-with-signal-intermediate-catch',
  //   className: 'bpmn-icon-intermediate-event-catch-signal',
  //   target: {
  //     type: 'bpmn:IntermediateCatchEvent',
  //     eventDefinitionType: 'bpmn:SignalEventDefinition'
  //   }
  // },
  // {
  //   label: 'Signal intermediate throw event',
  //   actionName: 'replace-with-signal-intermediate-throw',
  //   className: 'bpmn-icon-intermediate-event-throw-signal',
  //   target: {
  //     type: 'bpmn:IntermediateThrowEvent',
  //     eventDefinitionType: 'bpmn:SignalEventDefinition'
  //   }
  // }
];
