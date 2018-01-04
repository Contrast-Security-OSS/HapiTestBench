'use strict';

const Hoek = require('hoek');
const util = require('util');

const cp = require('child_process');
const exec = util.promisify(cp.exec);
const execSync = cp.execSync;

exports.name = 'hapitestbench.cmdinjection';

exports.register = function cmdInjection(server, options) {

	/* ########################################################### */
	/* ### Base index HTML page                                ### */
	/* ########################################################### */
	server.route({
		method: 'GET',
		path: '/',
		handler: {
			view: 'cmd-injection'
		}
	});

	/* ########################################################### */
	/* ### Build API routes programmatically                  #### */
	/* ########################################################### */

	const methods = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'PUT', 'POST'];
	const inputTypes = ['query', 'params', 'headers', 'state', 'payload'];
	const inputSegmentLookup = {
		payload: '/body',
		headers: '/headers',
		params: '/url-params',
		query: '/query',
		state: '/cookies'
	};

	const makeRouteHandlers = (sinkSegment, handle) => {
		inputTypes.forEach(type => {

			const dataPath = `${type}.input`;
			const inputSegment = inputSegmentLookup[type];

			server.route([
				{
					path: `${inputSegment}/safe${sinkSegment}`,
					method: methods,
					handler: (request, h) => 'SAFE'
				}, {
					path: `${inputSegment}/unsafe${sinkSegment}`,
					method: methods,
					handler: (request, h) => {

						const value = Hoek.reach(request, dataPath);
						/* For synchronous sink methods:  */
						if (handle.length == 1) {
							return (handle(value) || '').toString();
						}

						/* For asynchronous sink methods: */
						return handle(value || '');
					}
				}
			]);
		});
	};

	const sinks = {
		cp: {
			exec: ( input, cb ) => exec(input, cb),
			execSync: input => execSync(input)
		}
	};

	[
		['/exec'     , sinks.cp.exec],
		['/exec-sync', sinks.cp.execSync]
	].forEach(
		confArgs => makeRouteHandlers.apply(null, confArgs));
};