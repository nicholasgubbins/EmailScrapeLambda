var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var url = require('url');
var cheerio = require('cheerio');

function getLinksOnPage(url){
	return request(url, {headers:{'User-Agent':'curl/7.51.0'}})
	.then(function(response){
		$ = cheerio.load(response.body);
	  	links = $('a'); // jquery get all hyperlinks
	  	var to_return = [];
	  	$(links).each(function(i, link){
			var href = $(link).attr('href');
	    	var base = (url[url.length - 1] == '/') ? url.substring(0, url.length-1) : url;
	    	if (!href) return
	    	if (href && href[0] == '/') to_return.push(base + href);
	    	else if (href.indexOf(base) > -1 && (href !== base && href !== url)) to_return.push(href);
		});
		return to_return;
	})
	.catch(function(e){
		console.log(e);
		return [];
	})
}

function extractEmail(body){
	return body.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

function getEmailsFromPage(link){
	return request(link, {headers:{'User-Agent':'curl/7.51.0'}})
	.then(function(response){
		if (response.statusCode == 200 && response.headers['content-type'].indexOf('text/html') > -1){
			var emails = extractEmail(response.body);
			return (!emails || emails.length == 0) ? [] : emails;
		}
		return [];
	})
	.catch( function(e){
		return [];
	})
}

var handler = exports.handler = function(event, context){
	var emails = [];
	getLinksOnPage(event.link)
	.then(function(links){
		console.log(links.length, 'links');
		return links;
	})
	.map(function(link){
		return getEmailsFromPage(link)
		.then(function(es){
			if (es) es.forEach(function(email){if (emails.indexOf(email) == -1) emails.push(email);});
		})
		.catch(function(e){
			console.log(e);
			return true;	
		})
	})
	.then(function(){
		console.log(emails);
		context.succeed(emails);
	})
	.catch(function(e){
		console.log(e);
		context.fail(e);
	})
}


