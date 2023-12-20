import { Directive } from "@angular/core";
import { EventEmitter, Input, Output } from "@angular/core";
import { getCaretPosition, getValue, insertValue, setCaretPosition } from './mention-utils';
import { MentionListComponent } from './mention-list.component';
import * as i0 from "@angular/core";
const KEY_BACKSPACE = 8;
const KEY_TAB = 9;
const KEY_ENTER = 13;
const KEY_SHIFT = 16;
const KEY_ESCAPE = 27;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_BUFFERED = 229;
/**
 * Angular Mentions.
 * https://github.com/dmacfarlane/angular-mentions
 *
 * Copyright (c) 2017 Dan MacFarlane
 */
export class MentionDirective {
    constructor(_element, _componentResolver, _viewContainerRef) {
        this._element = _element;
        this._componentResolver = _componentResolver;
        this._viewContainerRef = _viewContainerRef;
        // the provided configuration object
        this.mentionConfig = { items: [] };
        this.DEFAULT_CONFIG = {
            items: [],
            triggerChar: '@',
            labelKey: 'label',
            maxItems: -1,
            allowSpace: false,
            returnTrigger: false,
            mentionSelect: (item, triggerChar) => {
                return this.activeConfig.triggerChar + item[this.activeConfig.labelKey];
            },
            mentionFilter: (searchString, items) => {
                const searchStringLowerCase = searchString.toLowerCase();
                return items.filter(e => e[this.activeConfig.labelKey].toLowerCase().startsWith(searchStringLowerCase));
            }
        };
        // event emitted whenever the search term changes
        this.searchTerm = new EventEmitter();
        // event emitted when an item is selected
        this.itemSelected = new EventEmitter();
        // event emitted whenever the mention list is opened or closed
        this.opened = new EventEmitter();
        this.closed = new EventEmitter();
        this.triggerChars = {};
    }
    set mention(items) {
        this.mentionItems = items;
    }
    ngOnChanges(changes) {
        // console.log('config change', changes);
        if (changes['mention'] || changes['mentionConfig']) {
            this.updateConfig();
        }
    }
    updateConfig() {
        let config = this.mentionConfig;
        this.triggerChars = {};
        // use items from directive if they have been set
        if (this.mentionItems) {
            config.items = this.mentionItems;
        }
        this.addConfig(config);
        // nested configs
        if (config.mentions) {
            config.mentions.forEach(config => this.addConfig(config));
        }
    }
    // add configuration for a trigger char
    addConfig(config) {
        // defaults
        let defaults = Object.assign({}, this.DEFAULT_CONFIG);
        config = Object.assign(defaults, config);
        // items
        let items = config.items;
        if (items && items.length > 0) {
            // convert strings to objects
            if (typeof items[0] == 'string') {
                items = items.map((label) => {
                    let object = {};
                    object[config.labelKey] = label;
                    return object;
                });
            }
            if (config.labelKey) {
                // remove items without an labelKey (as it's required to filter the list)
                items = items.filter(e => e[config.labelKey]);
                if (!config.disableSort) {
                    items.sort((a, b) => a[config.labelKey].localeCompare(b[config.labelKey]));
                }
            }
        }
        config.items = items;
        // add the config
        this.triggerChars[config.triggerChar] = config;
        // for async update while menu/search is active
        if (this.activeConfig && this.activeConfig.triggerChar == config.triggerChar) {
            this.activeConfig = config;
            this.updateSearchList();
        }
    }
    setIframe(iframe) {
        this.iframe = iframe;
    }
    stopEvent(event) {
        //if (event instanceof KeyboardEvent) { // does not work for iframe
        if (!event.wasClick) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }
    blurHandler(event) {
        this.stopEvent(event);
        this.stopSearch();
    }
    inputHandler(event, nativeElement = this._element.nativeElement) {
        if (this.lastKeyCode === KEY_BUFFERED && event.data) {
            let keyCode = event.data.charCodeAt(0);
            this.keyHandler({ keyCode, inputEvent: true }, nativeElement);
        }
    }
    // @param nativeElement is the alternative text element in an iframe scenario
    keyHandler(event, nativeElement = this._element.nativeElement) {
        this.lastKeyCode = event.keyCode;
        if (event.isComposing || event.keyCode === KEY_BUFFERED) {
            return;
        }
        let val = getValue(nativeElement);
        let pos = getCaretPosition(nativeElement, this.iframe);
        let charPressed = event.key;
        if (!charPressed) {
            let charCode = event.which || event.keyCode;
            if (!event.shiftKey && (charCode >= 65 && charCode <= 90)) {
                charPressed = String.fromCharCode(charCode + 32);
            }
            // else if (event.shiftKey && charCode === KEY_2) {
            //   charPressed = this.config.triggerChar;
            // }
            else {
                // TODO (dmacfarlane) fix this for non-alpha keys
                // http://stackoverflow.com/questions/2220196/how-to-decode-character-pressed-from-jquerys-keydowns-event-handler?lq=1
                charPressed = String.fromCharCode(event.which || event.keyCode);
            }
        }
        if (event.keyCode == KEY_ENTER && event.wasClick && pos < this.startPos) {
            // put caret back in position prior to contenteditable menu click
            pos = this.startNode.length;
            setCaretPosition(this.startNode, pos, this.iframe);
        }
        //console.log("keyHandler", this.startPos, pos, val, charPressed, event);
        let config = this.triggerChars[charPressed];
        if (config) {
            this.activeConfig = config;
            this.startPos = event.inputEvent ? pos - 1 : pos;
            this.startNode = (this.iframe ? this.iframe.contentWindow.getSelection() : window.getSelection()).anchorNode;
            this.searching = true;
            this.searchString = null;
            this.showSearchList(nativeElement);
            this.updateSearchList();
            if (config.returnTrigger) {
                this.searchTerm.emit(config.triggerChar);
            }
        }
        else if (this.startPos >= 0 && this.searching) {
            if (pos <= this.startPos) {
                this.searchList.hidden = true;
            }
            // ignore shift when pressed alone, but not when used with another key
            else if (event.keyCode !== KEY_SHIFT &&
                !event.metaKey &&
                !event.altKey &&
                !event.ctrlKey &&
                pos > this.startPos) {
                if (!this.activeConfig.allowSpace && event.keyCode === KEY_SPACE) {
                    this.startPos = -1;
                }
                else if (event.keyCode === KEY_BACKSPACE && pos > 0) {
                    pos--;
                    if (pos == this.startPos) {
                        this.stopSearch();
                    }
                }
                else if (this.searchList.hidden) {
                    if (event.keyCode === KEY_TAB || event.keyCode === KEY_ENTER) {
                        this.stopSearch();
                        return;
                    }
                }
                else if (!this.searchList.hidden) {
                    if (event.keyCode === KEY_TAB || event.keyCode === KEY_ENTER) {
                        this.stopEvent(event);
                        // emit the selected list item
                        this.itemSelected.emit(this.searchList.activeItem);
                        // optional function to format the selected item before inserting the text
                        const text = this.activeConfig.mentionSelect(this.searchList.activeItem, this.activeConfig.triggerChar);
                        // value is inserted without a trailing space for consistency
                        // between element types (div and iframe do not preserve the space)
                        insertValue(nativeElement, this.startPos, pos, text, this.iframe);
                        // fire input event so angular bindings are updated
                        if ("createEvent" in document) {
                            let evt = document.createEvent("HTMLEvents");
                            if (this.iframe) {
                                // a 'change' event is required to trigger tinymce updates
                                evt.initEvent("change", true, false);
                            }
                            else {
                                evt.initEvent("input", true, false);
                            }
                            // this seems backwards, but fire the event from this elements nativeElement (not the
                            // one provided that may be in an iframe, as it won't be propogate)
                            this._element.nativeElement.dispatchEvent(evt);
                        }
                        this.startPos = -1;
                        this.stopSearch();
                        return false;
                    }
                    else if (event.keyCode === KEY_ESCAPE) {
                        this.stopEvent(event);
                        this.stopSearch();
                        return false;
                    }
                    else if (event.keyCode === KEY_DOWN) {
                        this.stopEvent(event);
                        this.searchList.activateNextItem();
                        return false;
                    }
                    else if (event.keyCode === KEY_UP) {
                        this.stopEvent(event);
                        this.searchList.activatePreviousItem();
                        return false;
                    }
                }
                if (charPressed.length != 1 && event.keyCode != KEY_BACKSPACE) {
                    this.stopEvent(event);
                    return false;
                }
                else if (this.searching) {
                    let mention = val.substring(this.startPos + 1, pos);
                    if (event.keyCode !== KEY_BACKSPACE && !event.inputEvent) {
                        mention += charPressed;
                    }
                    this.searchString = mention;
                    if (this.activeConfig.returnTrigger) {
                        const triggerChar = (this.searchString || event.keyCode === KEY_BACKSPACE) ? val.substring(this.startPos, this.startPos + 1) : '';
                        this.searchTerm.emit(triggerChar + this.searchString);
                    }
                    else {
                        this.searchTerm.emit(this.searchString);
                    }
                    this.updateSearchList();
                }
            }
        }
    }
    // exposed for external calls to open the mention list, e.g. by clicking a button
    startSearch(triggerChar, nativeElement = this._element.nativeElement) {
        triggerChar = triggerChar || this.mentionConfig.triggerChar || this.DEFAULT_CONFIG.triggerChar;
        const pos = getCaretPosition(nativeElement, this.iframe);
        insertValue(nativeElement, pos, pos, triggerChar, this.iframe);
        this.keyHandler({ key: triggerChar, inputEvent: true }, nativeElement);
    }
    stopSearch() {
        if (this.searchList && !this.searchList.hidden) {
            this.searchList.hidden = true;
            this.closed.emit();
        }
        this.activeConfig = null;
        this.searching = false;
    }
    updateSearchList() {
        let matches = [];
        if (this.activeConfig && this.activeConfig.items) {
            let objects = this.activeConfig.items;
            // disabling the search relies on the async operation to do the filtering
            if (!this.activeConfig.disableSearch && this.searchString && this.activeConfig.labelKey) {
                if (this.activeConfig.mentionFilter) {
                    objects = this.activeConfig.mentionFilter(this.searchString, objects);
                }
            }
            matches = objects;
            if (this.activeConfig.maxItems > 0) {
                matches = matches.slice(0, this.activeConfig.maxItems);
            }
        }
        // update the search list
        if (this.searchList) {
            this.searchList.items = matches;
            this.searchList.hidden = matches.length == 0;
        }
    }
    showSearchList(nativeElement) {
        this.opened.emit();
        if (this.searchList == null) {
            let componentFactory = this._componentResolver.resolveComponentFactory(MentionListComponent);
            let componentRef = this._viewContainerRef.createComponent(componentFactory);
            this.searchList = componentRef.instance;
            this.searchList.itemTemplate = this.mentionListTemplate;
            componentRef.instance['itemClick'].subscribe(() => {
                nativeElement.focus();
                let fakeKeydown = { key: 'Enter', keyCode: KEY_ENTER, wasClick: true };
                this.keyHandler(fakeKeydown, nativeElement);
            });
        }
        this.searchList.labelKey = this.activeConfig.labelKey;
        this.searchList.dropUp = this.activeConfig.dropUp;
        this.searchList.styleOff = this.mentionConfig.disableStyle;
        this.searchList.activeIndex = 0;
        this.searchList.position(nativeElement, this.iframe);
        window.requestAnimationFrame(() => this.searchList.reset());
    }
}
MentionDirective.ɵfac = function MentionDirective_Factory(t) { return new (t || MentionDirective)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.ComponentFactoryResolver), i0.ɵɵdirectiveInject(i0.ViewContainerRef)); };
MentionDirective.ɵdir = /*@__PURE__*/ i0.ɵɵdefineDirective({ type: MentionDirective, selectors: [["", "mention", ""], ["", "mentionConfig", ""]], hostAttrs: ["autocomplete", "off"], hostBindings: function MentionDirective_HostBindings(rf, ctx) { if (rf & 1) {
        i0.ɵɵlistener("keydown", function MentionDirective_keydown_HostBindingHandler($event) { return ctx.keyHandler($event); })("input", function MentionDirective_input_HostBindingHandler($event) { return ctx.inputHandler($event); })("blur", function MentionDirective_blur_HostBindingHandler($event) { return ctx.blurHandler($event); });
    } }, inputs: { mention: "mention", mentionConfig: "mentionConfig", mentionListTemplate: "mentionListTemplate" }, outputs: { searchTerm: "searchTerm", itemSelected: "itemSelected", opened: "opened", closed: "closed" }, features: [i0.ɵɵNgOnChangesFeature] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MentionDirective, [{
        type: Directive,
        args: [{
                selector: '[mention], [mentionConfig]',
                host: {
                    '(keydown)': 'keyHandler($event)',
                    '(input)': 'inputHandler($event)',
                    '(blur)': 'blurHandler($event)',
                    'autocomplete': 'off'
                }
            }]
    }], function () { return [{ type: i0.ElementRef }, { type: i0.ComponentFactoryResolver }, { type: i0.ViewContainerRef }]; }, { mention: [{
            type: Input,
            args: ['mention']
        }], mentionConfig: [{
            type: Input
        }], mentionListTemplate: [{
            type: Input
        }], searchTerm: [{
            type: Output
        }], itemSelected: [{
            type: Output
        }], opened: [{
            type: Output
        }], closed: [{
            type: Output
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudGlvbi5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyLW1lbnRpb25zL3NyYy9saWIvbWVudGlvbi5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUE0QixTQUFTLEVBQTZDLE1BQU0sZUFBZSxDQUFDO0FBQy9HLE9BQU8sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFhLE1BQU0sRUFBaUIsTUFBTSxlQUFlLENBQUM7QUFDdEYsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUc1RixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQzs7QUFFaEUsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNsQixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNsQixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQztBQUV6Qjs7Ozs7R0FLRztBQVVILE1BQU0sT0FBTyxnQkFBZ0I7SUFxRDNCLFlBQ1UsUUFBb0IsRUFDcEIsa0JBQTRDLEVBQzVDLGlCQUFtQztRQUZuQyxhQUFRLEdBQVIsUUFBUSxDQUFZO1FBQ3BCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMEI7UUFDNUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFr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dGl2ZSwgRWxlbWVudFJlZiwgVGVtcGxhdGVSZWYsIFZpZXdDb250YWluZXJSZWYgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT25DaGFuZ2VzLCBPdXRwdXQsIFNpbXBsZUNoYW5nZXMgfSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuaW1wb3J0IHsgZ2V0Q2FyZXRQb3NpdGlvbiwgZ2V0VmFsdWUsIGluc2VydFZhbHVlLCBzZXRDYXJldFBvc2l0aW9uIH0gZnJvbSAnLi9tZW50aW9uLXV0aWxzJztcblxuaW1wb3J0IHsgTWVudGlvbkNvbmZpZyB9IGZyb20gXCIuL21lbnRpb24tY29uZmlnXCI7XG5pbXBvcnQgeyBNZW50aW9uTGlzdENvbXBvbmVudCB9IGZyb20gJy4vbWVudGlvbi1saXN0LmNvbXBvbmVudCc7XG5cbmNvbnN0IEtFWV9CQUNLU1BBQ0UgPSA4O1xuY29uc3QgS0VZX1RBQiA9IDk7XG5jb25zdCBLRVlfRU5URVIgPSAxMztcbmNvbnN0IEtFWV9TSElGVCA9IDE2O1xuY29uc3QgS0VZX0VTQ0FQRSA9IDI3O1xuY29uc3QgS0VZX1NQQUNFID0gMzI7XG5jb25zdCBLRVlfTEVGVCA9IDM3O1xuY29uc3QgS0VZX1VQID0gMzg7XG5jb25zdCBLRVlfUklHSFQgPSAzOTtcbmNvbnN0IEtFWV9ET1dOID0gNDA7XG5jb25zdCBLRVlfQlVGRkVSRUQgPSAyMjk7XG5cbi8qKlxuICogQW5ndWxhciBNZW50aW9ucy5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kbWFjZmFybGFuZS9hbmd1bGFyLW1lbnRpb25zXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE3IERhbiBNYWNGYXJsYW5lXG4gKi9cbkBEaXJlY3RpdmUoe1xuICBzZWxlY3RvcjogJ1ttZW50aW9uXSwgW21lbnRpb25Db25maWddJyxcbiAgaG9zdDoge1xuICAgICcoa2V5ZG93biknOiAna2V5SGFuZGxlcigkZXZlbnQpJyxcbiAgICAnKGlucHV0KSc6ICdpbnB1dEhhbmRsZXIoJGV2ZW50KScsXG4gICAgJyhibHVyKSc6ICdibHVySGFuZGxlcigkZXZlbnQpJyxcbiAgICAnYXV0b2NvbXBsZXRlJzogJ29mZidcbiAgfVxufSlcbmV4cG9ydCBjbGFzcyBNZW50aW9uRGlyZWN0aXZlIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcblxuICAvLyBzdG9yZXMgdGhlIGl0ZW1zIHBhc3NlZCB0byB0aGUgbWVudGlvbnMgZGlyZWN0aXZlIGFuZCB1c2VkIHRvIHBvcHVsYXRlIHRoZSByb290IGl0ZW1zIGluIG1lbnRpb25Db25maWdcbiAgcHJpdmF0ZSBtZW50aW9uSXRlbXM6IGFueVtdO1xuXG4gIEBJbnB1dCgnbWVudGlvbicpIHNldCBtZW50aW9uKGl0ZW1zOiBhbnlbXSkge1xuICAgIHRoaXMubWVudGlvbkl0ZW1zID0gaXRlbXM7XG4gIH1cblxuICAvLyB0aGUgcHJvdmlkZWQgY29uZmlndXJhdGlvbiBvYmplY3RcbiAgQElucHV0KCkgbWVudGlvbkNvbmZpZzogTWVudGlvbkNvbmZpZyA9IHsgaXRlbXM6IFtdIH07XG5cbiAgcHJpdmF0ZSBhY3RpdmVDb25maWc6IE1lbnRpb25Db25maWc7XG5cbiAgcHJpdmF0ZSBERUZBVUxUX0NPTkZJRzogTWVudGlvbkNvbmZpZyA9IHtcbiAgICBpdGVtczogW10sXG4gICAgdHJpZ2dlckNoYXI6ICdAJyxcbiAgICBsYWJlbEtleTogJ2xhYmVsJyxcbiAgICBtYXhJdGVtczogLTEsXG4gICAgYWxsb3dTcGFjZTogZmFsc2UsXG4gICAgcmV0dXJuVHJpZ2dlcjogZmFsc2UsXG4gICAgbWVudGlvblNlbGVjdDogKGl0ZW06IGFueSwgdHJpZ2dlckNoYXI/OiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmFjdGl2ZUNvbmZpZy50cmlnZ2VyQ2hhciArIGl0ZW1bdGhpcy5hY3RpdmVDb25maWcubGFiZWxLZXldO1xuICAgIH0sXG4gICAgbWVudGlvbkZpbHRlcjogKHNlYXJjaFN0cmluZzogc3RyaW5nLCBpdGVtczogYW55W10pID0+IHtcbiAgICAgIGNvbnN0IHNlYXJjaFN0cmluZ0xvd2VyQ2FzZSA9IHNlYXJjaFN0cmluZy50b0xvd2VyQ2FzZSgpO1xuICAgICAgcmV0dXJuIGl0ZW1zLmZpbHRlcihlID0+IGVbdGhpcy5hY3RpdmVDb25maWcubGFiZWxLZXldLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChzZWFyY2hTdHJpbmdMb3dlckNhc2UpKTtcbiAgICB9XG4gIH1cblxuICAvLyB0ZW1wbGF0ZSB0byB1c2UgZm9yIHJlbmRlcmluZyBsaXN0IGl0ZW1zXG4gIEBJbnB1dCgpIG1lbnRpb25MaXN0VGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLy8gZXZlbnQgZW1pdHRlZCB3aGVuZXZlciB0aGUgc2VhcmNoIHRlcm0gY2hhbmdlc1xuICBAT3V0cHV0KCkgc2VhcmNoVGVybSA9IG5ldyBFdmVudEVtaXR0ZXI8c3RyaW5nPigpO1xuXG4gIC8vIGV2ZW50IGVtaXR0ZWQgd2hlbiBhbiBpdGVtIGlzIHNlbGVjdGVkXG4gIEBPdXRwdXQoKSBpdGVtU2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcblxuICAvLyBldmVudCBlbWl0dGVkIHdoZW5ldmVyIHRoZSBtZW50aW9uIGxpc3QgaXMgb3BlbmVkIG9yIGNsb3NlZFxuICBAT3V0cHV0KCkgb3BlbmVkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAT3V0cHV0KCkgY2xvc2VkID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIHByaXZhdGUgdHJpZ2dlckNoYXJzOiB7IFtrZXk6IHN0cmluZ106IE1lbnRpb25Db25maWcgfSA9IHt9O1xuXG4gIHByaXZhdGUgc2VhcmNoU3RyaW5nOiBzdHJpbmc7XG4gIHByaXZhdGUgc3RhcnRQb3M6IG51bWJlcjtcbiAgcHJpdmF0ZSBzdGFydE5vZGU7XG4gIHByaXZhdGUgc2VhcmNoTGlzdDogTWVudGlvbkxpc3RDb21wb25lbnQ7XG4gIHByaXZhdGUgc2VhcmNoaW5nOiBib29sZWFuO1xuICBwcml2YXRlIGlmcmFtZTogYW55OyAvLyBvcHRpb25hbFxuICBwcml2YXRlIGxhc3RLZXlDb2RlOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfZWxlbWVudDogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIF9jb21wb25lbnRSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgIHByaXZhdGUgX3ZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWZcbiAgKSB7IH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ2NvbmZpZyBjaGFuZ2UnLCBjaGFuZ2VzKTtcbiAgICBpZiAoY2hhbmdlc1snbWVudGlvbiddIHx8IGNoYW5nZXNbJ21lbnRpb25Db25maWcnXSkge1xuICAgICAgdGhpcy51cGRhdGVDb25maWcoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlQ29uZmlnKCkge1xuICAgIGxldCBjb25maWcgPSB0aGlzLm1lbnRpb25Db25maWc7XG4gICAgdGhpcy50cmlnZ2VyQ2hhcnMgPSB7fTtcbiAgICAvLyB1c2UgaXRlbXMgZnJvbSBkaXJlY3RpdmUgaWYgdGhleSBoYXZlIGJlZW4gc2V0XG4gICAgaWYgKHRoaXMubWVudGlvbkl0ZW1zKSB7XG4gICAgICBjb25maWcuaXRlbXMgPSB0aGlzLm1lbnRpb25JdGVtcztcbiAgICB9XG4gICAgdGhpcy5hZGRDb25maWcoY29uZmlnKTtcbiAgICAvLyBuZXN0ZWQgY29uZmlnc1xuICAgIGlmIChjb25maWcubWVudGlvbnMpIHtcbiAgICAgIGNvbmZpZy5tZW50aW9ucy5mb3JFYWNoKGNvbmZpZyA9PiB0aGlzLmFkZENvbmZpZyhjb25maWcpKTtcbiAgICB9XG4gIH1cblxuICAvLyBhZGQgY29uZmlndXJhdGlvbiBmb3IgYSB0cmlnZ2VyIGNoYXJcbiAgcHJpdmF0ZSBhZGRDb25maWcoY29uZmlnOiBNZW50aW9uQ29uZmlnKSB7XG4gICAgLy8gZGVmYXVsdHNcbiAgICBsZXQgZGVmYXVsdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLkRFRkFVTFRfQ09ORklHKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIC8vIGl0ZW1zXG4gICAgbGV0IGl0ZW1zID0gY29uZmlnLml0ZW1zO1xuICAgIGlmIChpdGVtcyAmJiBpdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBjb252ZXJ0IHN0cmluZ3MgdG8gb2JqZWN0c1xuICAgICAgaWYgKHR5cGVvZiBpdGVtc1swXSA9PSAnc3RyaW5nJykge1xuICAgICAgICBpdGVtcyA9IGl0ZW1zLm1hcCgobGFiZWwpID0+IHtcbiAgICAgICAgICBsZXQgb2JqZWN0ID0ge307XG4gICAgICAgICAgb2JqZWN0W2NvbmZpZy5sYWJlbEtleV0gPSBsYWJlbDtcbiAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChjb25maWcubGFiZWxLZXkpIHtcbiAgICAgICAgLy8gcmVtb3ZlIGl0ZW1zIHdpdGhvdXQgYW4gbGFiZWxLZXkgKGFzIGl0J3MgcmVxdWlyZWQgdG8gZmlsdGVyIHRoZSBsaXN0KVxuICAgICAgICBpdGVtcyA9IGl0ZW1zLmZpbHRlcihlID0+IGVbY29uZmlnLmxhYmVsS2V5XSk7XG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVTb3J0KSB7XG4gICAgICAgICAgaXRlbXMuc29ydCgoYSwgYikgPT4gYVtjb25maWcubGFiZWxLZXldLmxvY2FsZUNvbXBhcmUoYltjb25maWcubGFiZWxLZXldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uZmlnLml0ZW1zID0gaXRlbXM7XG5cbiAgICAvLyBhZGQgdGhlIGNvbmZpZ1xuICAgIHRoaXMudHJpZ2dlckNoYXJzW2NvbmZpZy50cmlnZ2VyQ2hhcl0gPSBjb25maWc7XG5cbiAgICAvLyBmb3IgYXN5bmMgdXBkYXRlIHdoaWxlIG1lbnUvc2VhcmNoIGlzIGFjdGl2ZVxuICAgIGlmICh0aGlzLmFjdGl2ZUNvbmZpZyAmJiB0aGlzLmFjdGl2ZUNvbmZpZy50cmlnZ2VyQ2hhciA9PSBjb25maWcudHJpZ2dlckNoYXIpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ29uZmlnID0gY29uZmlnO1xuICAgICAgdGhpcy51cGRhdGVTZWFyY2hMaXN0KCk7XG4gICAgfVxuICB9XG5cbiAgc2V0SWZyYW1lKGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQpIHtcbiAgICB0aGlzLmlmcmFtZSA9IGlmcmFtZTtcbiAgfVxuXG4gIHN0b3BFdmVudChldmVudDogYW55KSB7XG4gICAgLy9pZiAoZXZlbnQgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50KSB7IC8vIGRvZXMgbm90IHdvcmsgZm9yIGlmcmFtZVxuICAgIGlmICghZXZlbnQud2FzQ2xpY2spIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIGJsdXJIYW5kbGVyKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgdGhpcy5zdG9wU2VhcmNoKCk7XG4gIH1cblxuICBpbnB1dEhhbmRsZXIoZXZlbnQ6IGFueSwgbmF0aXZlRWxlbWVudDogSFRNTElucHV0RWxlbWVudCA9IHRoaXMuX2VsZW1lbnQubmF0aXZlRWxlbWVudCkge1xuICAgIGlmICh0aGlzLmxhc3RLZXlDb2RlID09PSBLRVlfQlVGRkVSRUQgJiYgZXZlbnQuZGF0YSkge1xuICAgICAgbGV0IGtleUNvZGUgPSBldmVudC5kYXRhLmNoYXJDb2RlQXQoMCk7XG4gICAgICB0aGlzLmtleUhhbmRsZXIoeyBrZXlDb2RlLCBpbnB1dEV2ZW50OiB0cnVlIH0sIG5hdGl2ZUVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEBwYXJhbSBuYXRpdmVFbGVtZW50IGlzIHRoZSBhbHRlcm5hdGl2ZSB0ZXh0IGVsZW1lbnQgaW4gYW4gaWZyYW1lIHNjZW5hcmlvXG4gIGtleUhhbmRsZXIoZXZlbnQ6IGFueSwgbmF0aXZlRWxlbWVudDogSFRNTElucHV0RWxlbWVudCA9IHRoaXMuX2VsZW1lbnQubmF0aXZlRWxlbWVudCkge1xuICAgIHRoaXMubGFzdEtleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuXG4gICAgaWYgKGV2ZW50LmlzQ29tcG9zaW5nIHx8IGV2ZW50LmtleUNvZGUgPT09IEtFWV9CVUZGRVJFRCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCB2YWw6IHN0cmluZyA9IGdldFZhbHVlKG5hdGl2ZUVsZW1lbnQpO1xuICAgIGxldCBwb3MgPSBnZXRDYXJldFBvc2l0aW9uKG5hdGl2ZUVsZW1lbnQsIHRoaXMuaWZyYW1lKTtcbiAgICBsZXQgY2hhclByZXNzZWQgPSBldmVudC5rZXk7XG4gICAgaWYgKCFjaGFyUHJlc3NlZCkge1xuICAgICAgbGV0IGNoYXJDb2RlID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcbiAgICAgIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgKGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDkwKSkge1xuICAgICAgICBjaGFyUHJlc3NlZCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUgKyAzMik7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGlmIChldmVudC5zaGlmdEtleSAmJiBjaGFyQ29kZSA9PT0gS0VZXzIpIHtcbiAgICAgIC8vICAgY2hhclByZXNzZWQgPSB0aGlzLmNvbmZpZy50cmlnZ2VyQ2hhcjtcbiAgICAgIC8vIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBUT0RPIChkbWFjZmFybGFuZSkgZml4IHRoaXMgZm9yIG5vbi1hbHBoYSBrZXlzXG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjIyMDE5Ni9ob3ctdG8tZGVjb2RlLWNoYXJhY3Rlci1wcmVzc2VkLWZyb20tanF1ZXJ5cy1rZXlkb3ducy1ldmVudC1oYW5kbGVyP2xxPTFcbiAgICAgICAgY2hhclByZXNzZWQgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSBLRVlfRU5URVIgJiYgZXZlbnQud2FzQ2xpY2sgJiYgcG9zIDwgdGhpcy5zdGFydFBvcykge1xuICAgICAgLy8gcHV0IGNhcmV0IGJhY2sgaW4gcG9zaXRpb24gcHJpb3IgdG8gY29udGVudGVkaXRhYmxlIG1lbnUgY2xpY2tcbiAgICAgIHBvcyA9IHRoaXMuc3RhcnROb2RlLmxlbmd0aDtcbiAgICAgIHNldENhcmV0UG9zaXRpb24odGhpcy5zdGFydE5vZGUsIHBvcywgdGhpcy5pZnJhbWUpO1xuICAgIH1cbiAgICAvL2NvbnNvbGUubG9nKFwia2V5SGFuZGxlclwiLCB0aGlzLnN0YXJ0UG9zLCBwb3MsIHZhbCwgY2hhclByZXNzZWQsIGV2ZW50KTtcblxuICAgIGxldCBjb25maWcgPSB0aGlzLnRyaWdnZXJDaGFyc1tjaGFyUHJlc3NlZF07XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5hY3RpdmVDb25maWcgPSBjb25maWc7XG4gICAgICB0aGlzLnN0YXJ0UG9zID0gZXZlbnQuaW5wdXRFdmVudCA/IHBvcyAtIDEgOiBwb3M7XG4gICAgICB0aGlzLnN0YXJ0Tm9kZSA9ICh0aGlzLmlmcmFtZSA/IHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cuZ2V0U2VsZWN0aW9uKCkgOiB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkpLmFuY2hvck5vZGU7XG4gICAgICB0aGlzLnNlYXJjaGluZyA9IHRydWU7XG4gICAgICB0aGlzLnNlYXJjaFN0cmluZyA9IG51bGw7XG4gICAgICB0aGlzLnNob3dTZWFyY2hMaXN0KG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy51cGRhdGVTZWFyY2hMaXN0KCk7XG5cbiAgICAgIGlmIChjb25maWcucmV0dXJuVHJpZ2dlcikge1xuICAgICAgICB0aGlzLnNlYXJjaFRlcm0uZW1pdChjb25maWcudHJpZ2dlckNoYXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLnN0YXJ0UG9zID49IDAgJiYgdGhpcy5zZWFyY2hpbmcpIHtcbiAgICAgIGlmIChwb3MgPD0gdGhpcy5zdGFydFBvcykge1xuICAgICAgICB0aGlzLnNlYXJjaExpc3QuaGlkZGVuID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8vIGlnbm9yZSBzaGlmdCB3aGVuIHByZXNzZWQgYWxvbmUsIGJ1dCBub3Qgd2hlbiB1c2VkIHdpdGggYW5vdGhlciBrZXlcbiAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgIT09IEtFWV9TSElGVCAmJlxuICAgICAgICAhZXZlbnQubWV0YUtleSAmJlxuICAgICAgICAhZXZlbnQuYWx0S2V5ICYmXG4gICAgICAgICFldmVudC5jdHJsS2V5ICYmXG4gICAgICAgIHBvcyA+IHRoaXMuc3RhcnRQb3NcbiAgICAgICkge1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlQ29uZmlnLmFsbG93U3BhY2UgJiYgZXZlbnQua2V5Q29kZSA9PT0gS0VZX1NQQUNFKSB7XG4gICAgICAgICAgdGhpcy5zdGFydFBvcyA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IEtFWV9CQUNLU1BBQ0UgJiYgcG9zID4gMCkge1xuICAgICAgICAgIHBvcy0tO1xuICAgICAgICAgIGlmIChwb3MgPT0gdGhpcy5zdGFydFBvcykge1xuICAgICAgICAgICAgdGhpcy5zdG9wU2VhcmNoKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc2VhcmNoTGlzdC5oaWRkZW4pIHtcbiAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gS0VZX1RBQiB8fCBldmVudC5rZXlDb2RlID09PSBLRVlfRU5URVIpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcFNlYXJjaCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghdGhpcy5zZWFyY2hMaXN0LmhpZGRlbikge1xuICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSBLRVlfVEFCIHx8IGV2ZW50LmtleUNvZGUgPT09IEtFWV9FTlRFUikge1xuICAgICAgICAgICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgLy8gZW1pdCB0aGUgc2VsZWN0ZWQgbGlzdCBpdGVtXG4gICAgICAgICAgICB0aGlzLml0ZW1TZWxlY3RlZC5lbWl0KHRoaXMuc2VhcmNoTGlzdC5hY3RpdmVJdGVtKTtcbiAgICAgICAgICAgIC8vIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIGZvcm1hdCB0aGUgc2VsZWN0ZWQgaXRlbSBiZWZvcmUgaW5zZXJ0aW5nIHRoZSB0ZXh0XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5hY3RpdmVDb25maWcubWVudGlvblNlbGVjdCh0aGlzLnNlYXJjaExpc3QuYWN0aXZlSXRlbSwgdGhpcy5hY3RpdmVDb25maWcudHJpZ2dlckNoYXIpO1xuICAgICAgICAgICAgLy8gdmFsdWUgaXMgaW5zZXJ0ZWQgd2l0aG91dCBhIHRyYWlsaW5nIHNwYWNlIGZvciBjb25zaXN0ZW5jeVxuICAgICAgICAgICAgLy8gYmV0d2VlbiBlbGVtZW50IHR5cGVzIChkaXYgYW5kIGlmcmFtZSBkbyBub3QgcHJlc2VydmUgdGhlIHNwYWNlKVxuICAgICAgICAgICAgaW5zZXJ0VmFsdWUobmF0aXZlRWxlbWVudCwgdGhpcy5zdGFydFBvcywgcG9zLCB0ZXh0LCB0aGlzLmlmcmFtZSk7XG4gICAgICAgICAgICAvLyBmaXJlIGlucHV0IGV2ZW50IHNvIGFuZ3VsYXIgYmluZGluZ3MgYXJlIHVwZGF0ZWRcbiAgICAgICAgICAgIGlmIChcImNyZWF0ZUV2ZW50XCIgaW4gZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgbGV0IGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiSFRNTEV2ZW50c1wiKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaWZyYW1lKSB7XG4gICAgICAgICAgICAgICAgLy8gYSAnY2hhbmdlJyBldmVudCBpcyByZXF1aXJlZCB0byB0cmlnZ2VyIHRpbnltY2UgdXBkYXRlc1xuICAgICAgICAgICAgICAgIGV2dC5pbml0RXZlbnQoXCJjaGFuZ2VcIiwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2dC5pbml0RXZlbnQoXCJpbnB1dFwiLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gdGhpcyBzZWVtcyBiYWNrd2FyZHMsIGJ1dCBmaXJlIHRoZSBldmVudCBmcm9tIHRoaXMgZWxlbWVudHMgbmF0aXZlRWxlbWVudCAobm90IHRoZVxuICAgICAgICAgICAgICAvLyBvbmUgcHJvdmlkZWQgdGhhdCBtYXkgYmUgaW4gYW4gaWZyYW1lLCBhcyBpdCB3b24ndCBiZSBwcm9wb2dhdGUpXG4gICAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQubmF0aXZlRWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXJ0UG9zID0gLTE7XG4gICAgICAgICAgICB0aGlzLnN0b3BTZWFyY2goKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gS0VZX0VTQ0FQRSkge1xuICAgICAgICAgICAgdGhpcy5zdG9wRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgdGhpcy5zdG9wU2VhcmNoKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IEtFWV9ET1dOKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3BFdmVudChldmVudCk7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaExpc3QuYWN0aXZhdGVOZXh0SXRlbSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSBLRVlfVVApIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoTGlzdC5hY3RpdmF0ZVByZXZpb3VzSXRlbSgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGFyUHJlc3NlZC5sZW5ndGghPTEgJiYgZXZlbnQua2V5Q29kZSE9S0VZX0JBQ0tTUEFDRSkge1xuICAgICAgICAgIHRoaXMuc3RvcEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWFyY2hpbmcpIHtcbiAgICAgICAgICBsZXQgbWVudGlvbiA9IHZhbC5zdWJzdHJpbmcodGhpcy5zdGFydFBvcyArIDEsIHBvcyk7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgIT09IEtFWV9CQUNLU1BBQ0UgJiYgIWV2ZW50LmlucHV0RXZlbnQpIHtcbiAgICAgICAgICAgIG1lbnRpb24gKz0gY2hhclByZXNzZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc2VhcmNoU3RyaW5nID0gbWVudGlvbjtcbiAgICAgICAgICBpZiAodGhpcy5hY3RpdmVDb25maWcucmV0dXJuVHJpZ2dlcikge1xuICAgICAgICAgICAgY29uc3QgdHJpZ2dlckNoYXIgPSAodGhpcy5zZWFyY2hTdHJpbmcgfHwgZXZlbnQua2V5Q29kZSA9PT0gS0VZX0JBQ0tTUEFDRSkgPyB2YWwuc3Vic3RyaW5nKHRoaXMuc3RhcnRQb3MsIHRoaXMuc3RhcnRQb3MgKyAxKSA6ICcnO1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUZXJtLmVtaXQodHJpZ2dlckNoYXIgKyB0aGlzLnNlYXJjaFN0cmluZyk7XG4gICAgICAgICAgfSBcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVGVybS5lbWl0KHRoaXMuc2VhcmNoU3RyaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cGRhdGVTZWFyY2hMaXN0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBleHBvc2VkIGZvciBleHRlcm5hbCBjYWxscyB0byBvcGVuIHRoZSBtZW50aW9uIGxpc3QsIGUuZy4gYnkgY2xpY2tpbmcgYSBidXR0b25cbiAgcHVibGljIHN0YXJ0U2VhcmNoKHRyaWdnZXJDaGFyPzogc3RyaW5nLCBuYXRpdmVFbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50ID0gdGhpcy5fZWxlbWVudC5uYXRpdmVFbGVtZW50KSB7XG4gICAgdHJpZ2dlckNoYXIgPSB0cmlnZ2VyQ2hhciB8fCB0aGlzLm1lbnRpb25Db25maWcudHJpZ2dlckNoYXIgfHwgdGhpcy5ERUZBVUxUX0NPTkZJRy50cmlnZ2VyQ2hhcjtcbiAgICBjb25zdCBwb3MgPSBnZXRDYXJldFBvc2l0aW9uKG5hdGl2ZUVsZW1lbnQsIHRoaXMuaWZyYW1lKTtcbiAgICBpbnNlcnRWYWx1ZShuYXRpdmVFbGVtZW50LCBwb3MsIHBvcywgdHJpZ2dlckNoYXIsIHRoaXMuaWZyYW1lKTtcbiAgICB0aGlzLmtleUhhbmRsZXIoeyBrZXk6IHRyaWdnZXJDaGFyLCBpbnB1dEV2ZW50OiB0cnVlIH0sIG5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cbiAgc3RvcFNlYXJjaCgpIHtcbiAgICBpZiAodGhpcy5zZWFyY2hMaXN0ICYmICF0aGlzLnNlYXJjaExpc3QuaGlkZGVuKSB7XG4gICAgICB0aGlzLnNlYXJjaExpc3QuaGlkZGVuID0gdHJ1ZTtcbiAgICAgIHRoaXMuY2xvc2VkLmVtaXQoKTtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVDb25maWcgPSBudWxsO1xuICAgIHRoaXMuc2VhcmNoaW5nID0gZmFsc2U7XG4gIH1cblxuICB1cGRhdGVTZWFyY2hMaXN0KCkge1xuICAgIGxldCBtYXRjaGVzOiBhbnlbXSA9IFtdO1xuICAgIGlmICh0aGlzLmFjdGl2ZUNvbmZpZyAmJiB0aGlzLmFjdGl2ZUNvbmZpZy5pdGVtcykge1xuICAgICAgbGV0IG9iamVjdHMgPSB0aGlzLmFjdGl2ZUNvbmZpZy5pdGVtcztcbiAgICAgIC8vIGRpc2FibGluZyB0aGUgc2VhcmNoIHJlbGllcyBvbiB0aGUgYXN5bmMgb3BlcmF0aW9uIHRvIGRvIHRoZSBmaWx0ZXJpbmdcbiAgICAgIGlmICghdGhpcy5hY3RpdmVDb25maWcuZGlzYWJsZVNlYXJjaCAmJiB0aGlzLnNlYXJjaFN0cmluZyAmJiB0aGlzLmFjdGl2ZUNvbmZpZy5sYWJlbEtleSkge1xuICAgICAgICBpZiAodGhpcy5hY3RpdmVDb25maWcubWVudGlvbkZpbHRlcikge1xuICAgICAgICAgIG9iamVjdHMgPSB0aGlzLmFjdGl2ZUNvbmZpZy5tZW50aW9uRmlsdGVyKHRoaXMuc2VhcmNoU3RyaW5nLCBvYmplY3RzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbWF0Y2hlcyA9IG9iamVjdHM7XG4gICAgICBpZiAodGhpcy5hY3RpdmVDb25maWcubWF4SXRlbXMgPiAwKSB7XG4gICAgICAgIG1hdGNoZXMgPSBtYXRjaGVzLnNsaWNlKDAsIHRoaXMuYWN0aXZlQ29uZmlnLm1heEl0ZW1zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gdXBkYXRlIHRoZSBzZWFyY2ggbGlzdFxuICAgIGlmICh0aGlzLnNlYXJjaExpc3QpIHtcbiAgICAgIHRoaXMuc2VhcmNoTGlzdC5pdGVtcyA9IG1hdGNoZXM7XG4gICAgICB0aGlzLnNlYXJjaExpc3QuaGlkZGVuID0gbWF0Y2hlcy5sZW5ndGggPT0gMDtcbiAgICB9XG4gIH1cblxuICBzaG93U2VhcmNoTGlzdChuYXRpdmVFbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgdGhpcy5vcGVuZWQuZW1pdCgpO1xuXG4gICAgaWYgKHRoaXMuc2VhcmNoTGlzdCA9PSBudWxsKSB7XG4gICAgICBsZXQgY29tcG9uZW50RmFjdG9yeSA9IHRoaXMuX2NvbXBvbmVudFJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KE1lbnRpb25MaXN0Q29tcG9uZW50KTtcbiAgICAgIGxldCBjb21wb25lbnRSZWYgPSB0aGlzLl92aWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChjb21wb25lbnRGYWN0b3J5KTtcbiAgICAgIHRoaXMuc2VhcmNoTGlzdCA9IGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcbiAgICAgIHRoaXMuc2VhcmNoTGlzdC5pdGVtVGVtcGxhdGUgPSB0aGlzLm1lbnRpb25MaXN0VGVtcGxhdGU7XG4gICAgICBjb21wb25lbnRSZWYuaW5zdGFuY2VbJ2l0ZW1DbGljayddLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIG5hdGl2ZUVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgbGV0IGZha2VLZXlkb3duID0geyBrZXk6ICdFbnRlcicsIGtleUNvZGU6IEtFWV9FTlRFUiwgd2FzQ2xpY2s6IHRydWUgfTtcbiAgICAgICAgdGhpcy5rZXlIYW5kbGVyKGZha2VLZXlkb3duLCBuYXRpdmVFbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLnNlYXJjaExpc3QubGFiZWxLZXkgPSB0aGlzLmFjdGl2ZUNvbmZpZy5sYWJlbEtleTtcbiAgICB0aGlzLnNlYXJjaExpc3QuZHJvcFVwID0gdGhpcy5hY3RpdmVDb25maWcuZHJvcFVwO1xuICAgIHRoaXMuc2VhcmNoTGlzdC5zdHlsZU9mZiA9IHRoaXMubWVudGlvbkNvbmZpZy5kaXNhYmxlU3R5bGU7XG4gICAgdGhpcy5zZWFyY2hMaXN0LmFjdGl2ZUluZGV4ID0gMDtcbiAgICB0aGlzLnNlYXJjaExpc3QucG9zaXRpb24obmF0aXZlRWxlbWVudCwgdGhpcy5pZnJhbWUpO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5zZWFyY2hMaXN0LnJlc2V0KCkpO1xuICB9XG59XG4iXX0=