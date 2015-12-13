"use strict";console.log=function(){},console.info=function(){};var ReactCSSTransitionGroup=React.addons.CSSTransitionGroup,BugSmash={};BugSmash.router=function(){var e=Backbone.Router.extend({routes:{"":"main","?sites=:id":"mainQuery","site/:sitename":"site","bug/:id":"bug",login:"login",signout:"signout","register-bug":"registerbug"}}),t=new e;return t.on("route:main",function(e){React.render(React.createElement(BugSmash.reactComponents.MainAppView,null),document.getElementById("main")),BugSmash.Core.pubsub.trigger("cleansearch",null)}),t.on("route:bug",function(e){React.render(React.createElement(BugSmash.reactComponents.MainAppView,{id:e}),document.getElementById("main"))}),t.on("route:registerbug",function(){React.render(React.createElement(BugSmash.reactComponents.MainAppView,{register:"true"}),document.getElementById("main"))}),t.on("route:login",function(e){React.render(React.createElement(BugSmash.reactComponents.LoginComponent,{id:e}),document.getElementById("main"))}),t.on("route:signout",function(e){BugSmash.Core.ajax({url:"/auth/signout",type:"POST",callback:function(){BugSmash.user.set("loggedIn",!1),BugSmash.router.navigate("/",{trigger:!0})}})}),$("body").on("click","a:not(.silent)",function(e){e.preventDefault(),t.navigate(e.currentTarget.getAttribute("href"),{trigger:!0})}),t}(),BugSmash.models=function(){return{UserModel:Backbone.Model.extend()}}(),BugSmash.Core=function(){var e={ajax:function(e){var t={url:"",type:"GET",callback:null,data:null,contentType:""};t=$.extend(t,e);var a=new XMLHttpRequest;a.open(t.type,t.url,!0),a.onreadystatechange=function(){if(4===a.readyState&&200===a.status){var e=a.responseText;e.length>0&&(e=JSON.parse(e)),t.callback&&t.callback(e)}},t.contentType&&a.setRequestHeader("Content-type",t.contentType),"POST"===t.type?a.send(t.data):a.send(null)},checkAuth:function(){e.ajax({url:"/auth/validate",type:"GET",callback:function(e){e.id?BugSmash.user.set({id:e.id,loggedIn:!0,isAdmin:e.admin,username:e.username}):BugSmash.user.set("loggedIn",!1)}}),setTimeout(e.checkAuth,15e3)}};return e.checkAuth(),{start:function(){var e=this;window.socket=io.connect("http://bugsmash.wedinweb.no"),e.pubsub=new PubSub,e.notify=new Notifications(socket),e.settings=function(){return{screenY:window.screenY,root:"http://bugsmash.wedinweb.no"}}(),socket.on("bug",function(t){e.pubsub.trigger("bug",t)}),socket.on("comment",function(t){e.pubsub.trigger("comment",t)})},ajax:e.ajax}}(),BugSmash.user=new BugSmash.models.UserModel({loggedIn:!1,assignedSites:[],assignedBugs:[]}),BugSmash.reactComponents=function(){return{MainAppView:React.createClass({displayName:"MainAppView",getInitialState:function(){return{querystring:Backbone.history.getFragment(),loggedIn:!1}},componentDidMount:function(){var e=this;this.setState({loggedIn:BugSmash.user.get("loggedIn")},function(){e.size()}),BugSmash.user.on("change",function(){this.setState({loggedIn:BugSmash.user.get("loggedIn")},function(){e.size()})},this),$(window).resize(function(){e.size()});var t=$(this.getDOMNode());t.find(".col").each(function(){Ps.initialize(this)})},componentDidUpdate:function(){var e=$(this.getDOMNode());e.find(".col").each(function(){Ps.update(this)})},size:function(){var e=$(document.body),t=75;this.state.loggedIn&&1==this.state.loggedIn&&(t=115),e.find("#leftbar").css("height",window.innerHeight-t),e.find(".grid").css("height",window.innerHeight-t),e.find(".col").css("height",window.innerHeight-t),e.find(".bugsubmit").css("height",window.innerHeight-t)},componentWillUnmount:function(){BugSmash.user.off("change")},render:function(){var e,t,a,n,s,i=!1;return this.state.loggedIn&&(e=React.createElement(BugSmash.reactComponents.AssignedToUserComponent,null),t=React.createElement(BugSmash.reactComponents.AssignedBugsComponent,null),a=React.createElement(BugSmash.reactComponents.NotificationsListComponent,null)),this.props.register&&"true"===this.props.register?(i=!0,n=React.createElement(BugSmash.reactComponents.RegisterComponent,null)):this.props.id?(i=!0,n=React.createElement(BugSmash.reactComponents.BugComponent,{id:this.props.id})):n=React.createElement(BugSmash.reactComponents.BugwallResult,{scope:this}),s=React.createElement("div",{id:"leftbar"},React.createElement("a",{href:"",className:"menuelement"},React.createElement("div",{className:"home"}),"Home"),React.createElement("a",{href:"/login",className:"menuelement"},React.createElement("div",{className:"icon-user menuicon"}),"Sign in")),BugSmash.user.get("loggedIn")&&(s=React.createElement("div",{id:"leftbar"},React.createElement("a",{href:"",className:"menuelement"},React.createElement("div",{className:"home"}),"Home"),React.createElement("a",{href:"/signout",className:"menuelement"},React.createElement("div",{className:"icon-user menuicon"}),"Sign out"),React.createElement("a",{href:"/register-bug",className:"menuelement"},React.createElement("div",{className:"icon-bug menuicon"}),"Register bug"),React.createElement("a",{onClick:this.openChat,href:"",className:"menuelement silent"},React.createElement("div",{className:"icon-bug menuicon"}),"Chat"))),React.createElement("div",null,React.createElement(BugSmash.reactComponents.HeaderComponent,{hasDropdown:i}),s,React.createElement("div",{className:"grid"},React.createElement("div",{className:"contentwrap"},React.createElement("div",{className:"large-6 columns col",id:"bugwall"},n),React.createElement("div",{className:"large-4 columns col"},React.createElement("div",{id:"sites",className:"block"},React.createElement(BugSmash.reactComponents.Sites,{scope:this})),React.createElement("div",{id:"assignedToUser",className:"block"},e),React.createElement("div",{id:"latestAssignedToUser",className:"block"},t)),React.createElement("div",{className:"large-2 columns col"},a))),React.createElement(BugSmash.reactComponents.ChatComponent,null))}}),HeaderComponent:React.createClass({displayName:"HeaderComponent",componentDidMount:function(){var e=this;BugSmash.Core.pubsub.off("cleansearch"),BugSmash.Core.pubsub.on("cleansearch",function(){e.search("")})},handleSearch:function(e){if(40===e.keyCode&&e.currentTarget.nextSibling.children[0].focus(),13===e.keyCode){var t=e.target.value;this.search(t)}},search:function(e){var t=window.location.search,a=BugSmash.Core.settings.root+"/api/bugs?q="+e;t&&(a=BugSmash.Core.settings.root+"/api/bugs"+t+"&q="+e);Backbone.history.getFragment();BugSmash.Core.ajax({url:a,type:"GET",callback:function(t){BugSmash.Core.pubsub.trigger("refreshwall",{query:e,data:t})}})},render:function(){var e="";return this.props.hasDropdown&&(e=React.createElement(BugSmash.reactComponents.SearchDropdown,null)),React.createElement("div",{id:"header"},React.createElement("div",{id:"bugsearchHead",className:""},React.createElement("div",{className:"searchwrap"},React.createElement("div",{className:"icon-search"}),React.createElement("input",{onKeyUp:this.handleSearch,type:"text",name:"q",placeholder:"Search bugs"}),e)),React.createElement("div",{style:{"float":"right",marginRight:"2em"}},React.createElement("h1",null,React.createElement("a",{href:""},React.createElement("span",{className:"green"},"Bug"),"smash"))))}}),SearchDropdown:React.createClass({displayName:"SearchDropdown",getInitialState:function(){return{results:[],query:""}},componentDidMount:function(){var e=this;BugSmash.Core.pubsub.on("refreshwall",e.update)},componentWillUnmount:function(){BugSmash.Core.pubsub.off("refreshwall",this.update)},update:function(e){this.setState({query:e.query,results:e.data})},click:function(e){var t=e.currentTarget.getAttribute("data-id");BugSmash.router.navigate("/bug/"+t,{trigger:!0}),this.setState({results:[]})},navigateFocus:function(e){if(e.preventDefault(),console.log(e.keyCode),40===e.keyCode)e.currentTarget.nextSibling.focus();else if(38===e.keyCode)e.currentTarget.previousSibling.focus();else if(13===e.keyCode){var t=e.currentTarget.getAttribute("data-id");BugSmash.router.navigate("/bug/"+t,{trigger:!0}),this.setState({results:[]})}},render:function(){var e=this,t=function(t,a){var n=e.state.query,s=new RegExp(n,"g");t.title.replace(s,"<b>"+n+"</b>");return React.createElement("li",{tabIndex:a,onKeyDown:e.navigateFocus,onClick:e.click,"data-id":t.id,key:t.id},t.title," ",React.createElement("div",{className:"addsubscribe"},"+"))};return React.createElement("ul",{id:"searchDropdown"},this.state.results.map(t))}}),NotificationsListComponent:React.createClass({displayName:"NotificationsListComponent",getInitialState:function(){return{notifications:[]}},componentDidMount:function(){this.get(),this.listen()},shouldComponentUpdate:function(e,t){return!0},get:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/notifications",type:"GET",callback:function(t){t.length>0&&e.setState({notifications:t})}})},set:function(){var e=this.state.notifications;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/notifications",type:"POST",data:JSON.stringify(e),contentType:"application/json;charset=UTF-8",callback:function(){}})},listen:function(){var e=this;BugSmash.Core.notify.empty(),BugSmash.Core.notify.listen(function(t){var a=e.state.notifications;a.unshift(t),e.setState({notifications:a},function(){e.forceUpdate()})})},setAsRead:function(e){var t=e.target.getAttribute("data-notificationid"),a=this.state.notifications,n=this;a.forEach(function(e,n){a[n].id==t&&(a[n].read=1)}),n.setState({notifications:a},function(){n.set(),n.forceUpdate()})},render:function(){var e=this,t=function(t,a){var n="notification";1==t.read&&(n+=" read");var s=t.url;return React.createElement("div",{key:t.id,className:n},React.createElement("div",{className:"action"},React.createElement("div",{title:"Delete",onClick:e.setAsRead,"data-notificationid":t.id},"-")),React.createElement("div",{className:"title"},React.createElement("a",{href:s},t.title)),React.createElement("div",{className:"notification_text"},t.notification))};return React.createElement("div",null,React.createElement("h3",null,"Notifications"),React.createElement("div",{id:"notificationslist"},this.state.notifications.map(t)))}}),Sites:React.createClass({displayName:"Sites",getInitialState:function(){return{sites:[]}},componentDidMount:function(){var e=this;e.update(),BugSmash.Core.pubsub.on("bug",e.update)},componentWillUnmount:function(){BugSmash.Core.pubsub.off("bug",this.update)},update:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/sites",type:"GET",callback:function(t){e.setState({sites:t})}})},click:function(e){},render:function(){var e=this,t=function(t,a){var n="?sites="+t.id,s={backgroundColor:t.color};return React.createElement("li",{key:t.id,className:"site",onClick:e.click},React.createElement("div",{className:"marker",style:s}),React.createElement("a",{href:n},t.sitename," ",React.createElement("div",{className:"unresolved_count"},t.count)))};return React.createElement("div",null,React.createElement("h3",null,"All bugs",React.createElement("span",{className:"headicon"},React.createElement("img",{src:"img/icons/folder.png",alt:""}))),React.createElement("ul",{id:"siteslist",className:"blist"},this.state.sites.map(t)))}}),BugwallResult:React.createClass({displayName:"BugwallResult",getInitialState:function(){return{bugItems:[]}},componentDidMount:function(){var e=this;BugSmash.Core.pubsub.on("bug",function(t){var a=e.state.bugItems;a.unshift(t),e.setState({bugItems:a})}),BugSmash.Core.pubsub.on("refreshwall",function(t){e.setState({bugItems:t.data})})},componentDidUpdate:function(){var e=this.getDOMNode().querySelector("h3");e.classList.add("blink"),setTimeout(function(){e.classList.remove("blink")},300)},componentWillUnmount:function(){BugSmash.Core.pubsub.off("refreshwall")},render:function(){return React.createElement("div",null,React.createElement("h3",null,"Latest bugs"),React.createElement(BugSmash.reactComponents.BugItem,{bugItems:this.state.bugItems}))}}),BugItem:React.createClass({displayName:"BugItem",clickHandler:function(e){var t=e.currentTarget.getAttribute("data-id");BugSmash.router.navigate("/bug/"+t,{trigger:!0})},componentDidUpdate:function(){},render:function(){var e=this,t=function(t,a){var n=moment(t.date).format("DD.MM.YYYY HH:mm"),s="priLabel "+(t.statustext||"").replace(" ",""),i="priLabel "+(t.prioritytext||"").replace(" ","");return React.createElement("li",{onClick:e.clickHandler,"data-id":t.id,key:t.id,className:"bug"},React.createElement("div",{className:"buginfo"},React.createElement("div",{className:""},n),React.createElement("div",{className:s},t.statustext),React.createElement("div",{className:i},t.prioritytext),React.createElement("div",{className:"bug_sitename"},t.sitename)),React.createElement("div",{className:"bugwrap"},React.createElement("div",{className:"bug_title"},t.title),React.createElement("div",{className:"bug_description"},React.createElement("p",null,t.description))))};return React.createElement(ReactCSSTransitionGroup,{component:"ul",id:"bugslist",transitionName:"example"},this.props.bugItems.map(t))}}),AssignedToUserComponent:React.createClass({displayName:"AssignedToUserComponent",getInitialState:function(){return{sites:[]}},componentDidMount:function(){var e=this;e.update(),BugSmash.Core.pubsub.on("bug",e.update)},componentWillUnmount:function(){BugSmash.Core.pubsub.off("bug",this.update)},update:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/users/bugsnum",type:"GET",callback:function(t){e.setState({sites:t})}})},click:function(){},render:function(){var e=this,t=function(t,a){var n="?sites="+t.id+"&user=active",s={backgroundColor:t.color};return React.createElement("li",{key:t.id,onClick:e.click,className:"site"},React.createElement("div",{className:"marker",style:s}),React.createElement("a",{href:n},t.sitename," ",React.createElement("div",{className:"unresolved_count"},t.count)))};return React.createElement("div",null,React.createElement("h3",null,"Your bugs",React.createElement("span",{className:"headicon"},React.createElement("img",{src:"img/icons/person.png",alt:""}))),React.createElement("ul",{id:"assignedsites",className:"blist"},this.state.sites.map(t)))}}),AssignedBugsComponent:React.createClass({displayName:"AssignedBugsComponent",getInitialState:function(){return{bugs:[]}},componentDidMount:function(){var e=this;e.update(),BugSmash.Core.pubsub.on("bug",e.update)},componentWillUnmount:function(){BugSmash.Core.pubsub.off("bug",this.update)},update:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/users/bugs",type:"GET",callback:function(t){e.setState({bugs:t})}})},render:function(){var e=function(e,t){var a="/bug/"+e.id,n={backgroundColor:e.color};return React.createElement("li",{className:"site",key:e.id},React.createElement("div",{className:"marker",style:n}),React.createElement("a",{href:a},e.title))};return React.createElement("div",null,React.createElement("h3",null,"Your latest bugs",React.createElement("span",{className:"headicon"},React.createElement("img",{src:"img/icons/pin.png",alt:"",className:"pin"}))),React.createElement("ul",{className:"blist"},this.state.bugs.map(e)))}}),BugComponent:React.createClass({displayName:"BugComponent",getInitialState:function(){return{bug:{}}},componentDidMount:function(){this.get()},componentDidUpdate:function(){this.props.id!=this.state.bug.id&&this.get()},get:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id,type:"GET",callback:function(t){e.isMounted()&&e.setState({bug:t[0]})}})},subscribe:function(e){var t=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id+"/subscribers",type:"POST",callback:function(e){t.get()}})},unsubscribe:function(e){var t=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id+"/subscribers",type:"DELETE",callback:function(e){t.get()}})},render:function(){var e="priLabel "+(this.state.bug.statustext||"").replace(" ",""),t="priLabel "+(this.state.bug.prioritytext||"").replace(" ",""),a=moment(this.state.bug.date).format("DD.MM.YYYY HH:mm"),n="",s="",i="",c="";return BugSmash.user.get("loggedIn")&&(i=this.state.bug.subscribed>0?React.createElement("div",{className:"sub",onClick:this.unsubscribe},"Unsubscribe"):React.createElement("div",{className:"sub",onClick:this.subscribe},"Subscribe"),c=React.createElement(BugSmash.reactComponents.CommentComponent,{id:this.props.id}),(BugSmash.user.id==this.state.bug.userid||BugSmash.user.id==this.state.bug.assignedFrom)&&(n=React.createElement(BugSmash.reactComponents.StatusChangerComponent,{key:"1",callback:this.get,type:"status",id:this.state.bug.id,text:this.state.bug.statustext}),s=React.createElement(BugSmash.reactComponents.StatusChangerComponent,{key:"2",callback:this.get,type:"priority",id:this.state.bug.id,text:this.state.bug.prioritytext}))),React.createElement("div",{className:"thebug"},React.createElement("h1",null,this.state.bug.title),React.createElement("div",{className:"buginfo large-3 columns"},React.createElement("div",{className:""},a),React.createElement("div",{className:e},this.state.bug.statustext),React.createElement("div",{className:t},this.state.bug.prioritytext),React.createElement("div",{className:"bug_sitename"},this.state.bug.sitename)),React.createElement("div",{className:"large-9 columns bugcontent"},React.createElement("div",{className:"description"},React.createElement("p",null,this.state.bug.description)),React.createElement("div",{className:"description"},React.createElement("h2",null,"Steps to reproduce"),React.createElement("pre",null,this.state.bug.reproduce)),React.createElement("div",{className:"description"},React.createElement("h2",null,"Screenshots"),React.createElement("pre",null,this.state.bug.screenshots))),React.createElement("div",{className:"bottomoptions"},i,n,s),c)}}),StatusChangerComponent:React.createClass({displayName:"StatusChangerComponent",getInitialState:function(){return{values:[]}},change:function(e){var t=document.querySelectorAll(".sellist"),a=e.currentTarget,n=this;t=Array.prototype.slice.call(t),t.forEach(function(e,t){e.style.display="none"}),BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/"+this.props.type,callback:function(e){var t=a.querySelector(".sellist");t.style.display="block",n.setState({values:e})}})},setStatus:function(e){e.stopPropagation(),e.target.parentNode.style.display="none";var t=e.target.getAttribute("data-id"),a=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id,type:"POST",callback:function(e){a.props.callback()},data:this.props.type+"id="+t,contentType:"application/x-www-form-urlencoded"})},render:function(){var e=this,t=function(t,a){return React.createElement("li",{onClick:e.setStatus,"data-id":t.id},t.text)};return React.createElement("div",{className:"sub",onClick:this.change},React.createElement("ul",{className:"sellist"},this.state.values.map(t)),React.createElement("div",{className:"icon-pencil icon"}),this.props.text)}}),LoginComponent:React.createClass({displayName:"LoginComponent",submit:function(e){e.preventDefault();var t=$(e.target).serialize();BugSmash.Core.ajax({url:"../auth/login",type:"POST",callback:function(e){e.id&&(BugSmash.user.set({id:e.id,loggedIn:!0,isAdmin:e.admin,username:e.username}),BugSmash.router.navigate("/",{trigger:!0}))},contentType:"application/x-www-form-urlencoded",data:t})},render:function(){return React.createElement("div",{className:"row"},React.createElement("div",{className:"large-4 columns"}," "),React.createElement("div",{className:"loginform large-4 columns"},React.createElement("div",{className:"large-12 columns"},React.createElement("h1",null,"Log in"),React.createElement("form",{onSubmit:this.submit,method:"post",action:""},React.createElement("label",null,"Username or email"),React.createElement("div",{className:"inputwrap"},React.createElement("div",{className:"icon-user icon"}),React.createElement("input",{type:"text",name:"username",placeholder:"user@example.com",defaultValue:"gjest"})),React.createElement("label",null,"Password"),React.createElement("div",{className:"inputwrap"},React.createElement("div",{className:"icon-key icon"}),React.createElement("input",{type:"password",name:"password",placeholder:"password",defaultValue:"gjest"})),React.createElement("input",{type:"submit",value:"Log in"})))),React.createElement("div",{className:"large-4 columns"}," "))}}),RegisterComponent:React.createClass({displayName:"RegisterComponent",filesList:[],screenshots:function(e){e.preventDefault(),e.target.parentNode.getElementsByClassName("files")[0].click()},showFiles:function(e){var t,a=e.target.files,n=0,s=document.getElementById("filelist"),i=this;for(n;n<a.length;n++)s.innerHTML+="<div>"+a[n].name+"</div>",t=new FormData,t.append("screenshot",a[n]),BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/fileupload",type:"POST",callback:function(e){i.filesList.push(e.filename)},data:t})},submit:function(e){e.preventDefault();var t=$(e.target).serializeArray(),a=this;t.push({name:"filenames",value:a.filesList}),BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/submitbug",type:"POST",callback:function(e){console.log(e),socket.emit("bugcreated",e.id),BugSmash.Core.notify.create({users_id:e.assignto,title:"New bug report",notification:e.title,read:0,url:"/bug/"+e.id}),BugSmash.router.navigate("/",{trigger:!0})},data:$.param(t),contentType:"application/x-www-form-urlencoded"})},render:function(){return React.createElement("div",{className:"bugsubmit submitterHidden"},React.createElement("h1",null,"Submit a bug report"),React.createElement("form",{action:"",method:"post",onSubmit:this.submit},React.createElement("label",null,"Title"),React.createElement("input",{type:"text",name:"title",placeholder:"E.g Can't log in"}),React.createElement("label",null,"Select that the bug applies to"),React.createElement(BugSmash.reactComponents.ProjectsListComponent,null),React.createElement("label",null,"Priority"),React.createElement("select",{name:"priority"},React.createElement("option",{value:"1"},"Low priority"),React.createElement("option",{value:"2"},"Important"),React.createElement("option",{value:"3"},"Critical")),React.createElement("label",null,"Assign to"),React.createElement(BugSmash.reactComponents.UsersListComponent,null),React.createElement("label",null,"Describe the bug"),React.createElement("textarea",{name:"description"}),React.createElement("label",null,"Steps to reproduce"),React.createElement("textarea",{name:"repro"}),React.createElement("button",{onClick:this.screenshots},"Select screenshots"),React.createElement("div",{id:"filelist"}),React.createElement("input",{onChange:this.showFiles,type:"file",name:"files",multiple:!0,className:"files"}),React.createElement("input",{type:"submit",value:"Submit bug"})))}}),ProjectsListComponent:React.createClass({displayName:"ProjectsListComponent",getInitialState:function(){return{projects:[]}},componentDidMount:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/projects",type:"GET",callback:function(t){e.setState({projects:t})}})},render:function(){var e=function(e,t){return React.createElement("option",{key:e.id,value:e.id},e.sitename)};return React.createElement("select",{name:"projects"},this.state.projects.map(e))}}),UsersListComponent:React.createClass({displayName:"UsersListComponent",getInitialState:function(){return{users:[]}},componentDidMount:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/users",type:"GET",callback:function(t){console.log(t),e.setState({users:t})}})},render:function(){var e=function(e,t){return React.createElement("option",{key:e.id,value:e.id},e.name)};return React.createElement("select",{name:"assignto"},React.createElement("option",{value:"0"},"Unassigned"),this.state.users.map(e))}}),ScreenshotsComponent:React.createClass({displayName:"ScreenshotsComponent",getInitialState:function(){return{screenshots:[]}},componentDidMount:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id+"/screenshots",type:"GET",callback:function(t){e.setState({screenshots:t})}})},openImage:function(e){e.preventDefault(),e.stopPropagation();var t=e.currentTarget.getAttribute("href"),a='<div class="screenshotwrap">						<div style="background-image:url('+t+');" class="screenshot"></div>						</div>';document.body.innerHTML+=a,document.getElementsByClassName("screenshotwrap")[0].addEventListener("click",function(e){document.body.removeChild(this)})},render:function(){var e=this,t=function(t,a){var n="../uploads/"+t.pathname,s="Screenshot "+(a+1);return React.createElement("li",{key:t.id,className:"site"},React.createElement("a",{target:"_blank",className:"silent",onClick:e.openImage,href:n},s))};return React.createElement("div",null,React.createElement("h3",null,"Screenshots"),React.createElement("ul",{className:"blist"},this.state.screenshots.map(t)))}}),CommentComponent:React.createClass({displayName:"CommentComponent",getInitialState:function(){return{id:null,comments:[]}},componentDidMount:function(){var e=this,t=[];e.setState({id:this.props.id}),BugSmash.Core.pubsub.on("comment",function(a){t=e.state.comments,t.unshift(a),e.setState({comments:t})}),e.update()},componentDidUpdate:function(e,t){e.id!==this.props.id&&this.update()},componentWillUnmount:function(){BugSmash.Core.pubsub.off("comment")},update:function(){var e=this;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id+"/comments",type:"GET",callback:function(t){e.setState({comments:t})}})},submitComment:function(e){e.preventDefault();var t=e.target.getElementsByTagName("textarea")[0].value;BugSmash.Core.ajax({url:BugSmash.Core.settings.root+"/api/bugs/"+this.props.id+"/comments",type:"POST",callback:function(e){socket.emit("commentcreated",e)},contentType:"application/x-www-form-urlencoded",data:"comment="+t}),e.target.getElementsByTagName("textarea")[0].value=""},render:function(){var e=function(e,t){var a=moment(e.created).format("DD.MM.YYYY HH:mm");return React.createElement("div",{key:e.id,className:"comment"},React.createElement("div",{className:"commenttop"},React.createElement("div",{className:"username"},e.user),React.createElement("div",{className:"date"},a)),React.createElement("div",{className:"thecomment"},e.comment))};return React.createElement("div",null,React.createElement("h3",null,"Comments"),this.state.comments.map(e),React.createElement("div",null,React.createElement("form",{onSubmit:this.submitComment},React.createElement("textarea",{placeholder:"Legg til kommentar"}),React.createElement("input",{type:"submit",value:"Submit comment"}))))}}),ChatComponent:React.createClass({displayName:"ChatComponent",getInitialState:function(){return{users:[],activeChats:[]}},componentDidMount:function(){var e=this;socket.on("currentUsers",e.getCurrentUsers),socket.on("userAdded",e.addUser),socket.on("userRemoved",e.removeUser);var t=function(e,t){for(var a in e){if(e[a].to==t)return a;if(e[a].id==t)return a}return!1};socket.on("recieve",function(a){console.log(a);var n=e.state.activeChats,s=t(n,a.from);if(s)n[s].messages.push(a);else{var i=[];i.push(a),n.push({id:a.from,fromname:a.fromname,messages:i})}e.setState({activeChats:n})}),BugSmash.user.get("loggedIn")&&e.addUserToChat(),BugSmash.user.on("change",function(){e.checkUserState()}),socket.emit("currentUsersOnChat")},addUser:function(e){var t=this,a=t.state.users;a.push(e),t.setState({users:a})},removeUser:function(e){var t=this,a=0,n=t.state.users;for(a;a<n.length;a++)n[a].id==e.id&&n.splice(a,1);t.setState({users:n})},getCurrentUsers:function(e){var t=[],a=0,n=this;for(a;a<e.length;a++)t.push(e[a].data.user);n.setState({users:t})},checkUserState:function(){var e=this;BugSmash.user.get("loggedIn")?e.addUserToChat():e.removeUserFromChat()},addUserToChat:function(){socket.emit("userLeaveChat",BugSmash.user),socket.emit("userJoinChat",{id:BugSmash.user.get("id"),username:BugSmash.user.get("username")})},removeUserFromChat:function(){socket.emit("userLeaveChat",BugSmash.user),setTimeout(function(){socket.emit("currentUsersOnChat")},1e3)},componentWillUnmount:function(){socket.emit("userLeaveChat",BugSmash.user),BugSmash.user.off("change",this.checkUserState),socket.removeListener("currentUsers",this.getCurrentUsers),socket.removeListener("userAdded",this.addUser),socket.removeListener("userRemoved",this.removeUser),socket.removeListener("recieve",this.removeUser)},showUserList:function(){var e=document.getElementById("chat_users");"block"==e.style.display?e.style.display="none":e.style.display="block"},openChatBox:function(e){var t=e.target.getAttribute("data-id"),a=e.target.getAttribute("data-username"),n=this.state.activeChats;n.push({to:t,toname:a,messages:[]}),this.setState({activeChats:n})},closeChatBox:function(e){var t=this.state.activeChats;t.splice(e,1),this.setState({activeChats:t})},addMessageToActiveChat:function(e,t){var a=this.state.activeChats;console.log(a),a[e].messages.push(t),this.setState({activeChats:a})},render:function(){var e=this,t=function(t,a){return BugSmash.user.get("id")!=t.id?React.createElement("li",{key:t.id,"data-id":t.id,"data-username":t.username,onClick:e.openChatBox},t.username):void 0},a=function(t,a){return React.createElement(BugSmash.reactComponents.ActiveChatComponent,{key:a,index:a,close:e.closeChatBox,addMessage:e.addMessageToActiveChat,chat:t})},n="";return BugSmash.user.get("loggedIn")&&(n=React.createElement("div",{className:"statusbar"},React.createElement("div",{id:"chatBox"},React.createElement("div",{className:"icon-user loggedonusers",onClick:e.showUserList}),React.createElement("div",{className:"chat_messagebox"})),React.createElement("div",{className:"cboxes"},e.state.activeChats.map(a)),React.createElement("div",{className:"copyright"},"Utviklet av ",React.createElement("a",{href:"http://www.wedinweb.no"},"Glenn Wedin")))),React.createElement("div",null,React.createElement("div",{id:"chat_users"},React.createElement("h3",null,"Users online"),React.createElement("ul",null,this.state.users.map(t))),n)}}),ActiveChatComponent:React.createClass({displayName:"ActiveChatComponent",getInitialState:function(){return{}},componentDidMount:function(){var e=this;e.props.chat},componentDidUpdate:function(){console.log(this.props.chat)},closeMe:function(){var e=this.getDOMNode().getAttribute("data-index");this.props.close(e)},minifyMe:function(){},keydown:function(e){if(13===e.keyCode){e.preventDefault();var t;if(this.props.chat.to)t=this.props.chat.to;else{if(!this.props.chat.id)throw"Missing message reciever - could not send message";t=this.props.chat.id}console.log(this.props),this.props.addMessage(this.props.index,{to:t,from:BugSmash.user.get("id"),value:e.target.value}),socket.emit("chatmessage",{to:t,toname:this.props.chat.toname,fromname:BugSmash.user.get("username"),from:BugSmash.user.get("id"),value:e.target.value}),e.target.value=""}},keyup:function(e){e.preventDefault()},render:function(){var e=function(e,t){var a="user";return BugSmash.user.get("id")==e.from&&(a="me"),React.createElement("div",{className:a,key:t},e.value)},t=this.props.chat.to,a=this.props.chat.toname;return this.props.chat.id&&(t=this.props.chat.id,a=this.props.chat.fromname),console.log(this.props.chat),React.createElement("div",{key:t,"data-index":this.props.index,className:"chatboxwrap"},React.createElement("h3",null,a),React.createElement("div",{className:"action"},React.createElement("div",{title:"Delete",onClick:this.closeMe},"x")),React.createElement("div",{className:"messages"},this.props.chat.messages.map(e)),React.createElement("textarea",{onKeyDown:this.keydown,onKeyUp:this.keyup,placeholder:"Write..."}))}})}}(),window.onload=function(){BugSmash.Core.start(),Backbone.history.start({pushState:!0,root:"/"});var e=document.location.href.replace("http://bugsmash.wedinweb.no/","");console.info("Path: "+e),BugSmash.router.navigate(e,{trigger:!0})};