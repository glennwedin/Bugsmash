var express = require('express');
var router = express.Router();

var root = 'http://192.168.1.233:3001';

/* GET home page. */
router.get('/', function(req, res, next) {
  	res.render('index', { title: 'Bugsmash', root: root});
});
/*
router.get('/site/:id', function(req, res, next) {
  res.render('index', { title: 'Site', root: root});
});
*/
router.get('/bug/:id', function(req, res, next) {

 	res.render('index', { title: 'Bug', root: root });
});

router.get('/login', function(req, res, next) {
 	res.render('index', { title: 'Log in', root: root});
});

router.get('/signout', function(req, res, next) {
 	res.render('index', { title: 'Sign out', root: root});
});

router.get('/register-bug', function(req, res, next) {
  	res.render('index', { title: 'Register bug', root: root});
});

module.exports = router;
