/* From: https://github.com/component/textarea-caret-position */
/* jshint browser: true */
// (function () {
// We'll copy the properties below into the mirror div.
// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.
var properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize'
];
var isBrowser = (typeof window !== 'undefined');
var isFirefox = (isBrowser && window['mozInnerScreenX'] != null);
export function getCaretCoordinates(element, position, options) {
    if (!isBrowser) {
        throw new Error('textarea-caret-position#getCaretCoordinates should only be called in a browser');
    }
    var debug = options && options.debug || false;
    if (debug) {
        var el = document.querySelector('#input-textarea-caret-position-mirror-div');
        if (el)
            el.parentNode.removeChild(el);
    }
    // The mirror div will replicate the textarea's style
    var div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);
    var style = div.style;
    var computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle; // currentStyle for IE < 9
    var isInput = element.nodeName === 'INPUT';
    // Default textarea styles
    style.whiteSpace = 'pre-wrap';
    if (!isInput)
        style.wordWrap = 'break-word'; // only for textarea-s
    // Position off-screen
    style.position = 'absolute'; // required to return coordinates properly
    if (!debug)
        style.visibility = 'hidden'; // not 'display: none' because we want rendering
    // Transfer the element's properties to the div
    properties.forEach(function (prop) {
        if (isInput && prop === 'lineHeight') {
            // Special case for <input>s because text is rendered centered and line height may be != height
            if (computed.boxSizing === "border-box") {
                var height = parseInt(computed.height);
                var outerHeight = parseInt(computed.paddingTop) +
                    parseInt(computed.paddingBottom) +
                    parseInt(computed.borderTopWidth) +
                    parseInt(computed.borderBottomWidth);
                var targetHeight = outerHeight + parseInt(computed.lineHeight);
                if (height > targetHeight) {
                    style.lineHeight = height - outerHeight + "px";
                }
                else if (height === targetHeight) {
                    style.lineHeight = computed.lineHeight;
                }
                else {
                    style.lineHeight = '0';
                }
            }
            else {
                style.lineHeight = computed.height;
            }
        }
        else {
            style[prop] = computed[prop];
        }
    });
    if (isFirefox) {
        // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
        if (element.scrollHeight > parseInt(computed.height))
            style.overflowY = 'scroll';
    }
    else {
        style.overflow = 'hidden'; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
    }
    div.textContent = element.value.substring(0, position);
    // The second special handling for input type="text" vs textarea:
    // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
    if (isInput)
        div.textContent = div.textContent.replace(/\s/g, '\u00a0');
    var span = document.createElement('span');
    // Wrapping must be replicated *exactly*, including when a long word gets
    // onto the next line, with whitespace at the end of the line before (#7).
    // The  *only* reliable way to do that is to copy the *entire* rest of the
    // textarea's content into the <span> created at the caret position.
    // For inputs, just '.' would be enough, but no need to bother.
    span.textContent = element.value.substring(position) || '.'; // || because a completely empty faux span doesn't render at all
    div.appendChild(span);
    var coordinates = {
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
    };
    if (debug) {
        span.style.backgroundColor = '#aaa';
    }
    else {
        document.body.removeChild(div);
    }
    return coordinates;
}
// if (typeof module != 'undefined' && typeof module.exports != 'undefined') {
//   module.exports = getCaretCoordinates;
// } else if(isBrowser) {
//   window.getCaretCoordinates = getCaretCoordinates;
// }
// }());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyZXQtY29vcmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1tZW50aW9ucy9zcmMvbGliL2NhcmV0LWNvb3Jkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxnRUFBZ0U7QUFDaEUsMEJBQTBCO0FBRTFCLGlCQUFpQjtBQUVmLHVEQUF1RDtBQUN2RCwwRUFBMEU7QUFDMUUsMkVBQTJFO0FBQzNFLHVEQUF1RDtBQUN2RCxJQUFJLFVBQVUsR0FBRztJQUNmLFdBQVc7SUFDWCxXQUFXO0lBQ1gsT0FBTztJQUNQLFFBQVE7SUFDUixXQUFXO0lBQ1gsV0FBVztJQUVYLGdCQUFnQjtJQUNoQixrQkFBa0I7SUFDbEIsbUJBQW1CO0lBQ25CLGlCQUFpQjtJQUNqQixhQUFhO0lBRWIsWUFBWTtJQUNaLGNBQWM7SUFDZCxlQUFlO0lBQ2YsYUFBYTtJQUViLHdEQUF3RDtJQUN4RCxXQUFXO0lBQ1gsYUFBYTtJQUNiLFlBQVk7SUFDWixhQUFhO0lBQ2IsVUFBVTtJQUNWLGdCQUFnQjtJQUNoQixZQUFZO0lBQ1osWUFBWTtJQUVaLFdBQVc7SUFDWCxlQUFlO0lBQ2YsWUFBWTtJQUNaLGdCQUFnQjtJQUVoQixlQUFlO0lBQ2YsYUFBYTtJQUViLFNBQVM7SUFDVCxZQUFZO0NBRWIsQ0FBQztBQUVGLElBQUksU0FBUyxHQUFHLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUM7QUFDaEQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLGlCQUFpQixDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7QUFFakUsTUFBTSxVQUFVLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTztJQUM1RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO0tBQ25HO0lBRUQsSUFBSSxLQUFLLEdBQUcsT0FBTyxJ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QUFDMUMseUJBQXlCO0FBQ3pCLHNEQUFzRDtBQUN0RCxJQUFJO0FBRUosUUFBUSIsInNvdXJjZXNDb250ZW50IjpbIi8qIEZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb25lbnQvdGV4dGFyZWEtY2FyZXQtcG9zaXRpb24gKi9cbi8qIGpzaGludCBicm93c2VyOiB0cnVlICovXG5cbi8vIChmdW5jdGlvbiAoKSB7XG5cbiAgLy8gV2UnbGwgY29weSB0aGUgcHJvcGVydGllcyBiZWxvdyBpbnRvIHRoZSBtaXJyb3IgZGl2LlxuICAvLyBOb3RlIHRoYXQgc29tZSBicm93c2Vycywgc3VjaCBhcyBGaXJlZm94LCBkbyBub3QgY29uY2F0ZW5hdGUgcHJvcGVydGllc1xuICAvLyBpbnRvIHRoZWlyIHNob3J0aGFuZCAoZS5nLiBwYWRkaW5nLXRvcCwgcGFkZGluZy1ib3R0b20gZXRjLiAtPiBwYWRkaW5nKSxcbiAgLy8gc28gd2UgaGF2ZSB0byBsaXN0IGV2ZXJ5IHNpbmdsZSBwcm9wZXJ0eSBleHBsaWNpdGx5LlxuICB2YXIgcHJvcGVydGllcyA9IFtcbiAgICAnZGlyZWN0aW9uJywgIC8vIFJUTCBzdXBwb3J0XG4gICAgJ2JveFNpemluZycsXG4gICAgJ3dpZHRoJywgIC8vIG9uIENocm9tZSBhbmQgSUUsIGV4Y2x1ZGUgdGhlIHNjcm9sbGJhciwgc28gdGhlIG1pcnJvciBkaXYgd3JhcHMgZXhhY3RseSBhcyB0aGUgdGV4dGFyZWEgZG9lc1xuICAgICdoZWlnaHQnLFxuICAgICdvdmVyZmxvd1gnLFxuICAgICdvdmVyZmxvd1knLCAgLy8gY29weSB0aGUgc2Nyb2xsYmFyIGZvciBJRVxuXG4gICAgJ2JvcmRlclRvcFdpZHRoJyxcbiAgICAnYm9yZGVyUmlnaHRXaWR0aCcsXG4gICAgJ2JvcmRlckJvdHRvbVdpZHRoJyxcbiAgICAnYm9yZGVyTGVmdFdpZHRoJyxcbiAgICAnYm9yZGVyU3R5bGUnLFxuXG4gICAgJ3BhZGRpbmdUb3AnLFxuICAgICdwYWRkaW5nUmlnaHQnLFxuICAgICdwYWRkaW5nQm90dG9tJyxcbiAgICAncGFkZGluZ0xlZnQnLFxuXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL2ZvbnRcbiAgICAnZm9udFN0eWxlJyxcbiAgICAnZm9udFZhcmlhbnQnLFxuICAgICdmb250V2VpZ2h0JyxcbiAgICAnZm9udFN0cmV0Y2gnLFxuICAgICdmb250U2l6ZScsXG4gICAgJ2ZvbnRTaXplQWRqdXN0JyxcbiAgICAnbGluZUhlaWdodCcsXG4gICAgJ2ZvbnRGYW1pbHknLFxuXG4gICAgJ3RleHRBbGlnbicsXG4gICAgJ3RleHRUcmFuc2Zvcm0nLFxuICAgICd0ZXh0SW5kZW50JyxcbiAgICAndGV4dERlY29yYXRpb24nLCAgLy8gbWlnaHQgbm90IG1ha2UgYSBkaWZmZXJlbmNlLCBidXQgYmV0dGVyIGJlIHNhZmVcblxuICAgICdsZXR0ZXJTcGFjaW5nJyxcbiAgICAnd29yZFNwYWNpbmcnLFxuXG4gICAgJ3RhYlNpemUnLFxuICAgICdNb3pUYWJTaXplJ1xuXG4gIF07XG5cbiAgdmFyIGlzQnJvd3NlciA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyk7XG4gIHZhciBpc0ZpcmVmb3ggPSAoaXNCcm93c2VyICYmIHdpbmRvd1snbW96SW5uZXJTY3JlZW5YJ10gIT0gbnVsbCk7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGdldENhcmV0Q29vcmRpbmF0ZXMoZWxlbWVudCwgcG9zaXRpb24sIG9wdGlvbnMpIHtcbiAgICBpZiAoIWlzQnJvd3Nlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZXh0YXJlYS1jYXJldC1wb3NpdGlvbiNnZXRDYXJldENvb3JkaW5hdGVzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBhIGJyb3dzZXInKTtcbiAgICB9XG5cbiAgICB2YXIgZGVidWcgPSBvcHRpb25zICYmIG9wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG4gICAgaWYgKGRlYnVnKSB7XG4gICAgICB2YXIgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaW5wdXQtdGV4dGFyZWEtY2FyZXQtcG9zaXRpb24tbWlycm9yLWRpdicpO1xuICAgICAgaWYgKGVsKSBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgbWlycm9yIGRpdiB3aWxsIHJlcGxpY2F0ZSB0aGUgdGV4dGFyZWEncyBzdHlsZVxuICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuaWQgPSAnaW5wdXQtdGV4dGFyZWEtY2FyZXQtcG9zaXRpb24tbWlycm9yLWRpdic7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkaXYpO1xuXG4gICAgdmFyIHN0eWxlID0gZGl2LnN0eWxlO1xuICAgIHZhciBjb21wdXRlZCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkgOiBlbGVtZW50LmN1cnJlbnRTdHlsZTsgIC8vIGN1cnJlbnRTdHlsZSBmb3IgSUUgPCA5XG4gICAgdmFyIGlzSW5wdXQgPSBlbGVtZW50Lm5vZGVOYW1lID09PSAnSU5QVVQnO1xuXG4gICAgLy8gRGVmYXVsdCB0ZXh0YXJlYSBzdHlsZXNcbiAgICBzdHlsZS53aGl0ZVNwYWNlID0gJ3ByZS13cmFwJztcbiAgICBpZiAoIWlzSW5wdXQpXG4gICAgICBzdHlsZS53b3JkV3JhcCA9ICdicmVhay13b3JkJzsgIC8vIG9ubHkgZm9yIHRleHRhcmVhLXNcblxuICAgIC8vIFBvc2l0aW9uIG9mZi1zY3JlZW5cbiAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7ICAvLyByZXF1aXJlZCB0byByZXR1cm4gY29vcmRpbmF0ZXMgcHJvcGVybHlcbiAgICBpZiAoIWRlYnVnKVxuICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nOyAgLy8gbm90ICdkaXNwbGF5OiBub25lJyBiZWNhdXNlIHdlIHdhbnQgcmVuZGVyaW5nXG5cbiAgICAvLyBUcmFuc2ZlciB0aGUgZWxlbWVudCdzIHByb3BlcnRpZXMgdG8gdGhlIGRpdlxuICAgIHByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiAocHJvcCkge1xuICAgICAgaWYgKGlzSW5wdXQgJiYgcHJvcCA9PT0gJ2xpbmVIZWlnaHQnKSB7XG4gICAgICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgPGlucHV0PnMgYmVjYXVzZSB0ZXh0IGlzIHJlbmRlcmVkIGNlbnRlcmVkIGFuZCBsaW5lIGhlaWdodCBtYXkgYmUgIT0gaGVpZ2h0XG4gICAgICAgIGlmIChjb21wdXRlZC5ib3hTaXppbmcgPT09IFwiYm9yZGVyLWJveFwiKSB7XG4gICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KGNvbXB1dGVkLmhlaWdodCk7XG4gICAgICAgICAgdmFyIG91dGVySGVpZ2h0ID1cbiAgICAgICAgICAgIHBhcnNlSW50KGNvbXB1dGVkLnBhZGRpbmdUb3ApICtcbiAgICAgICAgICAgIHBhcnNlSW50KGNvbXB1dGVkLnBhZGRpbmdCb3R0b20pICtcbiAgICAgICAgICAgIHBhcnNlSW50KGNvbXB1dGVkLmJvcmRlclRvcFdpZHRoKSArXG4gICAgICAgICAgICBwYXJzZUludChjb21wdXRlZC5ib3JkZXJCb3R0b21XaWR0aCk7XG4gICAgICAgICAgdmFyIHRhcmdldEhlaWdodCA9IG91dGVySGVpZ2h0ICsgcGFyc2VJbnQoY29tcHV0ZWQubGluZUhlaWdodCk7XG4gICAgICAgICAgaWYgKGhlaWdodCA+IHRhcmdldEhlaWdodCkge1xuICAgICAgICAgICAgc3R5bGUubGluZUhlaWdodCA9IGhlaWdodCAtIG91dGVySGVpZ2h0ICsgXCJweFwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaGVpZ2h0ID09PSB0YXJnZXRIZWlnaHQpIHtcbiAgICAgICAgICAgIHN0eWxlLmxpbmVIZWlnaHQgPSBjb21wdXRlZC5saW5lSGVpZ2h0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS5saW5lSGVpZ2h0ID0gJzAnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS5saW5lSGVpZ2h0ID0gY29tcHV0ZWQuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZVtwcm9wXSA9IGNvbXB1dGVkW3Byb3BdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGlzRmlyZWZveCkge1xuICAgICAgLy8gRmlyZWZveCBsaWVzIGFib3V0IHRoZSBvdmVyZmxvdyBwcm9wZXJ0eSBmb3IgdGV4dGFyZWFzOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05ODQyNzVcbiAgICAgIGlmIChlbGVtZW50LnNjcm9sbEhlaWdodCA+IHBhcnNlSW50KGNvbXB1dGVkLmhlaWdodCkpXG4gICAgICAgIHN0eWxlLm92ZXJmbG93WSA9ICdzY3JvbGwnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nOyAgLy8gZm9yIENocm9tZSB0byBub3QgcmVuZGVyIGEgc2Nyb2xsYmFyOyBJRSBrZWVwcyBvdmVyZmxvd1kgPSAnc2Nyb2xsJ1xuICAgIH1cblxuICAgIGRpdi50ZXh0Q29udGVudCA9IGVsZW1lbnQudmFsdWUuc3Vic3RyaW5nKDAsIHBvc2l0aW9uKTtcbiAgICAvLyBUaGUgc2Vjb25kIHNwZWNpYWwgaGFuZGxpbmcgZm9yIGlucHV0IHR5cGU9XCJ0ZXh0XCIgdnMgdGV4dGFyZWE6XG4gICAgLy8gc3BhY2VzIG5lZWQgdG8gYmUgcmVwbGFjZWQgd2l0aCBub24tYnJlYWtpbmcgc3BhY2VzIC0gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTM0MDIwMzUvMTI2OTAzN1xuICAgIGlmIChpc0lucHV0KVxuICAgICAgZGl2LnRleHRDb250ZW50ID0gZGl2LnRleHRDb250ZW50LnJlcGxhY2UoL1xccy9nLCAnXFx1MDBhMCcpO1xuXG4gICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgLy8gV3JhcHBpbmcgbXVzdCBiZSByZXBsaWNhdGVkICpleGFjdGx5KiwgaW5jbHVkaW5nIHdoZW4gYSBsb25nIHdvcmQgZ2V0c1xuICAgIC8vIG9udG8gdGhlIG5leHQgbGluZSwgd2l0aCB3aGl0ZXNwYWNlIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUgYmVmb3JlICgjNykuXG4gICAgLy8gVGhlICAqb25seSogcmVsaWFibGUgd2F5IHRvIGRvIHRoYXQgaXMgdG8gY29weSB0aGUgKmVudGlyZSogcmVzdCBvZiB0aGVcbiAgICAvLyB0ZXh0YXJlYSdzIGNvbnRlbnQgaW50byB0aGUgPHNwYW4+IGNyZWF0ZWQgYXQgdGhlIGNhcmV0IHBvc2l0aW9uLlxuICAgIC8vIEZvciBpbnB1dHMsIGp1c3QgJy4nIHdvdWxkIGJlIGVub3VnaCwgYnV0IG5vIG5lZWQgdG8gYm90aGVyLlxuICAgIHNwYW4udGV4dENvbnRlbnQgPSBlbGVtZW50LnZhbHVlLnN1YnN0cmluZyhwb3NpdGlvbikgfHwgJy4nOyAgLy8gfHwgYmVjYXVzZSBhIGNvbXBsZXRlbHkgZW1wdHkgZmF1eCBzcGFuIGRvZXNuJ3QgcmVuZGVyIGF0IGFsbFxuICAgIGRpdi5hcHBlbmRDaGlsZChzcGFuKTtcblxuICAgIHZhciBjb29yZGluYXRlcyA9IHtcbiAgICAgIHRvcDogc3Bhbi5vZmZzZXRUb3AgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyVG9wV2lkdGgnXSksXG4gICAgICBsZWZ0OiBzcGFuLm9mZnNldExlZnQgKyBwYXJzZUludChjb21wdXRlZFsnYm9yZGVyTGVmdFdpZHRoJ10pLFxuICAgICAgaGVpZ2h0OiBwYXJzZUludChjb21wdXRlZFsnbGluZUhlaWdodCddKVxuICAgIH07XG5cbiAgICBpZiAoZGVidWcpIHtcbiAgICAgIHNwYW4uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNhYWEnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGRpdik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvb3JkaW5hdGVzO1xuICB9XG5cbiAgLy8gaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9ICd1bmRlZmluZWQnKSB7XG4gIC8vICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRDYXJldENvb3JkaW5hdGVzO1xuICAvLyB9IGVsc2UgaWYoaXNCcm93c2VyKSB7XG4gIC8vICAgd2luZG93LmdldENhcmV0Q29vcmRpbmF0ZXMgPSBnZXRDYXJldENvb3JkaW5hdGVzO1xuICAvLyB9XG5cbiAgLy8gfSgpKTsiXX0=