log-viewer-js
=============

A package used to read log file, e.g. with tail

## Simple Usage
```javascript
var plain = [
	"Hello, World",
	"What are you doing?"
];

var parsed = new Log.Parser (plain).parse();
```

## PHP / Apache logs
```javascript
var httpd = [
	'[Fri Mar 08 10:33:51 2013] [info] [client 127.0.0.1] Hello, World',
	'[Fri Mar 08 10:33:51 2013] [info] [client 127.0.0.1] Hello, World',
	'[Fri Mar 08 10:33:51 2013] [info] [client 127.0.0.1] Hello, World',
	'[Fri Mar 08 10:33:51 2013] [info] [client 81.166.191.110] Multiple lines',
	', or it that even possible?',
],
php = [
	'[07-Mar-2013 13:02:23 Europe/Oslo] Fatal Error: Expected ")" got ","',
	'Stack Trace:',
	'#0 main()',
	'#1 index.php',
	'#2 somefile.php',
	'[07-Mar-2013 13:02:23 Europe/Oslo] Notice: $data not defined in this scope',
];

var formatter = new Log.Formatter ({
	onLine: function (line)
	{
		// a basic HTML formatter
		return '<li>' + line + '</li>';
	}
});

formatter.ifMatch (function (line)
{
	if ( ! /Multiple/.test(line))
		return false;
	return '<em>' + line + '</em>';
});

var apache = Log.Apache(httpd, formatter),
php = Log.Php(php, new Log.Formatter({
	onLine: function (line)
	{
		return '<li>' + line.replace (/[\n]+/g, "<br />") + '</li>';
	}
}));
```

## Custom logs
```javascript
// New messages begins with: "->"
var custom = [
	"->Hello, World",
	"What are you doing? This is a multiline message!",
	"->New message here"
];

var parsed = new Log.Parser (custom, {
	newLine: function (line)
	{
		return /^->/.test(line);
	}
}).parse(new Log.Formatter ({
	onLine: function (msg)
	{
		// format each within <li>s
		return '<li>' + msg + '</li>';
	}
}));

$('ul#list').html(parsed);
```