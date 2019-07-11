'use strict';
const util = require('util');
const mysql = require('mysql');
const hooker = require('hooker');

// mock the sql query so the app does not require a database connection
hooker.hook(require('mysql/lib/Connection').prototype, 'query', {
	pre: function() {},
	post: function(result, sql, cb) {
		cb(null, [{
			query: sql
		}]);
	}
});

let connection;
if (process.env.MYSQL_URI) {
	connection = mysql.createConnection(process.env.MYSQL_URI);
} else {
	connection = mysql.createConnection({
		host: process.env.MYSQL_HOST || 'localhost',
		user: process.env.MYSQL_USER || 'root'
	});
}

// pretend we already connected
connection._connectCalled = true;

// TODO: rename this function?
exports.register = function mongo(server, options) {
	connection.connect();
	connection.query = util.promisify(connection.query);
	console.log('connected to mysql server'); // eslint-disable-line
	return server.expose('db', connection);
};

exports.name = 'hapitestbench.mysql';
