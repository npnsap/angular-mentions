import { Component, Output, EventEmitter, ViewChild, Input } from '@angular/core';
import { isInputOrTextAreaElement, getContentEditableCaretCoords } from './mention-utils';
import { getCaretCoordinates } from './caret-coords';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
const _c0 = ["list"];
const _c1 = ["defaultItemTemplate"];
function MentionListComponent_ng_template_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵtext(0);
} if (rf & 2) {
    const item_r4 = ctx.item;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵtextInterpolate1(" ", item_r4[ctx_r1.labelKey], " ");
} }
function MentionListComponent_li_4_ng_template_2_Template(rf, ctx) { }
const _c2 = function (a0) { return { "item": a0 }; };
function MentionListComponent_li_4_Template(rf, ctx) { if (rf & 1) {
    const _r9 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "li")(1, "a", 4);
    i0.ɵɵlistener("mousedown", function MentionListComponent_li_4_Template_a_mousedown_1_listener($event) { const restoredCtx = i0.ɵɵrestoreView(_r9); const i_r6 = restoredCtx.index; const ctx_r8 = i0.ɵɵnextContext(); ctx_r8.activeIndex = i_r6; ctx_r8.itemClick.emit(); return i0.ɵɵresetView($event.preventDefault()); });
    i0.ɵɵtemplate(2, MentionListComponent_li_4_ng_template_2_Template, 0, 0, "ng-template", 5);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const item_r5 = ctx.$implicit;
    const i_r6 = ctx.index;
    const ctx_r3 = i0.ɵɵnextContext();
    i0.ɵɵclassProp("active", ctx_r3.activeIndex == i_r6)("mention-active", !ctx_r3.styleOff && ctx_r3.activeIndex == i_r6);
    i0.ɵɵadvance(1);
    i0.ɵɵclassProp("mention-item", !ctx_r3.styleOff);
    i0.ɵɵadvance(1);
    i0.ɵɵproperty("ngTemplateOutlet", ctx_r3.itemTemplate)("ngTemplateOutletContext", i0.ɵɵpureFunction1(8, _c2, item_r5));
} }
/**
 * Angular Mentions.
 * https://github.com/dmacfarlane/angular-mentions
 *
 * Copyright (c) 2016 Dan MacFarlane
 */
export class MentionListComponent {
    constructor(element) {
        this.element = element;
        this.labelKey = 'label';
        this.itemClick = new EventEmitter();
        this.items = [];
        this.activeIndex = 0;
        this.hidden = false;
        this.dropUp = false;
        this.styleOff = false;
        this.coords = { top: 0, left: 0 };
        this.offset = 0;
    }
    ngAfterContentChecked() {
        if (!this.itemTemplate) {
            this.itemTemplate = this.defaultItemTemplate;
        }
    }
    // lots of confusion here between relative coordinates and containers
    position(nativeParentElement, iframe = null) {
        if (isInputOrTextAreaElement(nativeParentElement)) {
            // parent elements need to have postition:relative for this to work correctly?
            this.coords = getCaretCoordinates(nativeParentElement, nativeParentElement.selectionStart, null);
            this.coords.top = nativeParentElement.offsetTop + this.coords.top - nativeParentElement.scrollTop;
            this.coords.left = nativeParentElement.offsetLeft + this.coords.left - nativeParentElement.scrollLeft;
            // getCretCoordinates() for text/input elements needs an additional offset to position the list correctly
            this.offset = this.getBlockCursorDimensions(nativeParentElement).height;
        }
        else if (iframe) {
            let context = { iframe: iframe, parent: iframe.offsetParent };
            this.coords = getContentEditableCaretCoords(context);
        }
        else {
            let doc = document.documentElement;
            let scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
            let scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            // bounding rectangles are relative to view, offsets are relative to container?
            let caretRelativeToView = getContentEditableCaretCoords({ iframe: iframe });
            let parentRelativeToContainer = nativeParentElement.getBoundingClientRect();
            this.coords.top = caretRelativeToView.top - parentRelativeToContainer.top + nativeParentElement.offsetTop - scrollTop;
            this.coords.left = caretRelativeToView.left - parentRelativeToContainer.left + nativeParentElement.offsetLeft - scrollLeft;
        }
        // set the default/inital position
        this.positionElement();
    }
    get activeItem() {
        return this.items[this.activeIndex];
    }
    activateNextItem() {
        // adjust scrollable-menu offset if the next item is out of view
        let listEl = this.list.nativeElement;
        let activeEl = listEl.getElementsByClassName('active').item(0);
        if (activeEl) {
            let nextLiEl = activeEl.nextSibling;
            if (nextLiEl && nextLiEl.nodeName == "LI") {
                let nextLiRect = nextLiEl.getBoundingClientRect();
                if (nextLiRect.bottom > listEl.getBoundingClientRect().bottom) {
                    listEl.scrollTop = nextLiEl.offsetTop + nextLiRect.height - listEl.clientHeight;
                }
            }
        }
        // select the next item
        this.activeIndex = Math.max(Math.min(this.activeIndex + 1, this.items.length - 1), 0);
    }
    activatePreviousItem() {
        // adjust the scrollable-menu offset if the previous item is out of view
        let listEl = this.list.nativeElement;
        let activeEl = listEl.getElementsByClassName('active').item(0);
        if (activeEl) {
            let prevLiEl = activeEl.previousSibling;
            if (prevLiEl && prevLiEl.nodeName == "LI") {
                let prevLiRect = prevLiEl.getBoundingClientRect();
                if (prevLiRect.top < listEl.getBoundingClientRect().top) {
                    listEl.scrollTop = prevLiEl.offsetTop;
                }
            }
        }
        // select the previous item
        this.activeIndex = Math.max(Math.min(this.activeIndex - 1, this.items.length - 1), 0);
    }
    // reset for a new mention search
    reset() {
        this.list.nativeElement.scrollTop = 0;
        this.checkBounds();
    }
    // final positioning is done after the list is shown (and the height and width are known)
    // ensure it's in the page bounds
    checkBounds() {
        let left = this.coords.left, top = this.coords.top, dropUp = this.dropUp;
        const bounds = this.list.nativeElement.getBoundingClientRect();
        // if off right of page, align right
        if (bounds.left + bounds.width > window.innerWidth) {
            left -= bounds.left + bounds.width - window.innerWidth + 10;
        }
        // if more than half off the bottom of the page, force dropUp
        // if ((bounds.top+bounds.height/2)>window.innerHeight) {
        //   dropUp = true;
        // }
        // if top is off page, disable dropUp
        if (bounds.top < 0) {
            dropUp = false;
        }
        // set the revised/final position
        this.positionElement(left, top, dropUp);
    }
    positionElement(left = this.coords.left, top = this.coords.top, dropUp = this.dropUp) {
        const el = this.element.nativeElement;
        top += dropUp ? 0 : this.offset; // top of list is next line
        el.className = dropUp ? 'dropup' : null;
        el.style.position = "absolute";
        el.style.left = left + 'px';
        el.style.top = top + 'px';
    }
    getBlockCursorDimensions(nativeParentElement) {
        const parentStyles = window.getComputedStyle(nativeParentElement);
        return {
            height: parseFloat(parentStyles.lineHeight),
            width: parseFloat(parentStyles.fontSize)
        };
    }
}
MentionListComponent.ɵfac = function MentionListComponent_Factory(t) { return new (t || MentionListComponent)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
MentionListComponent.ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MentionListComponent, selectors: [["mention-list"]], viewQuery: function MentionListComponent_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 7);
        i0.ɵɵviewQuery(_c1, 7);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.list = _t.first);
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.defaultItemTemplate = _t.first);
    } }, inputs: { labelKey: "labelKey", itemTemplate: "itemTemplate" }, outputs: { itemClick: "itemClick" }, decls: 5, vars: 6, consts: [["defaultItemTemplate", ""], [1, "dropdown-menu", "scrollable-menu", 3, "hidden"], ["list", ""], [3, "active", "mention-active", 4, "ngFor", "ngForOf"], [1, "dropdown-item", 3, "mousedown"], [3, "ngTemplateOutlet", "ngTemplateOutletContext"]], template: function MentionListComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵtemplate(0, MentionListComponent_ng_template_0_Template, 1, 1, "ng-template", null, 0, i0.ɵɵtemplateRefExtractor);
        i0.ɵɵelementStart(2, "ul", 1, 2);
        i0.ɵɵtemplate(4, MentionListComponent_li_4_Template, 3, 10, "li", 3);
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵadvance(2);
        i0.ɵɵclassProp("mention-menu", !ctx.styleOff)("mention-dropdown", !ctx.styleOff && ctx.dropUp);
        i0.ɵɵproperty("hidden", ctx.hidden);
        i0.ɵɵadvance(2);
        i0.ɵɵproperty("ngForOf", ctx.items);
    } }, dependencies: [i1.NgForOf, i1.NgTemplateOutlet], styles: [".mention-menu[_ngcontent-%COMP%]{position:absolute;top:100%;left:0;z-index:1000;display:none;float:left;min-width:11em;padding:.5em 0;margin:.125em 0 0;font-size:1em;color:#212529;text-align:left;list-style:none;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.15);border-radius:.25em}.mention-item[_ngcontent-%COMP%]{display:block;padding:.2em 1.5em;line-height:1.5em;clear:both;font-weight:400;color:#212529;text-align:inherit;white-space:nowrap;background-color:transparent;border:0}.mention-active[_ngcontent-%COMP%] > a[_ngcontent-%COMP%]{color:#fff;text-decoration:none;background-color:#337ab7;outline:0}.scrollable-menu[_ngcontent-%COMP%]{display:block;height:auto;max-height:292px;overflow:auto}[hidden][_ngcontent-%COMP%]{display:none}.mention-dropdown[_ngcontent-%COMP%]{bottom:100%;top:auto;margin-bottom:2px}"] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MentionListComponent, [{
        type: Component,
        args: [{ selector: 'mention-list', template: `
    <ng-template #defaultItemTemplate let-item="item">
      {{item[labelKey]}}
    </ng-template>
    <ul #list [hidden]="hidden" class="dropdown-menu scrollable-menu"
      [class.mention-menu]="!styleOff" [class.mention-dropdown]="!styleOff && dropUp">
      <li *ngFor="let item of items; let i = index"
        [class.active]="activeIndex==i" [class.mention-active]="!styleOff && activeIndex==i">
        <a class="dropdown-item" [class.mention-item]="!styleOff"
          (mousedown)="activeIndex=i;itemClick.emit();$event.preventDefault()">
          <ng-template [ngTemplateOutlet]="itemTemplate" [ngTemplateOutletContext]="{'item':item}"></ng-template>
        </a>
      </li>
    </ul>
    `, styles: [".mention-menu{position:absolute;top:100%;left:0;z-index:1000;display:none;float:left;min-width:11em;padding:.5em 0;margin:.125em 0 0;font-size:1em;color:#212529;text-align:left;list-style:none;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.15);border-radius:.25em}.mention-item{display:block;padding:.2em 1.5em;line-height:1.5em;clear:both;font-weight:400;color:#212529;text-align:inherit;white-space:nowrap;background-color:transparent;border:0}.mention-active>a{color:#fff;text-decoration:none;background-color:#337ab7;outline:0}.scrollable-menu{display:block;height:auto;max-height:292px;overflow:auto}[hidden]{display:none}.mention-dropdown{bottom:100%;top:auto;margin-bottom:2px}\n"] }]
    }], function () { return [{ type: i0.ElementRef }]; }, { labelKey: [{
            type: Input
        }], itemTemplate: [{
            type: Input
        }], itemClick: [{
            type: Output
        }], list: [{
            type: ViewChild,
            args: ['list', { static: true }]
        }], defaultItemTemplate: [{
            type: ViewChild,
            args: ['defaultItemTemplate', { static: true }]
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudGlvbi1saXN0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItbWVudGlvbnMvc3JjL2xpYi9tZW50aW9uLWxpc3QuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQWMsTUFBTSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUM5RCxNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsd0JBQXdCLEVBQUUsNkJBQTZCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMxRixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7O0lBYS9DLFlBQ0Y7Ozs7SUFERSx5REFDRjs7Ozs7O0lBR0UsMEJBQ3VGLFdBQUE7SUFFbkYsaVBBQTJCLHVCQUFnQixTQUFDLGVBQUEsdUJBQXVCLENBQUEsSUFBQztJQUNwRSwwRkFBdUc7SUFDekcsaUJBQUksRUFBQTs7Ozs7SUFKSixvREFBK0Isa0VBQUE7SUFDTixlQUFnQztJQUFoQyxnREFBZ0M7SUFFMUMsZUFBaUM7SUFBakMsc0RBQWlDLGdFQUFBOztBQW5CeEQ7Ozs7O0dBS0c7QUFvQkgsTUFBTSxPQUFPLG9CQUFvQjtJQWEvQixZQUFvQixPQUFtQjtRQUFuQixZQUFPLEdBQVAsT0FBTyxDQUFZO1FBWjlCLGFBQVEsR0FBVyxPQUFPLENBQUM7UUFFMUIsY0FBUyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7UUFHekMsVUFBSyxHQUFHLEVBQUUsQ0FBQztRQUNYLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQ3hCLFdBQU0sR0FBWSxLQUFLLENBQUM7UUFDeEIsV0FBTSxHQUFZLEtBQUssQ0FBQztRQUN4QixhQUFRLEdBQVksS0FBSyxDQUFDO1FBQ2xCLFdBQU0sR0FBOEIsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLElBQUksRUFBQyxDQUFDLEVBQUMs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QUFTOzJCQUNFLGNBQWMsWUFFZDs7Ozs7Ozs7Ozs7Ozs7S0FjUDs2REFHTSxRQUFRO2tCQUFoQixLQUFLO1lBQ0csWUFBWTtrQkFBcEIsS0FBSztZQUNJLFNBQVM7a0JBQWxCLE1BQU07WUFDOEIsSUFBSTtrQkFBeEMsU0FBUzttQkFBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1lBQ2lCLG1CQUFtQjtrQkFBdEUsU0FBUzttQkFBQyxxQkFBcUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsIEVsZW1lbnRSZWYsIE91dHB1dCwgRXZlbnRFbWl0dGVyLCBWaWV3Q2hpbGQsIElucHV0LCBUZW1wbGF0ZVJlZiwgQWZ0ZXJDb250ZW50Q2hlY2tlZFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHsgaXNJbnB1dE9yVGV4dEFyZWFFbGVtZW50LCBnZXRDb250ZW50RWRpdGFibGVDYXJldENvb3JkcyB9IGZyb20gJy4vbWVudGlvbi11dGlscyc7XG5pbXBvcnQgeyBnZXRDYXJldENvb3JkaW5hdGVzIH0gZnJvbSAnLi9jYXJldC1jb29yZHMnO1xuXG4vKipcbiAqIEFuZ3VsYXIgTWVudGlvbnMuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vZG1hY2ZhcmxhbmUvYW5ndWxhci1tZW50aW9uc1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBEYW4gTWFjRmFybGFuZVxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdtZW50aW9uLWxpc3QnLFxuICBzdHlsZVVybHM6IFsnLi9tZW50aW9uLWxpc3QuY29tcG9uZW50LnNjc3MnXSxcbiAgdGVtcGxhdGU6IGBcbiAgICA8bmctdGVtcGxhdGUgI2RlZmF1bHRJdGVtVGVtcGxhdGUgbGV0LWl0ZW09XCJpdGVtXCI+XG4gICAgICB7e2l0ZW1bbGFiZWxLZXldfX1cbiAgICA8L25nLXRlbXBsYXRlPlxuICAgIDx1bCAjbGlzdCBbaGlkZGVuXT1cImhpZGRlblwiIGNsYXNzPVwiZHJvcGRvd24tbWVudSBzY3JvbGxhYmxlLW1lbnVcIlxuICAgICAgW2NsYXNzLm1lbnRpb24tbWVudV09XCIhc3R5bGVPZmZcIiBbY2xhc3MubWVudGlvbi1kcm9wZG93bl09XCIhc3R5bGVPZmYgJiYgZHJvcFVwXCI+XG4gICAgICA8bGkgKm5nRm9yPVwibGV0IGl0ZW0gb2YgaXRlbXM7IGxldCBpID0gaW5kZXhcIlxuICAgICAgICBbY2xhc3MuYWN0aXZlXT1cImFjdGl2ZUluZGV4PT1pXCIgW2NsYXNzLm1lbnRpb24tYWN0aXZlXT1cIiFzdHlsZU9mZiAmJiBhY3RpdmVJbmRleD09aVwiPlxuICAgICAgICA8YSBjbGFzcz1cImRyb3Bkb3duLWl0ZW1cIiBbY2xhc3MubWVudGlvbi1pdGVtXT1cIiFzdHlsZU9mZlwiXG4gICAgICAgICAgKG1vdXNlZG93bik9XCJhY3RpdmVJbmRleD1pO2l0ZW1DbGljay5lbWl0KCk7JGV2ZW50LnByZXZlbnREZWZhdWx0KClcIj5cbiAgICAgICAgICA8bmctdGVtcGxhdGUgW25nVGVtcGxhdGVPdXRsZXRdPVwiaXRlbVRlbXBsYXRlXCIgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInsnaXRlbSc6aXRlbX1cIj48L25nLXRlbXBsYXRlPlxuICAgICAgICA8L2E+XG4gICAgICA8L2xpPlxuICAgIDwvdWw+XG4gICAgYFxufSlcbmV4cG9ydCBjbGFzcyBNZW50aW9uTGlzdENvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyQ29udGVudENoZWNrZWQge1xuICBASW5wdXQoKSBsYWJlbEtleTogc3RyaW5nID0gJ2xhYmVsJztcbiAgQElucHV0KCkgaXRlbVRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAT3V0cHV0KCkgaXRlbUNsaWNrID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAVmlld0NoaWxkKCdsaXN0JywgeyBzdGF0aWM6IHRydWUgfSkgbGlzdDogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgnZGVmYXVsdEl0ZW1UZW1wbGF0ZScsIHsgc3RhdGljOiB0cnVlIH0pIGRlZmF1bHRJdGVtVGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG4gIGl0ZW1zID0gW107XG4gIGFjdGl2ZUluZGV4OiBudW1iZXIgPSAwO1xuICBoaWRkZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgZHJvcFVwOiBib29sZWFuID0gZmFsc2U7XG4gIHN0eWxlT2ZmOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgY29vcmRzOiB7dG9wOm51bWJlciwgbGVmdDpudW1iZXJ9ID0ge3RvcDowLCBsZWZ0OjB9O1xuICBwcml2YXRlIG9mZnNldDogbnVtYmVyID0gMDtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmKSB7fVxuXG4gIG5nQWZ0ZXJDb250ZW50Q2hlY2tlZCgpIHtcbiAgICBpZiAoIXRoaXMuaXRlbVRlbXBsYXRlKSB7XG4gICAgICB0aGlzLml0ZW1UZW1wbGF0ZSA9IHRoaXMuZGVmYXVsdEl0ZW1UZW1wbGF0ZTtcbiAgICB9XG4gIH1cblxuICAvLyBsb3RzIG9mIGNvbmZ1c2lvbiBoZXJlIGJldHdlZW4gcmVsYXRpdmUgY29vcmRpbmF0ZXMgYW5kIGNvbnRhaW5lcnNcbiAgcG9zaXRpb24obmF0aXZlUGFyZW50RWxlbWVudDogSFRNTElucHV0RWxlbWVudCwgaWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IG51bGwpIHtcbiAgICBpZiAoaXNJbnB1dE9yVGV4dEFyZWFFbGVtZW50KG5hdGl2ZVBhcmVudEVsZW1lbnQpKSB7XG4gICAgICAvLyBwYXJlbnQgZWxlbWVudHMgbmVlZCB0byBoYXZlIHBvc3RpdGlvbjpyZWxhdGl2ZSBmb3IgdGhpcyB0byB3b3JrIGNvcnJlY3RseT9cbiAgICAgIHRoaXMuY29vcmRzID0gZ2V0Q2FyZXRDb29yZGluYXRlcyhuYXRpdmVQYXJlbnRFbGVtZW50LCBuYXRpdmVQYXJlbnRFbGVtZW50LnNlbGVjdGlvblN0YXJ0LCBudWxsKTtcbiAgICAgIHRoaXMuY29vcmRzLnRvcCA9IG5hdGl2ZVBhcmVudEVsZW1lbnQub2Zmc2V0VG9wICsgdGhpcy5jb29yZHMudG9wIC0gbmF0aXZlUGFyZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICB0aGlzLmNvb3Jkcy5sZWZ0ID0gbmF0aXZlUGFyZW50RWxlbWVudC5vZmZzZXRMZWZ0ICsgdGhpcy5jb29yZHMubGVmdCAtIG5hdGl2ZVBhcmVudEVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICAgIC8vIGdldENyZXRDb29yZGluYXRlcygpIGZvciB0ZXh0L2lucHV0IGVsZW1lbnRzIG5lZWRzIGFuIGFkZGl0aW9uYWwgb2Zmc2V0IHRvIHBvc2l0aW9uIHRoZSBsaXN0IGNvcnJlY3RseVxuICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmdldEJsb2NrQ3Vyc29yRGltZW5zaW9ucyhuYXRpdmVQYXJlbnRFbGVtZW50KS5oZWlnaHQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlmcmFtZSkge1xuICAgICAgbGV0IGNvbnRleHQ6IHsgaWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCwgcGFyZW50OiBFbGVtZW50IH0gPSB7IGlmcmFtZTogaWZyYW1lLCBwYXJlbnQ6IGlmcmFtZS5vZmZzZXRQYXJlbnQgfTtcbiAgICAgIHRoaXMuY29vcmRzID0gZ2V0Q29udGVudEVkaXRhYmxlQ2FyZXRDb29yZHMoY29udGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgIGxldCBzY3JvbGxMZWZ0ID0gKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2Muc2Nyb2xsTGVmdCkgLSAoZG9jLmNsaWVudExlZnQgfHwgMCk7XG4gICAgICBsZXQgc2Nyb2xsVG9wID0gKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2Muc2Nyb2xsVG9wKSAtIChkb2MuY2xpZW50VG9wIHx8IDApO1xuICAgICAgLy8gYm91bmRpbmcgcmVjdGFuZ2xlcyBhcmUgcmVsYXRpdmUgdG8gdmlldywgb2Zmc2V0cyBhcmUgcmVsYXRpdmUgdG8gY29udGFpbmVyP1xuICAgICAgbGV0IGNhcmV0UmVsYXRpdmVUb1ZpZXcgPSBnZXRDb250ZW50RWRpdGFibGVDYXJldENvb3Jkcyh7IGlmcmFtZTogaWZyYW1lIH0pO1xuICAgICAgbGV0IHBhcmVudFJlbGF0aXZlVG9Db250YWluZXI6IENsaWVudFJlY3QgPSBuYXRpdmVQYXJlbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdGhpcy5jb29yZHMudG9wID0gY2FyZXRSZWxhdGl2ZVRvVmlldy50b3AgLSBwYXJlbnRSZWxhdGl2ZVRvQ29udGFpbmVyLnRvcCArIG5hdGl2ZVBhcmVudEVsZW1lbnQub2Zmc2V0VG9wIC0gc2Nyb2xsVG9wO1xuICAgICAgdGhpcy5jb29yZHMubGVmdCA9IGNhcmV0UmVsYXRpdmVUb1ZpZXcubGVmdCAtIHBhcmVudFJlbGF0aXZlVG9Db250YWluZXIubGVmdCArIG5hdGl2ZVBhcmVudEVsZW1lbnQub2Zmc2V0TGVmdCAtIHNjcm9sbExlZnQ7XG4gICAgfVxuICAgIC8vIHNldCB0aGUgZGVmYXVsdC9pbml0YWwgcG9zaXRpb25cbiAgICB0aGlzLnBvc2l0aW9uRWxlbWVudCgpO1xuICB9XG5cbiAgZ2V0IGFjdGl2ZUl0ZW0oKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNbdGhpcy5hY3RpdmVJbmRleF07XG4gIH1cblxuICBhY3RpdmF0ZU5leHRJdGVtKCkge1xuICAgIC8vIGFkanVzdCBzY3JvbGxhYmxlLW1lbnUgb2Zmc2V0IGlmIHRoZSBuZXh0IGl0ZW0gaXMgb3V0IG9mIHZpZXdcbiAgICBsZXQgbGlzdEVsOiBIVE1MRWxlbWVudCA9IHRoaXMubGlzdC5uYXRpdmVFbGVtZW50O1xuICAgIGxldCBhY3RpdmVFbCA9IGxpc3RFbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdhY3RpdmUnKS5pdGVtKDApO1xuICAgIGlmIChhY3RpdmVFbCkge1xuICAgICAgbGV0IG5leHRMaUVsOiBIVE1MRWxlbWVudCA9IDxIVE1MRWxlbWVudD4gYWN0aXZlRWwubmV4dFNpYmxpbmc7XG4gICAgICBpZiAobmV4dExpRWwgJiYgbmV4dExpRWwubm9kZU5hbWUgPT0gXCJMSVwiKSB7XG4gICAgICAgIGxldCBuZXh0TGlSZWN0OiBDbGllbnRSZWN0ID0gbmV4dExpRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmIChuZXh0TGlSZWN0LmJvdHRvbSA+IGxpc3RFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b20pIHtcbiAgICAgICAgICBsaXN0RWwuc2Nyb2xsVG9wID0gbmV4dExpRWwub2Zmc2V0VG9wICsgbmV4dExpUmVjdC5oZWlnaHQgLSBsaXN0RWwuY2xpZW50SGVpZ2h0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHNlbGVjdCB0aGUgbmV4dCBpdGVtXG4gICAgdGhpcy5hY3RpdmVJbmRleCA9IE1hdGgubWF4KE1hdGgubWluKHRoaXMuYWN0aXZlSW5kZXggKyAxLCB0aGlzLml0ZW1zLmxlbmd0aCAtIDEpLCAwKTtcbiAgfVxuXG4gIGFjdGl2YXRlUHJldmlvdXNJdGVtKCkge1xuICAgIC8vIGFkanVzdCB0aGUgc2Nyb2xsYWJsZS1tZW51IG9mZnNldCBpZiB0aGUgcHJldmlvdXMgaXRlbSBpcyBvdXQgb2Ygdmlld1xuICAgIGxldCBsaXN0RWw6IEhUTUxFbGVtZW50ID0gdGhpcy5saXN0Lm5hdGl2ZUVsZW1lbnQ7XG4gICAgbGV0IGFjdGl2ZUVsID0gbGlzdEVsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2FjdGl2ZScpLml0ZW0oMCk7XG4gICAgaWYgKGFjdGl2ZUVsKSB7XG4gICAgICBsZXQgcHJldkxpRWw6IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50PiBhY3RpdmVFbC5wcmV2aW91c1NpYmxpbmc7XG4gICAgICBpZiAocHJldkxpRWwgJiYgcHJldkxpRWwubm9kZU5hbWUgPT0gXCJMSVwiKSB7XG4gICAgICAgIGxldCBwcmV2TGlSZWN0OiBDbGllbnRSZWN0ID0gcHJldkxpRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGlmIChwcmV2TGlSZWN0LnRvcCA8IGxpc3RFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApIHtcbiAgICAgICAgICBsaXN0RWwuc2Nyb2xsVG9wID0gcHJldkxpRWwub2Zmc2V0VG9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHNlbGVjdCB0aGUgcHJldmlvdXMgaXRlbVxuICAgIHRoaXMuYWN0aXZlSW5kZXggPSBNYXRoLm1heChNYXRoLm1pbih0aGlzLmFjdGl2ZUluZGV4IC0gMSwgdGhpcy5pdGVtcy5sZW5ndGggLSAxKSwgMCk7XG4gIH1cblxuICAvLyByZXNldCBmb3IgYSBuZXcgbWVudGlvbiBzZWFyY2hcbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5saXN0Lm5hdGl2ZUVsZW1lbnQuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLmNoZWNrQm91bmRzKCk7XG4gIH1cblxuICAvLyBmaW5hbCBwb3NpdGlvbmluZyBpcyBkb25lIGFmdGVyIHRoZSBsaXN0IGlzIHNob3duIChhbmQgdGhlIGhlaWdodCBhbmQgd2lkdGggYXJlIGtub3duKVxuICAvLyBlbnN1cmUgaXQncyBpbiB0aGUgcGFnZSBib3VuZHNcbiAgcHJpdmF0ZSBjaGVja0JvdW5kcygpIHtcbiAgICBsZXQgbGVmdCA9IHRoaXMuY29vcmRzLmxlZnQsIHRvcCA9IHRoaXMuY29vcmRzLnRvcCwgZHJvcFVwID0gdGhpcy5kcm9wVXA7XG4gICAgY29uc3QgYm91bmRzOiBDbGllbnRSZWN0ID0gdGhpcy5saXN0Lm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgLy8gaWYgb2ZmIHJpZ2h0IG9mIHBhZ2UsIGFsaWduIHJpZ2h0XG4gICAgaWYgKGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoID4gd2luZG93LmlubmVyV2lkdGgpIHtcbiAgICAgIGxlZnQgLT0gYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSB3aW5kb3cuaW5uZXJXaWR0aCArIDEwO1xuICAgIH1cbiAgICAvLyBpZiBtb3JlIHRoYW4gaGFsZiBvZmYgdGhlIGJvdHRvbSBvZiB0aGUgcGFnZSwgZm9yY2UgZHJvcFVwXG4gICAgLy8gaWYgKChib3VuZHMudG9wK2JvdW5kcy5oZWlnaHQvMik+d2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgLy8gICBkcm9wVXAgPSB0cnVlO1xuICAgIC8vIH1cbiAgICAvLyBpZiB0b3AgaXMgb2ZmIHBhZ2UsIGRpc2FibGUgZHJvcFVwXG4gICAgaWYgKGJvdW5kcy50b3A8MCkge1xuICAgICAgZHJvcFVwID0gZmFsc2U7XG4gICAgfVxuICAgIC8vIHNldCB0aGUgcmV2aXNlZC9maW5hbCBwb3NpdGlvblxuICAgIHRoaXMucG9zaXRpb25FbGVtZW50KGxlZnQsIHRvcCwgZHJvcFVwKTtcbiAgfVxuXG4gIHByaXZhdGUgcG9zaXRpb25FbGVtZW50KGxlZnQ6bnVtYmVyPXRoaXMuY29vcmRzLmxlZnQsIHRvcDpudW1iZXI9dGhpcy5jb29yZHMudG9wLCBkcm9wVXA6Ym9vbGVhbj10aGlzLmRyb3BVcCkge1xuICAgIGNvbnN0IGVsOiBIVE1MRWxlbWVudCA9IHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50O1xuICAgIHRvcCArPSBkcm9wVXAgPyAwIDogdGhpcy5vZmZzZXQ7IC8vIHRvcCBvZiBsaXN0IGlzIG5leHQgbGluZVxuICAgIGVsLmNsYXNzTmFtZSA9IGRyb3BVcCA/ICdkcm9wdXAnIDogbnVsbDtcbiAgICBlbC5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICBlbC5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG4gICAgZWwuc3R5bGUudG9wID0gdG9wICsgJ3B4JztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QmxvY2tDdXJzb3JEaW1lbnNpb25zKG5hdGl2ZVBhcmVudEVsZW1lbnQ6IEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICBjb25zdCBwYXJlbnRTdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShuYXRpdmVQYXJlbnRFbGVtZW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBwYXJzZUZsb2F0KHBhcmVudFN0eWxlcy5saW5lSGVpZ2h0KSxcbiAgICAgIHdpZHRoOiBwYXJzZUZsb2F0KHBhcmVudFN0eWxlcy5mb250U2l6ZSlcbiAgICB9O1xuICB9XG59XG4iXX0=