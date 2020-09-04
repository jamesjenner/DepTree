import inherits from 'inherits';

import RuleProvider from '../../lib/features/rules/RuleProvider';

import { isFrameElement } from '../../lib/util/Elements';


export default function RuleProvider(eventBus) {
  RuleProvider.call(this, eventBus);
}

RuleProvider.$inject = [ 'eventBus' ];

inherits(RuleProvider, RuleProvider);


RuleProvider.prototype.init = function() {
  this.addRule('shape.create', function(context) {
    var target = context.target,
        shape = context.shape;

    return target.parent === shape.target;
  });

  this.addRule('connection.create', function(context) {
    var source = context.source,
        target = context.target;

    return source.parent === target.parent;
  });

  this.addRule('shape.resize', function(context) {
    var shape = context.shape;

    return isFrameElement(shape);
  });
};