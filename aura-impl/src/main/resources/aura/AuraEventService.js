/*
 * Copyright (C) 2012 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*jslint sub: true */
/**
 * @namespace The Aura Event Service, accessible using $A.eventService. Creates and Manages Events.
 * @constructor
 */
var AuraEventService = function() {
    // #include aura.AuraEventService_private

    var eventService = {

        /**
         * Creates a new application event. Set the event parameters using <code>event.setParams()</code> and fire it using <code>event.fire()</code>.
         * For example, <code>$A.eventService.newEvent("app:navError")</code> fires the <code>app:navError</code> event. Set parameters on the new event
         * by using <code>event.setParams()</code>.
         * @param {String} name The event object in the format namespace:component
         * @memberOf AuraEventService
         * @public
         */
        newEvent : function(name){
            aura.assert(name, "name");

            name = priv.qualifyEventName(name);
            var eventDef = $A.services.event.getEventDef(name);
            if (!eventDef) {
                return null;
            }

            var config = {};
            config["eventDef"] = eventDef;
            config["eventDispatcher"] = priv.eventDispatcher;

            return new Event(config);

        },

        /**
         * Returns the new event.
         * @param {String} name The event object in the format namespace:component
         * @memberOf AuraEventService
         * @public
         */
        getValue : function(name) {
            return $A.services.event.newEvent(name);
        },

        /**
         * Adds an event handler.
         * @param {Object} config The data for the event handler
         * @memberOf AuraEventService
         * @public
         */
        addHandler : function(config) {
            config["event"] = priv.qualifyEventName(config["event"]);

            var handlers = priv.eventDispatcher[config["event"]];
            if (!handlers) {
                handlers = {};
                priv.eventDispatcher[config["event"]] = handlers;
            }
            var cmpHandlers = handlers[config["globalId"]];
            if (cmpHandlers === undefined) {
                cmpHandlers = [];
                handlers[config["globalId"]] = cmpHandlers;
            }
            cmpHandlers.push(config["handler"]);
        },

        /**
         * Removes an event handler.
         * @param {Object} config The data for the event
         * @memberOf AuraEventService
         * @public
         */
        removeHandler : function(config) {
            config["event"] = priv.qualifyEventName(config["event"]);

            var handlers = priv.eventDispatcher[config["event"]];
            if (handlers) {
                delete handlers[config["globalId"]];
            }
        },

        /**
         * Pushes an action to the action queue.
         * @param {Action} action The action to enqueue
         * @memberOf AuraEventService
         * @public
         */
        enqueueAction : function(action) {
            priv.actionQueue.push(action);
        },


        /**
         * Pushes an event to the event stack.
         * @param {Event} event The event to start firing
         * @memberOf AuraEventService
         * @private
         */
        startFiring : function(event) {
            //#if {"modes" : ["PTEST"]}
            // to only profile the transactions and not the initial page load
            if (event == "onclick") {
                // clear out existing timers
                $A.removeStats();
                $A.getContext().clearTransactionName();
                // start a Jiffy transaction
                $A.startTransaction($A.getContext().incrementTransaction());
            }
            //#end
            priv.eventStack.push(event);
        },

        /**
         * Clears the action queue.
         *
         * @memberOf AuraEventService
         * @private
         */
        finishFiring : function() {
            priv.eventStack.pop();
            if (priv.eventStack.length === 0) {
                priv.flushActionQueue();
            }

        },

        /**
         * Returns the event definition (EventDef).
         * @param {Object} config The parameters for the event
         * @memberOf AuraEventService
         * @public
         */
        getEventDef : function(config) {
            return priv.registry.getEventDef(config);
        },

        /**
         * Returns true if the event has handlers.
         * @param {String} name The event name
         * @memberOf AuraEventService
         * @public
         */
        hasHandlers : function(name) {
            name = priv.qualifyEventName(name);

            return !$A.util.isUndefined(priv.eventDispatcher[name]);
        }
        //#if {"excludeModes" : ["PRODUCTION", "PRODUCTIONDEBUG"]}
        ,
        /**
         * Returns the qualified name of all events known to the registry.
         * Available in DEV mode only.
         * @memberOf AuraEventService
         * @public
         */
        getRegisteredEvents : function() {
            var ret = "";
            for ( var event in priv.registry.eventDefs) {
                ret = ret + event;
                ret = ret + "\n";
            }
            return ret;
        },
        hasPendingEvents : function() {
            return priv.eventStack.length > 0;
        }
    //#end
    };
    // #include aura.AuraEventService_export
    return eventService;
};
