import inherits from 'inherits-browser';

import OrderingProvider from 'diagram-js/lib/features/ordering/OrderingProvider';


/**
 * a simple ordering provider that ensures that custom
 * connections are always rendered on top.
 */
export default function CustomOrderingProvider(eventBus, canvas) {

  OrderingProvider.call(this, eventBus);

  this.getOrdering = function(element, newParent) {

    if (element.type === 'factory:Connection') {

      return {
        parent: canvas.getRootElement(),
        index: -1
      };
    }
  };
}

CustomOrderingProvider.$inject = [ 'eventBus', 'canvas' ];

inherits(CustomOrderingProvider, OrderingProvider);