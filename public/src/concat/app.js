/*TODO
	
	Move independent objects into own files and set ut minify and concat tasks
*/
'use strict';

//Disable console
/*
console.log = function () {};
console.info = function () {};
*/
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var BugSmash = {};
BugSmash.router = (function () {
	
	var Router = Backbone.Router.extend({
		routes: {
			'': 'main',
			'?sites=:id': 'mainQuery',
			'site/:sitename': 'site',
			'bug/:id': 'bug',
			'login': 'login',
			'signout': 'signout',
			'register-bug': 'registerbug'
		}
	}),
	router = new Router();
	
	router.on('route:main', function (id) {
		//Ikke send id ned her....
		React.render(<BugSmash.reactComponents.MainAppView /*cleansearch="true"*//>, document.getElementById('main'));
		BugSmash.Core.pubsub.trigger('cleansearch', null);
	});
	
	router.on('route:bug', function (id) {
		React.render(<BugSmash.reactComponents.MainAppView id={id}/>, document.getElementById('main'));
	});
	
	router.on('route:registerbug', function () {
		React.render(<BugSmash.reactComponents.MainAppView register="true" />, document.getElementById('main'));
		//BugSmash.Core.pubsub.trigger('cleansearch', null);

		//React.render(<BugSmash.reactComponents.RegisterBugView />, document.getElementById('main'));
	});

	//FIKS
	router.on('route:login', function (id) {
		React.render(<BugSmash.reactComponents.LoginComponent id={id}/>, document.getElementById('main'));
	});

	//FIKS
	router.on('route:signout', function (id) {
		BugSmash.Core.ajax({
			url: '/auth/signout',
			type: 'POST',	
			callback: function () {
				BugSmash.user.set('loggedIn', false);
				BugSmash.router.navigate('/', {trigger: true});
			}
		});
	});
	
	/*
	router.on('route:registerbug', function (id) {
		React.render(<BugSmash.reactComponents.RegisterBugView />, document.getElementById('main'));
	});
	*/
	
	$('body').on('click', 'a:not(.silent)', function (e) {
		e.preventDefault();
		router.navigate(e.currentTarget.getAttribute("href"), {trigger: true});
	});
	
	return router;
}());

BugSmash.models = (function () {
	return {
		UserModel: Backbone.Model.extend() //
	}
}());


BugSmash.Core = (function () {
	var methods = {
		ajax: function (opts) {
			
			var settings = {
				url: '', 
				type: 'GET', 
				callback: null, 
				data: null,
				contentType: ''
			};
			settings = $.extend(settings, opts);
			//console.log(settings);
			var xhr = new XMLHttpRequest();
			xhr.open(settings.type, settings.url, true);
			xhr.onreadystatechange = function () {
				if(xhr.readyState === 4 && xhr.status === 200) {
					var jsonresult = xhr.responseText;

					if(jsonresult.length > 0) {
						jsonresult = JSON.parse(jsonresult);
					}
					if(settings.callback) {
						settings.callback(jsonresult);
					}
				}
			}
			
			if(settings.contentType) {
				xhr.setRequestHeader("Content-type", settings.contentType);
			}
			if(settings.type === "POST") {
				//xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				//xhr.setRequestHeader("Content-type", "multipart/form-data");
				xhr.send(settings.data);
			} else {
				xhr.send(null);
			}
		},
		checkAuth: function () {
			methods.ajax({
				url: '/auth/validate', 
				type: 'GET', 
				callback: function (data) {
					if(data.id) {
						BugSmash.user.set({
							'id': data.id,
							'loggedIn': true,
							'isAdmin': data.admin,
							'username': data.username
						});
					} else {
						BugSmash.user.set('loggedIn', false);
					}
				}
			});
			setTimeout(methods.checkAuth, 15000);
		}	
	};
	
	methods.checkAuth();
	
	return {
		start: function () {
			var th = this;
			window.socket = io.connect('http://10.0.0.48:8005');
			//window.socket = io.connect('http://bugsmash.wedinweb.no');
			//Eventhandler og notifications
			th.pubsub = new PubSub();
			th.notify = new Notifications(socket);
			//Settings
			th.settings = (function () {
				return {
					screenY: window.screenY,
					root: 'http://10.0.0.48:3001'
					//root: 'http://bugsmash.wedinweb.no'
				}
			}());

			/*
				TODO: Bytte ut pubsub.trigger i komponentene slik at de kun lytter til sockets
				- bug
				- comments
			*/

			/* Tar imot meldinger sentralt om nye bugs og kjører en trigger på funksjoner som lytter etter oppdateringer */
			socket.on('bug', function (data) {
				th.pubsub.trigger('bug', data);
			//	Kun dersom det gjelder MEG. så en sjekk på user.get('id') og innholdet i "data" er nødvendig
				/*
				if(data.userid == user.get('id')) {
					th.notify.create({
						'users_id': 1,
						'title': 'test',
						'notification': 'ny melding',
						'read': 0
					});
				}
				*/
			});

			/*Tar i mot meldinger om kommentarer og trigger alle som lytter */
			socket.on('comment', function (data) {
				th.pubsub.trigger('comment', data);
			});
			
		/*
			setInterval(function () {
				th.notify.create({
					'id': 100,
					'users_id': 1,
					'title': 'test',
					'notification': 'ny melding',
					'read': 0
				});
			}, 2000)
		*/	
			//Håndter routing også videre - tilpass router til å gi mulighet til å legge inn nye routes 
			//samt parse dem
		},
		
		ajax: methods.ajax
	}
	
}());

BugSmash.user = new BugSmash.models.UserModel({
	loggedIn: false,
	assignedSites: [],
	assignedBugs: []
});

BugSmash.reactComponents = (function () {
	return {
		
		MainAppView: React.createClass({
			getInitialState: function () {
				return {
					querystring: Backbone.history.getFragment(),
					loggedIn: false
				}
			},

			componentDidMount: function () {
				var th = this;

				this.setState({
					loggedIn: BugSmash.user.get('loggedIn')
				}, function () {
					th.size();
				});

				BugSmash.user.on('change', function () {
					this.setState({
						loggedIn: BugSmash.user.get('loggedIn')
					}, function () {
						th.size();
					});
					
				}, this);
			
				$(window).resize(function () {
					th.size();	
				});

				var domnode = $(this.getDOMNode());
				domnode.find('.col').each(function () {
					Ps.initialize(this);
				});
			},

			componentDidUpdate: function () {
				var domnode = $(this.getDOMNode());
				domnode.find('.col').each(function () {
					Ps.update(this);
				});
			},

			size: function () {
				var domnode = $(document.body),
				height = 75;
				if(this.state.loggedIn && this.state.loggedIn == true) {
					height = 115;
				}
				domnode.find('#leftbar').css('height', window.innerHeight-height);
				domnode.find('.grid').css('height', window.innerHeight-height);
				domnode.find('.col').css('height', window.innerHeight-height);
				domnode.find('.bugsubmit').css('height', window.innerHeight-height);
			},

			componentWillUnmount: function() {
				BugSmash.user.off('change');
			},
			/*
			DEPRECATED
			registerbugClick: function (e) {
				e.preventDefault();
				var submitter = document.getElementsByClassName('bugsubmit')[0];
				console.log(submitter);
				if(submitter.classList.contains('submitterHidden')) {
					submitter.classList.remove('submitterHidden');
				} else {
					submitter.classList.add('submitterHidden');
				}
			},
			*/

			render: function () {
				var assignedtouser,
				assignedbugs,
				notificationslist,
				maincomp,
				menudropdown = false,
				signedinmenu; 

				if(this.state.loggedIn) {
					assignedtouser = <BugSmash.reactComponents.AssignedToUserComponent />;
					assignedbugs = <BugSmash.reactComponents.AssignedBugsComponent />;
					notificationslist = <BugSmash.reactComponents.NotificationsListComponent />;
				}

				if(this.props.register && this.props.register === "true") {
					menudropdown = true;
					maincomp = <BugSmash.reactComponents.RegisterComponent />;
				} else {
					if(this.props.id) {
						menudropdown = true;
						maincomp = <BugSmash.reactComponents.BugComponent id={this.props.id}/>;
					} else {
						maincomp = <BugSmash.reactComponents.BugwallResult scope={this}/>;
					}
				}

				signedinmenu = <div id="leftbar">
									<a href="" className="menuelement">
										<div className="home"></div>
										Home
									</a>
									<a href="/login" className="menuelement">
										<div className="icon-user menuicon"></div>
										Sign in
									</a>
								</div>;
				//<BugSmash.reactComponents.NotificationsComponent />

				if(BugSmash.user.get('loggedIn')) {
					signedinmenu = (
						<div id="leftbar">
							<a href="" className="menuelement">
								<div className="home"></div>
								Home
							</a>
							<a href="/signout" className="menuelement">
								<div className="icon-user menuicon"></div>
								Sign out
							</a>
							<a href="/register-bug" className="menuelement">
								<div className="icon-bug menuicon"></div>
								Register bug
							</a>
							<a onClick={this.openChat} href="" className="menuelement silent">
								<div className="icon-bug menuicon"></div>
								Chat
							</a>
						</div>
					);
				}
				//	<BugSmash.reactComponents.RegisterComponent />
				return (
					<div>
					<BugSmash.reactComponents.HeaderComponent hasDropdown={menudropdown} />
						{signedinmenu}
						<div className="grid">

							<div className="contentwrap">
							
										
								<div className="large-6 columns col" id="bugwall">
									{maincomp}
								</div>

								<div className="large-4 columns col">
									<div id="sites" className="block">
										<BugSmash.reactComponents.Sites scope={this}/>
									</div>
									<div id="assignedToUser" className="block">
										{assignedtouser}
									</div>
									<div id="latestAssignedToUser" className="block">
										{assignedbugs}
									</div>
									
								</div>
								<div className="large-2 columns col">
									{notificationslist}
								</div>
							</div>
						</div>

						
						<BugSmash.reactComponents.ChatComponent />
						
					</div>
				);
			}
		}),
	/*
		RegisterBugView: React.createClass({
			render: function () {
				return (
					<div className="large-12 columns">
						<div className="large-2 columns" id="sites">
							&nbsp;	
						</div>
						<div className="large-4 columns" id="bugwall">
							<BugSmash.reactComponents.RegisterComponent />
						</div>
						
						<div className="large-3 columns">
							<div id="assignedToUser">
							
							</div>
							<div id="latestAssignedToUser" style={{ marginTop: 2 + 'em' }}>
								
							</div>
							<div className="copyright">&copy; - Glenn Wedin - <a href="http://www.wedinweb.no">wedinweb.no</a> - 2015</div>
							
						</div>
					</div>
				);
			}
		}),
*/

		HeaderComponent: React.createClass({

			componentDidMount: function () {
				var th = this;
				//th.search('');
				
				BugSmash.Core.pubsub.off('cleansearch');
				BugSmash.Core.pubsub.on('cleansearch', function () {
					th.search('');
				});
			},

			handleSearch: function (e) {
				if(e.keyCode === 40) {
					e.currentTarget.nextSibling.children[0].focus();
				} 
				if(e.keyCode === 13){
					var value = e.target.value,
						th = this;
					this.search(value);	
				}			
			},

			search: function (value) {
				var th = this,
					querystring = window.location.search,
					query = BugSmash.Core.settings.root+'/api/bugs?q='+value;

				if(querystring) {
					query = BugSmash.Core.settings.root+'/api/bugs'+querystring+'&q='+value;
				}
				
				var route = Backbone.history.getFragment();

				BugSmash.Core.ajax({
					url: query,
					type: 'GET',
					callback: function (data) {
						BugSmash.Core.pubsub.trigger('refreshwall', {
							query: value,
							data: data
						});
						//BugSmash.Core.pubsub.trigger('refreshdropdown', data);
					}
				});
			},

			render: function () {
				var dropdown = "";
				if(this.props.hasDropdown) {
					dropdown = <BugSmash.reactComponents.SearchDropdown />;
				}

				return (
					<div id="header">
						<div id="bugsearchHead" className="">
							<div className="searchwrap">
								<div className="icon-search"></div>
								<input onKeyUp={this.handleSearch} type="text" name="q" placeholder="Search bugs" />
								{dropdown}
							</div>
						</div>
						<div style={{float:'right',marginRight: '2em'}}>
						<h1><a href=""><span className="green">Bug</span>smash</a></h1>
						</div>
					</div>
				);
			}
		}),

		SearchDropdown: React.createClass({
			getInitialState: function () {
				return {results: [], query: ""};
			},

			componentDidMount: function () {
				var th = this;
				BugSmash.Core.pubsub.on('refreshwall', th.update);
			},

			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('refreshwall', this.update);
			},

			update: function (data) {
				this.setState({
					query: data.query,
					results: data.data
				});
			},

			click: function (e) {
				var id = e.currentTarget.getAttribute('data-id');
				BugSmash.router.navigate('/bug/'+id, {trigger: true});
				this.setState({
					results: []
				});
			},

			navigateFocus: function (e) {
				e.preventDefault();
				console.log(e.keyCode);
				if(e.keyCode === 40) {
					e.currentTarget.nextSibling.focus();
				} else if(e.keyCode === 38) {
					e.currentTarget.previousSibling.focus();
				} else if(e.keyCode === 13) {
					var id = e.currentTarget.getAttribute('data-id');
					BugSmash.router.navigate('/bug/'+id, {trigger: true});
					this.setState({
						results: []
					});
				}

			},

			render: function () {
				var th = this;
				var createList = function (obj, i) {
					var query = th.state.query,
					regex = new RegExp(query, "g"),
					title = obj.title.replace(regex, '<b>'+query+'</b>');
					
					return(
						<li tabIndex={i} onKeyDown={th.navigateFocus} onClick={th.click} data-id={obj.id} key={obj.id}>{obj.title} <div className="addsubscribe">+</div></li>
					);
				}

				return (
					<ul id="searchDropdown">
						{this.state.results.map(createList)}
					</ul>
				);
			}
		}),

		NotificationsListComponent: React.createClass({
			getInitialState: function () {
				return {
					notifications: []
				};
			},

			componentDidMount: function () {
				//Get last notifications
				this.get();
				//Listen for new
				this.listen();
			},

			/*
			componentDidUpdate: function (prevProp, prevState) {
				
				if(BugSmash.user.get('loggedIn')) {
					//Get last notifications
					console.log(this.state.notifications.length != prevState.notifications.length)
					if(this.state.notifications.length != prevState.notifications.length) {
						this.get();
					}
				}
			},
			*/

			shouldComponentUpdate: function (nextProp, nextState) {
				return true;
			},

			get: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/notifications',
					type: 'GET',
					callback: function (data) {
						if(data.length > 0) {
							th.setState({
								notifications: data
							});
						}
					}
				});
			},

			set: function () {
				var notifs = this.state.notifications;
				BugSmash.Core.ajax({
					'url': BugSmash.Core.settings.root+'/api/notifications',
					'type': 'POST',
					'data': JSON.stringify(notifs),
					'contentType': 'application/json;charset=UTF-8',
					'callback': function () {

					}
				});
			},

			listen: function () {
				var th = this;
				BugSmash.Core.notify.empty();
				BugSmash.Core.notify.listen(function (data) {
					var st = th.state.notifications;
					st.unshift(data);
					th.setState({
						notifications: st
					}, function () {
						th.forceUpdate();
					});
				});
			},

			setAsRead: function (e) {
				var id = e.target.getAttribute('data-notificationid'),
					notifications = this.state.notifications,
					th = this;

				notifications.forEach(function (n, i) {
					if(notifications[i].id == id) {
						notifications[i].read = 1;
					}
				});
				th.setState({
					notifications: notifications
				}, function () {
					//Update server
					th.set();
					th.forceUpdate();
				});
			},

			render: function () {
				var th = this;
				var createList = function (obj, i) {
					var notification = "notification";
					if(obj.read == 1) {
						notification += " read";
					}
					//console.log(obj);
					var url = obj.url;
					return (
						<div key={obj.id} className={notification}>
							<div className="action"><div title="Delete" onClick={th.setAsRead} data-notificationid={obj.id}>-</div></div>
							<div className="title"><a href={url}>{obj.title}</a></div>
							<div className="notification_text">{obj.notification}</div>
						</div>
					);
				};
				return (
					<div>
						<h3>Notifications</h3>
						<div id="notificationslist">
							{this.state.notifications.map(createList)}
						</div>
					</div>
				);
			}
		}),

		Sites: React.createClass({
			getInitialState: function () {
				return {sites: []}
			},
			componentDidMount: function () {
				var th = this;
				th.update();
				
				//TODO: socket.on('bug');
				BugSmash.Core.pubsub.on('bug', th.update);
			},

			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('bug', this.update);
			},

			update: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/sites', 
					type: 'GET', 
					callback: function (data) {
						th.setState({
							sites: data
						});
					}
				});
			},
			
			/*
			*	Trigger clean search
			*/
			click: function (e) {
				//BugSmash.Core.pubsub.trigger('cleansearch', null);
			},

			render: function () {
				var th = this,
				createLi = function (obj, i) {
					var url = '?sites='+obj.id,
					style = {
						backgroundColor: obj.color
					};

					return (
						<li key={obj.id} className="site" onClick={th.click}>
							<div className="marker" style={style}></div>
							<a href={url}>{obj.sitename} <div className="unresolved_count">{obj.count}</div></a>
						</li>
					);
				};
				
				return (
					<div>
					<h3>
						All bugs
						<span className="headicon">
							<img src="img/icons/folder.png" alt="" />
						</span>
					</h3>
					<ul id="siteslist" className="blist">
						{this.state.sites.map(createLi)}						
					</ul>
					</div>
				);
			}
		}),
		
		BugwallResult: React.createClass({
			getInitialState: function () {
				return {bugItems: []}
			},

			componentDidMount: function () {
				var th = this;

				//Legg til nyeste bug
				BugSmash.Core.pubsub.on('bug', function (data) {
					var b = th.state.bugItems;
					b.unshift(data);
					th.setState({
						bugItems: b
					});
				});

				//Kun denne som kan subscribe på refreshwall.
				BugSmash.Core.pubsub.on('refreshwall', function (bugs) {
					th.setState({
						bugItems: bugs.data
					});
				});

			},

			componentDidUpdate: function () {
				var head = this.getDOMNode().querySelector('h3');
				head.classList.add('blink');
				setTimeout(function () {
					head.classList.remove('blink');
				}, 300);				
			},

			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('refreshwall');
			},
			
			render: function () {
				return (
					<div>
						<h3>Latest bugs</h3>
						<BugSmash.reactComponents.BugItem bugItems={this.state.bugItems} />
					</div>
				);
			}	
		}),
		
		BugItem: React.createClass({
			clickHandler: function (e) {
				var id = e.currentTarget.getAttribute('data-id');
				BugSmash.router.navigate('/bug/'+id, {trigger: true});
			},

			componentDidUpdate: function () {
				//console.log(this.props.bugItems)
			},

			render: function () {
				var th = this;

				var createListItem = function (obj, i) {

					var date = moment(obj.date).format("DD.MM.YYYY HH:mm"),
					status = 'priLabel ' + (obj.statustext || '').replace(' ', ''),
					pri = 'priLabel ' + (obj.prioritytext || '').replace(' ', '');
					
					return (
						<li onClick={th.clickHandler} data-id={obj.id} key={obj.id} className="bug">
						<div className="buginfo">
							<div className="">{date}</div>
							<div className={status}>{obj.statustext}</div>
							<div className={pri}>{obj.prioritytext}</div>
							<div className="bug_sitename">{obj.sitename}</div>
						</div>
						<div className="bugwrap">
						<div className="bug_title">{obj.title}</div>
						<div className="bug_description"><p>{obj.description}</p></div>
						
						</div>
					</li>
					);
				};

				return (
					<ReactCSSTransitionGroup component="ul" id="bugslist" transitionName="example">
						{this.props.bugItems.map(createListItem)}
					</ReactCSSTransitionGroup>
				)
			}
		}),
		
		AssignedToUserComponent: React.createClass({
			getInitialState: function () {
				return {
					sites: []
				};
			},
			
			componentDidMount: function () {
				var th = this;
				th.update();
				
				BugSmash.Core.pubsub.on('bug', th.update);
			},

			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('bug', this.update);
			},
					
			update: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/users/bugsnum', 
					type: 'GET', 
					callback: function (data) {
						th.setState({ 
							sites: data 
						});
					}
				});	
			},

			click: function () {
				//BugSmash.Core.pubsub.trigger('cleansearch', null);
			},

					
			render: function () {
				var th = this;
				var createList = function (obj, i) {
					var url = '?sites='+obj.id+'&user=active',
					style = {
						backgroundColor: obj.color
					};
					

					return (
						<li key={obj.id} onClick={th.click} className="site">
							<div className="marker" style={style}></div>
							<a href={url}>{obj.sitename} <div className="unresolved_count">{obj.count}</div></a>
						</li>
					)
				};
				
				return (
					<div>
						<h3>
							Your bugs
							<span className="headicon">
								<img src="img/icons/person.png" alt="" />
							</span>
						</h3>
						<ul id="assignedsites" className="blist">
						 {this.state.sites.map(createList)}
						</ul>
					</div>
				)
			}
		}),

		AssignedBugsComponent: React.createClass({
			
			getInitialState: function () {
				return { bugs: [] };
			},
			
			componentDidMount: function () {
				var th = this;
				th.update();
				
				BugSmash.Core.pubsub.on('bug', th.update);
			},

			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('bug', this.update);
			},

			update: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/users/bugs', 
					type: 'GET', 
					callback: function (data) {
						th.setState({ 
							bugs: data 
						});
					}
				});
			},
			
			render: function () {
				
				var createList = function (obj, i) {
					var url = '/bug/'+obj.id,
					style = {
						backgroundColor: obj.color
					};

					return (
						<li className="site" key={obj.id}>
							<div className="marker" style={style}></div>
							<a href={url}>{obj.title}</a>
						</li>
					);
				};
				
				return (
					<div>
						<h3>
							Your latest bugs
							<span className="headicon">
								<img src="img/icons/pin.png" alt="" className="pin" />
							</span>
						</h3>

						<ul className="blist">
							{this.state.bugs.map(createList)}
						</ul>
					</div>
				);
			}
		}),
		
		BugComponent: React.createClass({
			getInitialState: function () {
				return { bug: {} }
			},

			componentDidMount: function () {
				this.get();
			},

			componentDidUpdate: function () {
				if(this.props.id != this.state.bug.id) {
					this.get();
				}
			},

			get: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id, 
					type: 'GET', 
					callback: function (data) {
						if (th.isMounted()) {
							th.setState({
								bug: data[0]
							});
						}
					}
				});
			},
			
			subscribe: function (e) {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id+'/subscribers',
					type: 'POST',
					callback: function (data) {
						th.get();
					}
				});
			},

			unsubscribe: function (e) {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id+'/subscribers',
					type: 'DELETE',
					callback: function (data) {
						th.get();
					}
				});
			},
			
			render: function () {
				var status = 'priLabel ' + (this.state.bug.statustext || '').replace(' ', ''),
					pri = 'priLabel ' + (this.state.bug.prioritytext || '').replace(' ', ''),
					date = moment(this.state.bug.date).format("DD.MM.YYYY HH:mm");

					//console.log(pri)
					var statuschanger = "",
					statuschanger2 = "",
					subscribe = "",
					comments = "";

					if(BugSmash.user.get('loggedIn')) {
						if(this.state.bug.subscribed > 0) {
							subscribe = <div className="sub" onClick={this.unsubscribe}>Unsubscribe</div>
						} else {
							subscribe = <div className="sub" onClick={this.subscribe}>Subscribe</div>;
						}

						comments = <BugSmash.reactComponents.CommentComponent id={this.props.id}/>;
						if(BugSmash.user.id == this.state.bug.userid || BugSmash.user.id == this.state.bug.assignedFrom) {
							statuschanger  = <BugSmash.reactComponents.StatusChangerComponent key="1" callback={this.get} type="status" id={this.state.bug.id} text={this.state.bug.statustext} />
							statuschanger2 = <BugSmash.reactComponents.StatusChangerComponent key="2" callback={this.get} type="priority" id={this.state.bug.id} text={this.state.bug.prioritytext} />
						}
					}
					

				//	console.log(this.state.bug)
				return (
					<div className="thebug">
						<h1>{this.state.bug.title}</h1>
						
						<div className="buginfo large-3 columns">
							<div className="">
							{date}
							</div>
							<div className={status}>
							{this.state.bug.statustext}
							</div>
							<div className={pri}>
							{this.state.bug.prioritytext}
							</div>
							<div className="bug_sitename">
								{this.state.bug.sitename}
							</div>
						</div>
						<div className="large-9 columns bugcontent">
							<div className="description">
								<p>{this.state.bug.description}</p>
							</div>
							<div className="description">
								<h2>Steps to reproduce</h2>
								<pre>{this.state.bug.reproduce}</pre>
							</div>
							<div className="description">
								<h2>Screenshots</h2>
								<pre>{this.state.bug.screenshots}</pre>
							</div>
						</div>
						<div className="bottomoptions">
							{subscribe}
							{statuschanger}
							{statuschanger2}													
						</div>
						{comments}
					</div>
				);
			}
		}),

		
		StatusChangerComponent: React.createClass({
			getInitialState: function () {
				return { values: []}
			},

			change: function (e) {
				var nodes = document.querySelectorAll('.sellist'),
				 	target = e.currentTarget,
					th = this;
					nodes = Array.prototype.slice.call(nodes);
					nodes.forEach(function (el, i) {
					el.style.display="none";
				});

				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/'+this.props.type,
					callback: function (data) {
						var currentList = target.querySelector('.sellist');
						currentList.style.display="block";
						
						th.setState({
							values: data
						});
						
					}
				});
			},

			setStatus: function (e) {
				e.stopPropagation();

				e.target.parentNode.style.display="none";

				var id = e.target.getAttribute('data-id'),
				th = this;

				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id,
					type: 'POST',
					callback: function (data) {
						//console.log(data);
						th.props.callback();
					},
					data: this.props.type+'id='+id,
					contentType: "application/x-www-form-urlencoded"
				});
			},

			render: function () {
				var th = this;
				var createList = function (obj, i) {
					return (
						<li onClick={th.setStatus} data-id={obj.id}>{obj.text}</li>
					);
				};

				return (
					<div className="sub" onClick={this.change}>
						<ul className="sellist">
							{this.state.values.map(createList)}
						</ul>
						<div className="icon-pencil icon"></div>
						{this.props.text}
					</div>
				)
			}
		}),
		
		LoginComponent: React.createClass({
			
			submit: function (e) {
				e.preventDefault();
				var logindata = $(e.target).serialize();
				/*var username = e.target.getElementById('login_username').value,
				password = e.target.getElementById('login_password').value;*/
				
				BugSmash.Core.ajax({
					url: '../auth/login', 
					type: 'POST', 
					callback: function (data) {
						if(data.id) {
							//user.set('id', data.id);
							BugSmash.user.set({
								'id': data.id,
								'loggedIn': true,
								'isAdmin': data.admin,
								'username': data.username
							});
							//user.set('isAdmin', data.admin);
							BugSmash.router.navigate('/', {trigger: true});
						}

					}, 
					contentType: "application/x-www-form-urlencoded",
					data: logindata
				});
			},
			
			render: function () {
				return (
					<div className="row">
					<div className="large-4 columns">&nbsp;</div>
					<div className="loginform large-4 columns">
						<div className="large-12 columns">
							<h1>Log in</h1>
							<form onSubmit={this.submit} method="post" action="">
								<label>Username or email</label>
								<div className="inputwrap">
									<div className="icon-user icon"></div>
									<input type="text" name="username" placeholder="user@example.com" defaultValue="gjest"/>
								</div>
								<label>Password</label>
								<div className="inputwrap">
									<div className="icon-key icon"></div>
									<input type="password" name="password" placeholder="password" defaultValue="gjest"/>
								</div>
								<input type="submit" value="Log in"/>
							</form>
						</div>
					</div>
					<div className="large-4 columns">&nbsp;</div>
					</div>
				);
			}
		}),
		
		RegisterComponent: React.createClass({
			filesList: [],
						
			screenshots: function (e) {
				e.preventDefault();
				e.target.parentNode.getElementsByClassName('files')[0].click();
			},
			
			showFiles: function (e) {
				var files = e.target.files,
				i = 0,
				filediv = document.getElementById('filelist'),
				file, 
				th = this;
			
				for(i; i < files.length; i++) {
					filediv.innerHTML+='<div>'+files[i].name+'</div>';
					
					file = new FormData();
					file.append('screenshot', files[i]);
					
					BugSmash.Core.ajax({
						url:BugSmash.Core.settings.root+'/api/fileupload', 
						type: 'POST', 
						callback: function (data) {
						//	console.log(data.filename)
							th.filesList.push(data.filename);
						}, 
						data: file
					});
					
				}
			},
			
			submit: function (e) {
				e.preventDefault();
				var postdata = $(e.target).serializeArray(),
				i = 0, th = this;
				postdata.push({name:'filenames', value: th.filesList});
				
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/submitbug',
					type: 'POST',
					callback: function (data) {
						console.log(data);
						//Varsler om hvilken bug som er opprettet
						/*Socketserver sender svar "bug" med info til alle som lytter slik at det blir oppdatert
						umiddelbart	*/
						socket.emit('bugcreated', data.id);

						//Sender en customized notification til notificationssystemet
						//Burde denne flyttes til 
						BugSmash.Core.notify.create({
							'users_id': data.assignto,
							'title': 'New bug report',
							'notification': data.title,
							'read': 0,
							'url': '/bug/'+data.id
						});
						BugSmash.router.navigate('/', {trigger: true});
					},
					data: $.param(postdata),
					contentType: "application/x-www-form-urlencoded"
				});				
				//ikke last opp filene her, kun sende inn navn og referanser til de opplastede filene				
			},
			
			render: function () {
				return (
					<div className="bugsubmit submitterHidden">
						<h1>Submit a bug report</h1>
						<form action="" method="post" onSubmit={this.submit}>
							<label>Title</label>
							<input type="text" name="title" placeholder="E.g Can't log in" />
							<label>Select that the bug applies to</label>
							<BugSmash.reactComponents.ProjectsListComponent />
							<label>Priority</label>
							<select name="priority">
								<option value="1">Low priority</option>
								<option value="2">Important</option>
								<option value="3">Critical</option>
							</select>
							<label>Assign to</label>
							<BugSmash.reactComponents.UsersListComponent />
							<label>Describe the bug</label>
							<textarea name="description"></textarea>
							<label>Steps to reproduce</label>
							<textarea name="repro"></textarea>
							<button onClick={this.screenshots}>Select screenshots</button>
							<div id="filelist"></div>
							<input onChange={this.showFiles} type="file" name="files" multiple className="files"/>
							<input type="submit" value="Submit bug"/>
						</form>
					</div>
				);
			}		
		}),
		
		ProjectsListComponent: React.createClass({
			getInitialState: function () {
				return {projects: []};
			},
			
			componentDidMount: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/projects',
					type: 'GET',
					callback: function (data) {
						th.setState({
							projects: data
						});
					}
				});
			},
			
			render: function () {
				var createList = function (obj, i) {
					return <option key={obj.id} value={obj.id}>{obj.sitename}</option>;
				};
				
				return(
					<select name="projects">
						{this.state.projects.map(createList)}
					</select>
				);
			}
		}),
		
		UsersListComponent: React.createClass({
			getInitialState: function () {
				return {users: []};
			},
			
			componentDidMount: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/users',
					type: 'GET',
					callback: function (data) {		
						console.log(data);				
						th.setState({
							users: data
						});
					}
				});
			},
			
			render: function () {
				var createList = function (obj, i) {
					return <option key={obj.id} value={obj.id}>{obj.name}</option>;
				};
				return(
					<select name="assignto">
						<option value="0">Unassigned</option>
						{this.state.users.map(createList)}
					</select>
				);
			}
		}),
		
		ScreenshotsComponent: React.createClass({
			getInitialState: function () {
				return {screenshots: []};
			},
			
			componentDidMount: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id+'/screenshots',
					type: 'GET',
					callback: function (data) {
						th.setState({
							screenshots: data
						});
					}
				});
			},
			
			openImage: function (e) {
				e.preventDefault();	
				e.stopPropagation();
				var href = e.currentTarget.getAttribute('href'),
				html = '<div class="screenshotwrap">\
						<div style="background-image:url('+href+');" class="screenshot"></div>\
						</div>';
									
				document.body.innerHTML+=html;
				document.getElementsByClassName('screenshotwrap')[0].addEventListener('click', function (e) {
					document.body.removeChild(this);
				});
			},
			
			render: function () {
				var th = this;
				var createList = function (obj, i) {
					var link = '../uploads/'+obj.pathname,
						name = 'Screenshot '+(i+1);
					return (
						<li key={obj.id} className="site">
						<a target="_blank" className="silent" onClick={th.openImage} href={link}>{name}</a>
						</li>
					);
				};
				
				return(
					<div>
					<h3>Screenshots</h3>
					<ul className="blist">
						{this.state.screenshots.map(createList)}
					</ul>
					</div>
				);
			}
		}),
		
		CommentComponent: React.createClass({
			
			getInitialState: function () {
				return {
					id: null,
					comments: []
				};
			},
			
			componentDidMount: function () {
				var th = this,
				items = [];

				th.setState({
					id: this.props.id
				});
				
				BugSmash.Core.pubsub.on('comment', function (data) {
					items = th.state.comments;
					items.unshift(data);
					th.setState({
						comments: items
					});
				});
				th.update();
			},			

			componentDidUpdate: function (prevProps, prevState) {
				if(prevProps.id !== this.props.id) {
					this.update();
				}
			},
			
			componentWillUnmount: function () {
				BugSmash.Core.pubsub.off('comment');
			},
			
			update: function () {
				var th = this;
				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id+'/comments',
					type: 'GET',
					callback: function (data) {
						th.setState({
							comments: data
						});
					}
				});
			},
			
			submitComment: function (e) {
				e.preventDefault();
				var comment = e.target.getElementsByTagName('textarea')[0].value,
				th = this;

				BugSmash.Core.ajax({
					url: BugSmash.Core.settings.root+'/api/bugs/'+this.props.id+'/comments',
					type: 'POST',
					callback: function (id) {
						//console.log(id)
						socket.emit('commentcreated', id);
					},
					contentType: "application/x-www-form-urlencoded",
					data: 'comment='+comment
				});
				e.target.getElementsByTagName('textarea')[0].value = "";
			},
			
			render: function () {
				
				var appendComment = function (obj, i) {
					var date = moment(obj.created).format("DD.MM.YYYY HH:mm");

					return (
						<div key={obj.id} className="comment">
							<div className="commenttop">
								<div className="username">{obj.user}</div>
								<div className="date">{date}</div>
							</div>
							<div className="thecomment">{obj.comment}</div>
						</div>
					);
				};
				
				return (
					<div>
						<h3>Comments</h3>
						{this.state.comments.map(appendComment)}
						<div>
							<form onSubmit={this.submitComment}>
								<textarea placeholder="Legg til kommentar"></textarea>
								<input type="submit" value="Submit comment" />
							</form>
						</div>
					</div>
				);
			}
		}),

		ChatComponent: React.createClass({

			getInitialState: function () {
				return {
					users: [],
					activeChats: []
				};
			},

			componentDidMount: function () {
				var th = this;
				
				//Må fikse en måte å unbinde disse på				
				socket.on('currentUsers', th.getCurrentUsers);
				socket.on('userAdded', th.addUser);
				socket.on('userRemoved', th.removeUser);

				
				
				var findIndex = function (array, id) {
					for(var i in array) {
						//console.log(array);
						if(array[i].to == id) {
							return i;
						}
						if(array[i].id == id) {
							return i;
						}
					}
					return false;
				};

				socket.on('recieve', function (message) {
					console.log(message)			
					var chats = th.state.activeChats;
					
					var i = findIndex(chats, message.from);
					
					if(i) {
						chats[i].messages.push(message);
					} else {
						var messagesArr = [];
						messagesArr.push(message); 
						chats.push({
							id: message.from,
							fromname: message.fromname,
							messages: messagesArr
						})
					}
					
					th.setState({
						activeChats: chats
					});
					
				});

				if(BugSmash.user.get('loggedIn')) {
					th.addUserToChat();
				}

				BugSmash.user.on('change', function () {
					th.checkUserState();
				});

				socket.emit('currentUsersOnChat');
			},

			addUser: function (addedUser) {
				var th = this,
					currentUsers = th.state.users;
				currentUsers.push(addedUser);
				//console.log(addedUser);
				th.setState({
					users: currentUsers
				});
			},

			removeUser: function (u) {
				var th = this,
				i = 0,
				currentUsers = th.state.users;

				for(i; i < currentUsers.length; i++) {
					//console.log(currentUsers[i]);
					if(currentUsers[i].id == u.id) {
						currentUsers.splice(i, 1);
					}
				}

				th.setState({
					users: currentUsers
				})

			},

			getCurrentUsers: function (currentusers) {
				var users = [], 
					i = 0, 
					th = this;
				
				for(i; i < currentusers.length; i++) {
					users.push(currentusers[i].data.user);
				}
				th.setState({
					users: users
				})
			},

			checkUserState: function () {
				var th = this;
				//socket.emit('currentUsersOnChat');
				if(BugSmash.user.get('loggedIn')) {
					th.addUserToChat();
				} else {
					th.removeUserFromChat();
				}
			},

			addUserToChat: function () {
				socket.emit('userLeaveChat', BugSmash.user);
				socket.emit('userJoinChat', { id: BugSmash.user.get('id'), username: BugSmash.user.get('username')});
			},

			removeUserFromChat: function () {
				//Disconnect user
				socket.emit('userLeaveChat', BugSmash.user);
				//Oppdater liste
				setTimeout(function () {
					socket.emit('currentUsersOnChat');
				}, 1000);	
			},

			componentWillUnmount: function () {
				socket.emit('userLeaveChat', BugSmash.user);
				BugSmash.user.off('change', this.checkUserState);

				socket.removeListener('currentUsers', this.getCurrentUsers);
				socket.removeListener('userAdded', this.addUser);
				socket.removeListener('userRemoved', this.removeUser);
				socket.removeListener('recieve', this.removeUser);

			},

			showUserList: function () {
				var knapp = document.getElementById('chat_users');

				if(knapp.style.display == "block") {
					knapp.style.display="none";
				} else {
					knapp.style.display="block";
				}
			},

			openChatBox: function (e) {
				var to = e.target.getAttribute('data-id'),
				toname = e.target.getAttribute('data-username'),
				chats = this.state.activeChats;
				
				chats.push({
					to: to,
					toname: toname,
					messages: []
				});

				this.setState({
					activeChats: chats
				})				
			},

			closeChatBox: function (index) {
				var chats = this.state.activeChats;
				chats.splice(index, 1);

				this.setState({
					activeChats: chats
				});
			},

			addMessageToActiveChat: function (chatIndex, message) {
				var chats = this.state.activeChats;
				console.log(chats);
				chats[chatIndex].messages.push(message);
				this.setState({
					activeChats: chats
				});
			},

			render: function () {
				var th = this;
				var createUserlist = function (obj, i) {
					if(BugSmash.user.get('id') == obj.id) {
						return;
					}
					return (
						<li key={obj.id} data-id={obj.id} data-username={obj.username} onClick={th.openChatBox}>{obj.username}</li>
					);
				},
				listChats = function (obj, i) {
					return (
						<BugSmash.reactComponents.ActiveChatComponent key={i} index={i} close={th.closeChatBox} addMessage={th.addMessageToActiveChat} chat={obj} />
					);
				};

				var statusbar = "";
				if(BugSmash.user.get('loggedIn')) {
					statusbar = <div className="statusbar">
							<div id="chatBox">
								<div className="icon-user loggedonusers" onClick={th.showUserList}></div>
								
								<div className="chat_messagebox">
								
								</div>
							</div>
							<div className="cboxes">
								{th.state.activeChats.map(listChats)}
							</div>
							<div className="copyright">
								Utviklet av <a href="http://www.wedinweb.no">Glenn Wedin</a>
							</div>
						</div>
				}

				return (
					<div>
						<div id="chat_users">
						<h3>Users online</h3>
						<ul>
							{this.state.users.map(createUserlist)}
						</ul>
						</div>
							
						{statusbar}
					</div>
				)
			}
		}),

		ActiveChatComponent: React.createClass({
			getInitialState: function () {
				return {
				//	messages: []
				};
			},

			componentDidMount: function () {
				var th = this,
				chatUser = th.props.chat;
				//Hent siste meldinger for denne chatten
				/*
				BugSmash.Core.ajax({
					url: '/api/chatmessages?chatuserid='+chatUser,
					type: 'GET',
					callback: function (data) {
						console.log(data);
					}
				})
				*/
			},

			/*
			shouldComponentUpdate: function () {

			},
			*/

			componentDidUpdate: function () {
				console.log(this.props.chat);
			},

			closeMe: function () {
				var index = this.getDOMNode().getAttribute('data-index');
				this.props.close(index);
			},

			minifyMe: function () {

			},

			keydown: function (e) {
				if(e.keyCode === 13) {
					e.preventDefault();
					
					var to;
					if(this.props.chat.to) {
						to = this.props.chat.to;
					} else if(this.props.chat.id) {
						to = this.props.chat.id;
					} else {
						throw "Missing message reciever - could not send message";
					}
					
					console.log(this.props);
					
					this.props.addMessage(this.props.index, {
						to: to,
						from: BugSmash.user.get('id'),
						value: e.target.value
					});
					
					socket.emit('chatmessage', {
						to: to,
						toname: this.props.chat.toname,
						fromname: BugSmash.user.get('username'),
						from: BugSmash.user.get('id'),
						value: e.target.value
					});
					e.target.value="";
				}
			},

			keyup: function (e) {
				e.preventDefault();
			},

			render: function () {

				var listMessages = function (obj, i) {
					//console.log(obj);
					var c = 'user';

					if(BugSmash.user.get('id') == obj.from) {
						c = 'me';
					}
					return (
						<div className={c} key={i}>{obj.value}</div>
					);
				};

				var toKey = this.props.chat.to,
					name = this.props.chat.toname;
				if(this.props.chat.id) {
					toKey = this.props.chat.id;
					name = this.props.chat.fromname;
				}
				
				console.log(this.props.chat);
				//<div title="Minify" onClick={this.minifyMe}>-</div>
				return (
					<div key={toKey} data-index={this.props.index} className="chatboxwrap">
						<h3>{name}</h3>
						<div className="action">
							<div title="Delete" onClick={this.closeMe}>x</div>
						</div>
						<div className="messages">
							{this.props.chat.messages.map(listMessages)}
						</div>
						<textarea onKeyDown={this.keydown} onKeyUp={this.keyup} placeholder="Write..."></textarea>
					</div>
				);
			}
		})
	}
}());



window.onload = function () {

	BugSmash.Core.start();
	Backbone.history.start({pushState: true, root: "/"});
	
	var href = document.location.href.replace('http://10.0.0.48:3001/', '');
	//var href = document.location.href.replace('http://bugsmash.wedinweb.no/', '');
	console.info('Path: '+href);

	BugSmash.router.navigate(href, {trigger: true});
};