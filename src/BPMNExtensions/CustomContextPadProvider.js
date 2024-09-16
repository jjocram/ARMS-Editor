import inherits from 'inherits-browser';
import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';
import { assign, bind } from 'min-dash';

export default function CustomContextPadProvider(injector, connect, translate) {

  injector.invoke(ContextPadProvider, this);

  var cached = bind(this.getContextPadEntries, this);

  this.getContextPadEntries = function (element) {
    var actions = cached(element);
    var businessObject = element.businessObject;

    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }

    function removeConnection(e, element) {
      injector.get('modeling').removeElements([element]);

      const canvas = injector.get('canvas');
      const elementRegistry = injector.get('elementRegistry');
      const customRenderer = injector.get('customRenderer');

      const executors = elementRegistry.filter(element => element.type === 'factory:Executor');
      executors.forEach(executor => {
        if (executor.incoming.length === 0 && executor.outgoing.length === 0) {
          if (executor.businessObject && executor.businessObject.product) {
            executor.businessObject.product = [];
          }
        }
      });

      //Update batch elements to check gear icon
      const batches = elementRegistry.filter(element => element.type === 'factory:Batch');
      batches.forEach(batch => {
        const parent = canvas.getGraphics(batch);
        customRenderer.drawShape(parent, batch);
      });

    }

    function removeElement(e, element) {
      injector.get('modeling').removeElements([element]);
    }

    if (isAny(businessObject, ['factory:Executor'])) {

      if (businessObject.padProvider !== element) {
        actions = {
          'sequence-flow': {
            group: 'connect',
            className: 'bpmn-icon-connection-multi',
            title: translate('Create Sequence Flow'),
            action: {
              click: startConnect,
              dragstart: startConnect
            }
          },
          'delete': {
            group: 'edit',
            className: 'bpmn-icon-trash',
            title: translate('Delete'),
            action: {
              click: removeElement
            }
          }
        };
      }
    } else if (isAny(businessObject, ['factory:Connection'])) {
      actions = {
        'delete': {
          group: 'edit',
          className: 'bpmn-icon-trash',
          title: translate('Delete'),
          action: {
            click: removeConnection
          }
        }
      };
    }

    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  'injector',
  'connect',
  'translate'
];
