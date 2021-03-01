
// Inject script content at the top of the HTML head.
injectScriptContent( initLogglyAugmentation );

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// I inject and execute the given IIFE (immediately-invoked function expression) into the
// current HTML document.
function injectScriptContent( iifeFunction ) {

	var script = document.createElement( "script" );
	script.setAttribute( "type", "text/javascript" );
	script.setAttribute( "data-source", "Injected by Loggly Chrome Extension." );
	script.textContent = `;( ${ iifeFunction.toString() } )();`;

	document.head.appendChild( script );

}

// ----------------------------------------------------------------------------------- //
// ----------------------------------------------------------------------------------- //

// I augment the Loggly search styles and functionality to be a bit more helpful.
function initLogglyAugmentation() {

	// CAUTION: We can use jQuery in this Chrome Extension because we know that Loggly
	// uses jQuery in their application.
	var doc = $( document );
	var win = $( window );
	var head = $( document.head );
	var body = $( document.body );
	var outer = $( "<div></div>" )
		.addClass( "bnb-outer" )
	;
	var inner = $( "<pre></pre>" )
		.addClass( "bnb-inner" )
	;
	var explore = $( "<a>Explore</a>" )
		.addClass( "bnb-explore" )
		.attr( "target", "_blank" )
	;

	// Add all the nodes to the active document.
	body.append( outer.append( explore ).append( inner ) );

	// ---
	// Setup event handler.
	// ---

	// When the user double-clicks in the Grid cell, check for valid JSON and pretty-
	// print it in a modal window.
	doc.on(
		"dblclick",
		".ui-grid-cell-contents",
		function handleDblClick( event ) {

			var node = $( this );
			// Parse the JSON content and then re-stringify it so that it is 
			// formatted for easier reading.
			var nodeText = node.text();

			// Since there's no native way to check to see if a value is valid JSON
			// before parsing it, we might as well just try to parse it and catch
			// any errors.
			try {

				var payload = JSON.parse( nodeText );
				var content = JSON.stringify( payload, null, 4 );
				var showExploreButton = true;

			} catch ( error ) {

				console.warn( "Could not parse JSON in Grid cell. Falling back to raw value." );
				var content = nodeText;
				// Since the content is not valid JSON, we can't show the Explore button
				// as that will just lead to a failure later on with the external site.
				var showExploreButton = false;

			}

			// Inject the value into the modal window using .text() so that any HTML
			// that might be embedded in the JSON is escaped.
			inner.text( content );

			// Pull the HTML content out, which now contains ESCAPED embedded HTML if
			// it exists. At this point, we can do some light string-manipulation to
			// add additional HTML-based formatting.
			var html = inner
				.html()
				// Replace escaped line-breaks in strings with actual line-breaks 
				// that indent based on the prefix of the JSON key-value pair.
				.replace(
					/(^\s*"[\w-]+":\s*")([^\r\n]+)/gm,
					function( $0, leading, value ) {

						var indentation = " ".repeat( leading.length );
						var formattedValue = value.replace( /\\n/g, ( "\n" + indentation ) );

						return( leading + formattedValue );

					}
				)
				// Emphasize the JSON key.
				.replace( /("[\w-]+":)/g, "<strong>$1</strong>" )
			;
			inner.html( html );

			// Show the modal window.
			outer.addClass( "bnb-outer--active" );
			inner.scrollTop( 0 );

			if ( ! showExploreButton ) {

				return;

			}

			// Try to add the explore button, which requires the btoa() function.
			try {

				explore.attr( "href", `https://bennadel.github.io/JSON-Explorer/dist/#${ btoa( nodeText ) }` );
				explore.addClass( "bnb-explore--active" );

			} catch ( error ) {

				console.warn( "Explore button could not be rendered." );
				console.error( error );

			}

		}
	);

	// When the user clicks on the outer portion of the modal window, close it.
	doc.on(
		"click",
		".bnb-outer",
		function handleClick( event ) {

			// Ignore any click events from the inner portion of the modal.
			if ( ! outer.is( event.target ) ) {

				return;

			}

			outer.removeClass( "bnb-outer--active" );
			explore.removeClass( "bnb-explore--active" );

		}
	);

	// When the user hits Escape, close the modal window.
	win.on(
		"keydown",
		function handleKeyPress( event ) {

			// Ignore any non-Escape keys.
			if (
				( event.key !== "Escape" ) &&
				( event.key !== "Esc" )
				) {

				return;

			}

			if ( outer.is( ".bnb-outer--active" ) ) {

				outer.removeClass( "bnb-outer--active" );

			}

		}
	);

}
