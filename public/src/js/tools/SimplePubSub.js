var PubSub = (function () {
    var constructor = function () {
        this.topics = {};
    };
    
    constructor.prototype = {
        on: function (topic, subscriber) {
            if(!this.topics.hasOwnProperty(topic)) {
                this.topics[topic] = [];
            }
            this.topics[topic].push(subscriber);
            return this;
        },
        off: function (topic, subscriber) {
            if(!this.topics.hasOwnProperty(topic)) {
                return false;
            }
            if(subscriber) {
				for(var i = 0, len = this.topics[topic].length; i < len; i++) {
					if(this.topics[topic][i] === subscriber) {
						this.topics[topic].splice(i, 1);
						return true;
					}
				}
			} else {
        		this.topics[topic] = [];
			}
        },
        trigger: function (topic, data) {
            var i = 0;
            if(this.topics[topic]) {
                for(i; i < this.topics[topic].length; i++) {
                    this.topics[topic][i](data);
                }
            }
        }
    }
    return constructor;
}());