var Notifications = (function () {
	
	var constructor = function (socket) {
		this.listeners = [];
		this.s = socket;

		//Setter opp listener
		var th = this,
		notification;
		this.s.on('notification', function (data) {

			var len = th.listeners.length;

			while(len--) {
				th.listeners[len](data);
			}

			if(window.Notification) {
				if(Notification.permission === "granted") {
					Notification.requestPermission(function () {
						var notification = new Notification(data.title, {
							body: data.notification
						});
					});
				} else if (Notification.permission !== 'denied') {
				    Notification.requestPermission(function (permission) {
					    if (permission === "granted") {
					    	var notification = new Notification(data.title, {
								body: data.notification
							});
					    }
				 	});
				}
			}
    	});
	};

	constructor.prototype = {
		listen: function (obj) {
			this.listeners.push(obj);
			return true;
		},
		
		empty: function () {
			this.listeners = [];
			return true;
		},

		create: function (obj) {
			var data = { //Some defaults
				'title': 'Notification',
				'notification': 'Hello World'
			};
			$.extend(data, obj);

			this.s.emit('notify', data);
			return true;
		}
	}
	return constructor;
}());