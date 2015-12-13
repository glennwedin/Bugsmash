var express = require('express');
var router = express.Router();
var connection = require('../tools/mysql');


router.post('/login', function(req, res, next) {
	
	if (req.session.id) {
    	res.setHeader('X-Seen-You', 'true');
    	res.json(1);
	} else {
    	//Check passwordnshit
    	var username = req.body.username,
    	password = req.body.password;
    	connection.query('SELECT `id`, `admin`, `password`, `username` FROM `users` WHERE `username` = '+connection.escape(username), function(err, rows, fields) {
    		
			if (err) throw err;

			if(rows.length > 0) {
				if(rows[0].password === password) {
					req.session.id = rows[0].id;
					res.setHeader('X-Seen-You', 'false');

					res.json({
						id: rows[0].id,
						admin: rows[0].admin,
						username: rows[0].username
					});
				} else {
					res.json(0);
				}
			} else {
				res.json(0);
			}
			
		});    	
	}
});

router.get('/validate', function(req, res, next) {
	if (req.session.id) {
    	res.setHeader('X-Seen-You', 'true');
    	connection.query('SELECT `id`, `admin`, `username` FROM `users` WHERE `id` = '+connection.escape(req.session.id), function(err, rows, fields) {
    		res.json(rows[0]);
    	});
	} else {
		res.json(0);
	}
});

router.post('/signout', function(req, res, next) {
	if(req.session) {
		req.session.destroy();
	}
	res.json(1);
});

module.exports = router;