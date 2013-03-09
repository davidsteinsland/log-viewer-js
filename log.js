/**
 * @package Log
 * @contains Log.Parser, Log.Formatter
 * @author David Steinsland
 * 
 * Parses a log file and generates a HTML list for display
 * The lines are parsed by every date, so that it will capture most formats such as:
 * Apache error/access log, php log, mysql, etc.
 * A custom format may also be applied.
 * 
 * Apache: [Fri Mar 08 10:33:51 2013]
 * Php: [07-Mar-2013 13:02:23 Europe/Oslo]
 * 
 * A LogFormatter object can also be attached to every line, making special messages "pop" out, for instance
 * lines containing the word "error", etc.
 */

function extend(a, b)
{
	for(var key in b)
		if (b.hasOwnProperty (key))
			a[key] = b[key];
	return a;
}

var Log = {};

/**
 * Helper classes
 */
Log.Apache = function (data, formatter)
{
	var log = new Log.Parser (data, {
		newMessage: function (line)
		{
			return /^\[(?:\w{3} ){2}\d{2} (?:\d{2}:){2}\d{2} \d{4}\]/.test(line);
		}
	});
	
	return log.parse (formatter);
};
Log.Php = function (data, formatter)
{
	var log = new Log.Parser (data, {
		newMessage: function (line)
		{
			return /^\[\d{2}-[a-zA-Z]{3}-\d{4} \d{2}:\d{2}:\d{2}(?: [A-Za-z\/]+)*\]/.test(line);
		}
	});
	
	return log.parse (formatter);
};

Log.Iterator = function (data, keysOnly)
{
	var pos = 0, length = data.length;
	keysOnly = keysOnly || false;
	
	return {
		current: function ()
		{
			return data[pos];
		},
		hasNext: function ()
		{
			return length > pos;
		},
		peek: function ()
		{
			if ( ! this.hasNext() )
				throw "Stop iterating"
			return data[pos] + 1;
		},
		next: function ()
		{
			if ( ! this.hasNext() )
				throw "Stop iterating";
			if (keysOnly)
				return pos++;
			return [pos, data[pos++]];
		},
		rewind: function ()
		{
			pos = 0;
		}
	};
};

/**
 * @param data	an array containing each line of the file
 */
Log.Parser = function (data, options)
{
	var $this = this;
	this.iterator = new Log.Iterator (data);
	this.options = extend ({
		/**
		 * Whether or not the current line is a new message in the log, or if it is just a continuing of
		 * the previous message.
		 * 
		 * @return bool if the line is a new message or not. Default: true; every new line is treated as a new message
		 */
		newMessage: function (line)
		{
			return true;
		},
	}, options || {});
	
	return {
		parse: function (formatter)
		{
			var lines = [];
			try
			{
				var line, tmpLine;
				while ( (line = $this.iterator.next()) )
				{
					// group all error messages that might run for more than 1 line
					while ( $this.iterator.hasNext() && ! $this.options.newMessage ($this.iterator.peek()) )
					{
						line[1] += "\n" + $this.iterator.next()[1];
					}
					
					lines.push ( line[1] );
				}
			}
			// catch (err if err instanceof StopIteration)
			catch (err)
			{
				// no more lines
			}
			
			formatter = formatter || new Log.Formatter();
			return formatter.format (lines);
		}
	};
};

Log.Formatter = function (options)
{
	options = extend ({
		messageFormat: function (line)
		{
			return line + "\n";
		},
	}, options || {});
	
	var conditionalFormats = [];
	
	return {
		format: function (lines)
		{
			var result = "",
				line,
				lineIterator = new Log.Iterator(lines),
				formatIterator = new Log.Iterator(conditionalFormats);
			
			while (lineIterator.hasNext())
			{
				line = lineIterator.next()[1];
				
				formatIterator.rewind();
				var cond;
				while (formatIterator.hasNext())
				{
					cond = formatIterator.next()[1];
					if ( cond (line) )
						line = cond(line);
				}
				
				result += options.messageFormat (line);
			}
			
			return result;
		},
		
		ifMatch: function (callback)
		{
			conditionalFormats.push (callback);
		}
	};
};
