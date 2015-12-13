var express = require('express');
var router = express.Router();
var connection = require('../tools/mysql');


router.get('/bugs', function(req, res, next) {
	//console.log(req)
	var q = req.query.q,
	sites = req.query.sites,
	byUser = req.query.user,
	sql = "";

	if(sites) {
		sql += "`site_id` = "+connection.escape(sites)+" AND ";
	}
	if(q) {
		q = '%'+q+'%';
		sql += "(`title` LIKE "+connection.escape(q)+" OR `description` LIKE "+connection.escape(q)+") AND ";
	}
	if(byUser) {
		sql += "`users_bugs`.`users_id` = "+connection.escape(req.session.id)+" AND `status` NOT IN(4) AND ";
	}

	if(sql.length > 0) {
		sql = "WHERE "+sql;
		sql = sql.substring(0, sql.length-4);
	}
	console.log(sql);
	connection.query("SELECT \
		`bugs`.*, \
		(SELECT `sitename` FROM `sites` WHERE `id` = `bugs`.`site_id`) AS `sitename`, \
		(SELECT `status` FROM `status` WHERE `id` = `bugs`.`status`) AS `statustext`,\
		(SELECT `priority` FROM `priority` WHERE `id` = `bugs`.`priority`) AS `prioritytext`,\
		(SELECT `users_id` FROM `users_bugs` WHERE `bugs_id` = `id`) AS `userid` \
		 FROM `bugs` \
		 INNER JOIN `users_bugs` ON `bugs`.`id` = `users_bugs`.`bugs_id` "+sql+" \
		 ORDER BY `date` DESC LIMIT 20", function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});

router.get('/bugs/:id', function(req, res, next) {
	
	var id = req.params.id;

	connection.query('SELECT \
		`bugs`.*, \
		(SELECT `sitename` FROM `sites` WHERE `id` = `bugs`.`site_id`) AS `sitename`, \
		(SELECT `status` FROM `status` WHERE `id` = `bugs`.`status`) AS `statustext`,\
		(SELECT `priority` FROM `priority` WHERE `id` = `bugs`.`priority`) AS `prioritytext`,\
		(SELECT `users_id` FROM `users_bugs` WHERE `bugs_id` = `bugs`.`id`) AS `userid`, \
		(SELECT COUNT(*) FROM `subscribers` WHERE `userid`) AS `subscribed` \
		FROM `bugs` WHERE `id` = '+connection.escape(id), function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});

router.post('/bugs/:id', function(req, res, next) {
	
	var id = req.params.id,
		sql = "",
		status = (req.body.statusid ? req.body.statusid : null),
		priority = (req.body.priorityid ? req.body.priorityid : null);

	if(status) {
		sql += '`status` = '+connection.escape(status);
	}
	if(priority) {
		sql += '`priority` = '+connection.escape(priority);
	}

	connection.query('UPDATE `bugs` SET '+sql+' WHERE `id` = '+connection.escape(id), function(err, info) {
		if (err) throw err;
		res.json(1);
	});
});

router.get('/bugs/:id/screenshots', function(req, res, next) {
	var id = req.params.id;
	connection.query('SELECT * FROM `screenshots` WHERE `bugs_id` = '+connection.escape(id), function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});

router.post('/bugs/:id/subscribers', function(req, res, next) {
	var id = req.params.id,
	userid = req.session.id;

	connection.query('INSERT INTO `subscribers` (`bugs_id`, `users_id`) VALUE ('+connection.escape(id)+','+connection.escape(userid)+')', function(err, info) {
		if (err) throw err;
		res.json(1);
	});
});

router.delete('/bugs/:id/subscribers', function(req, res, next) {
	var id = req.params.id,
	userid = req.session.id;

	connection.query('DELETE FROM `subscribers` WHERE `bugs_id`= '+connection.escape(id)+' AND `users_id` = '+connection.escape(userid), function(err, info) {
		if (err) throw err;
		res.json(1);
	});
});


router.post('/bugs/:id/comments', function(req, res, next) {
	var id = connection.escape(req.params.id),
		users_id = connection.escape(req.session.id),
		comment = connection.escape(req.body.comment);
		
	connection.query('INSERT INTO `comments` (`bugs_id`, `users_id`, `comment`) VALUES ('+id+', '+users_id+', '+comment+')', function(err, info) {
		if (err) throw err;
		
		res.json(info.insertId);
	});
});

router.get('/bugs/:id/comments', function(req, res, next) {
	var id = connection.escape(req.params.id);
		
	connection.query('SELECT `comments`.*, (SELECT `name` FROM `users` WHERE `id` = `users_id`) AS `user` FROM `comments` WHERE `bugs_id` = '+id, function(err, rows, fields) {
		if (err) throw err;
		if(rows.length > 0) {
			res.json(rows);
		} else {
			res.json([]);
		}
	});
});


router.get('/sites', function (req, res, next) {
	connection.query('SELECT `sites`.`id`, COUNT(`bugs`.`id`) AS `count`, `sites`.`sitename`, `sites`.`color` FROM `bugs`\
		INNER JOIN `sites` ON `bugs`.`site_id` = `sites`.`id`\
		WHERE `status` NOT IN (4)\
		GROUP BY `sites`.`sitename`', function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});

router.get('/status', function (req, res, next) {
	connection.query('SELECT `id`, `status` AS `text` FROM `status`', function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});
router.get('/priority', function (req, res, next) {
	connection.query('SELECT `id`, `priority` AS `text` FROM `priority`', function(err, rows, fields) {
		if (err) throw err;
		var json = [];
		if(rows.length > 0) {
			json = rows;
		}
		res.json(json);
	});
});

router.get('/users/bugsnum', function(req, res, next) {
	if(req.session.id) {
		var id = req.session.id;
		connection.query('SELECT COUNT(`bugs`.`id`) AS `count`, `bugs`.`site_id` AS `id`,\
			(SELECT `sitename` FROM `sites` WHERE `id` = `bugs`.`site_id`) AS `sitename`, \
			(SELECT `color` FROM `sites` WHERE `id` = `bugs`.`site_id`) AS `color` \
		FROM `users_bugs` \
INNER JOIN `bugs` ON `users_bugs`.`bugs_id` = `bugs`.`id` \
WHERE `users_bugs`.`users_id` = '+connection.escape(id)+' AND `status` NOT IN (4) \
GROUP BY `sitename`', function(err, rows, fields) {
			if (err) throw err;
			var json = [];
			if(rows.length > 0) {
				json = rows;
			}
			res.json(json);
		});
	}
});

router.get('/users/bugs', function(req, res, next) {
	if(req.session.id) {
		var id = req.session.id;
		connection.query('SELECT `bugs`.`id`, `bugs`.`title`, \
			(SELECT `color` FROM `sites` WHERE `id` = `bugs`.`site_id`) AS `color`\
		FROM `users_bugs` \
INNER JOIN `bugs` ON `users_bugs`.`bugs_id` = `bugs`.`id` \
WHERE `users_bugs`.`users_id` = '+connection.escape(id)+' AND `status` NOT IN (4) ORDER BY `date` DESC LIMIT 10', function(err, rows, fields) {
			if (err) throw err;
			var json = [];
			if(rows.length > 0) {
				json = rows;
			}
			res.json(json);
		});
	}
});

router.get('/users', function(req, res, next) {
	connection.query('SELECT `id`, `name` FROM `users`', function (err, rows, fields) {
		if(err) throw err;
		
		if(rows.length > 0) {
			res.json(rows);
		} else {
			res.json(0);
		}
	});
});

router.get('/projects', function(req, res, next) {
	connection.query('SELECT * FROM `sites`', function (err, rows, fields) {
		if(err) throw err;
		
		if(rows.length > 0) {
			res.json(rows);
		} else {
			res.json(0);
		}
	});
});

router.post('/fileupload', function(req, res, next) {
	//console.log(req.files.screenshot.name)
	res.json({filename: req.files.screenshot.name});
});
router.post('/submitbug', function(req, res, next) {
	//console.log(req.body)
	var userid = req.session.id,
		siteid = connection.escape(req.body.projects),
		title = connection.escape(req.body.title),
		description = connection.escape(req.body.description),
		repro = connection.escape(req.body.repro),
		priority = connection.escape(req.body.priority),
		assignto = connection.escape(req.body.assignto),
		files = req.body.filenames;
		
		
	connection.query('INSERT INTO `bugs` (`site_id`, `assignedFrom`, `status`, `priority`, `title`, `description`, `reproduce`) VALUES ('+siteid+', '+userid+', 2, '+priority+', '+title+', '+description+', '+repro+')', 
		function (err, info) {
		if(err) throw err;
		
		var i = 0,
		insertId = info.insertId,
		f = [];

		console.log
		if(files) {
			f = files.split(',');
		}

		for(i; i < f.length; i++){
			connection.query('INSERT INTO `screenshots` (`bugs_id`, `pathname`) VALUES ('+insertId+', '+connection.escape(f[i])+')', function (err, info) {
				if(err) throw err;
			});
			
		}
		
		if(err) throw err;
		//console.log(info);
		connection.query('INSERT INTO `users_bugs` (`users_id`, `bugs_id`) VALUES ('+assignto+', '+insertId+')', function (err, info) {
			if(err) throw err;
			
			res.json({
				'id': insertId,
				'assignto': req.body.assignto,
				'title': req.body.title,
				'description': req.body.description
			});
		});
	});	
});

router.get('/notifications', function(req, res, next) {
	var id = connection.escape(req.session.id);
	connection.query('SELECT * FROM `notifications` WHERE `users_id` = '+id+' ORDER BY `read`, `created` DESC', function (err, rows, fields) {
		if(err) throw err;
		
		if(rows.length > 0) {
			res.json(rows);
		} else {
			res.json(0);
		}
	});
});

router.post('/notifications', function(req, res, next) {
	var notifications = req.body;
	notifications.forEach(function (obj, i) {
		connection.query('UPDATE `notifications` SET `read` = '+obj.read+' WHERE `id` = '+obj.id, function (err, rows, fields) {
			if(err) throw err;
		});
	});
	res.json(1);
	
});

router.get('/chatmessages', function(req, res, next) {
	var chatuserid = req.params.chatuserid;
	
	
});

module.exports = router;
