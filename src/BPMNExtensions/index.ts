import CustomContextPadProvider from './CustomContextPadProvider';
import CustomElementFactory from './CustomElementFactory';
import CustomOrderingProvider from './CustomOrderingProvider';
import CustomPalette from './CustomPalette';
import CustomRenderer from './CustomRenderer';
import CustomRules from './CustomRules';
import CustomUpdater from './CustomUpdater';
import ReplaceMenuProvider from "./ReplaceMenuProvider";
import ReplaceConnectionBehavior from './ReplaceConnectionBehavior';

export default {
  __init__: [
    'contextPadProvider',
    'customRenderer',
    'customPalette',
    'customOrderingProvider',
    'customRules',
    'customUpdater',
    'elementFactory',
    'replaceMenuProvider',
    'replaceConnectionBehavior'
  ],
  contextPadProvider: [ 'type', CustomContextPadProvider ],
  customRenderer: [ 'type', CustomRenderer ],
  customOrderingProvider: [ 'type', CustomOrderingProvider ],
  customRules: [ 'type', CustomRules ],
  customUpdater: [ 'type', CustomUpdater ],
  elementFactory: [ 'type', CustomElementFactory ],
  customPalette: [ 'type', CustomPalette ],
  replaceMenuProvider: [ 'type', ReplaceMenuProvider ],
  replaceConnectionBehavior: [ 'type', ReplaceConnectionBehavior ]
};
