var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var url = require('url');
var cheerio = require('cheerio');

function getLinksOnPage(address){
	var parsed_url = url.parse(address);
	var base = parsed_url.protocol + '//' + parsed_url.hostname;
	return request(base, {headers:{'User-Agent':'curl/7.51.0'}})
	.then(function(response){
		$ = cheerio.load(response.body);
	  	links = $('a'); // jquery get all hyperlinks
	  	var to_return = [address, base];
	  	$(links).each(function(i, link){
			var href = $(link).attr('href');
	    	if (!href) return
	    	if (href && href[0] == '/' && to_return.indexOf(url.resolve(base, href)) == -1) to_return.push(url.resolve(base, href));
	    	else if (href.indexOf(base) > -1 && (href !== base && href !== address) && to_return.indexOf(href) == -1 ) to_return.push(href);
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
	var links_searched = 0;
	getLinksOnPage(event.link)
	.then(function(links){
		links_searched = links.length;
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
		context.succeed({emails:emails, links_searched:links_searched});
	})
	.catch(function(e){
		console.log(e);
		context.fail(e);
	})
}
