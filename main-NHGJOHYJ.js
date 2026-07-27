import{$ as rt,$a as ni,A as O,Aa as Be,B as Oe,Ba as Ve,C as I,Ca as Ne,D as Yt,Da as je,E as v,Ea as We,F as Se,Fa as B,G as $,Ga as ct,H as kt,Ha as He,I as h,Ia as Qe,J as Xt,Ja as Ue,K,Ka as Ge,L as g,La as Ze,M as S,Ma as qe,N as _,Na as Ye,O as Pe,Oa as Xe,P as A,Pa as $e,Q as N,Qa as dt,R as J,Ra as Ke,S as tt,Sa as mt,Ta as Mt,Ua as P,V as De,Va as Je,W as Te,Wa as ti,X as j,Xa as ei,Y as c,Ya as ii,Z as d,Za as Ot,_ as ot,_a as W,a as Qt,aa as z,ab as oi,b as we,ba as Q,bb as ri,c as k,ca as C,cb as ai,d as xe,da as m,db as si,e as ft,ea as G,eb as li,f as xt,fa as at,fb as ci,g as X,ga as p,h as Ut,ha as u,i as ye,ia as Ct,j as Gt,ja as st,k as Zt,ka as w,l as ke,la as $t,m as yt,ma as f,n as L,na as Kt,o as Ce,oa as Jt,p as M,pa as F,q as H,qa as Ee,r as s,ra as te,s as et,sa as Re,t as it,ta as lt,u as nt,ua as Le,v as U,va as Ie,w as qt,wa as Ae,x as bt,xa as ze,y as T,z as Me,za as Fe}from"./chunk-J3K2UY4V.js";var di=new H("[ngxAppVersion] Options"),mi=e=>({provide:di,useValue:{version:e.version}}),hi=(()=>{class e{options=s(di);element=s(v);renderer=s(K);ngOnInit(){this.renderer.setAttribute(this.element.nativeElement,"app-version",this.options.version)}static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","ngxAppVersion",""]]})}return e})();var E=(e,r)=>({path:e==="overview"?"":e,loadComponent:()=>import("./chunk-ROIDGIXE.js").then(t=>t.Home),data:{slug:e},title:`${r} \xB7 QDB Finder`}),pi=[E("overview","Documentation"),E("installation","Installation"),E("searching","Searching and filters"),E("databases-and-settings","Databases and settings"),E("players","Players"),E("teams-and-leagues","Teams and leagues"),E("referees-and-stadiums","Referees and stadiums"),E("supported-data","Supported FIFA data"),E("development","Development"),E("database","Database generation"),E("licensing","Licensing"),E("releases","Releases"),{path:"**",redirectTo:""}];var ui={providers:[Me(),Ne(pi),ze(),mi({version:je.version})]};var gi=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({imports:[W]})}return e})();var _i=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({imports:[W]})}return e})();var tn=["*"],en=`.mdc-list {
  margin: 0;
  padding: 8px 0;
  list-style-type: none;
}
.mdc-list:focus {
  outline: none;
}

.mdc-list-item {
  display: flex;
  position: relative;
  justify-content: flex-start;
  overflow: hidden;
  padding: 0;
  align-items: stretch;
  cursor: pointer;
  padding-left: 16px;
  padding-right: 16px;
  background-color: var(--mat-list-list-item-container-color, transparent);
  border-radius: var(--mat-list-list-item-container-shape, var(--mat-sys-corner-none));
}
.mdc-list-item.mdc-list-item--selected {
  background-color: var(--mat-list-list-item-selected-container-color);
}
.mdc-list-item:focus {
  outline: 0;
}
.mdc-list-item.mdc-list-item--disabled {
  cursor: auto;
}
.mdc-list-item.mdc-list-item--with-one-line {
  height: var(--mat-list-list-item-one-line-container-height, 48px);
}
.mdc-list-item.mdc-list-item--with-one-line .mdc-list-item__start {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-one-line .mdc-list-item__end {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-two-lines {
  height: var(--mat-list-list-item-two-line-container-height, 64px);
}
.mdc-list-item.mdc-list-item--with-two-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--with-two-lines .mdc-list-item__end {
  align-self: center;
  margin-top: 0;
}
.mdc-list-item.mdc-list-item--with-three-lines {
  height: var(--mat-list-list-item-three-line-container-height, 88px);
}
.mdc-list-item.mdc-list-item--with-three-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--with-three-lines .mdc-list-item__end {
  align-self: flex-start;
  margin-top: 16px;
}
.mdc-list-item.mdc-list-item--selected::before, .mdc-list-item.mdc-list-item--selected:focus::before, .mdc-list-item:not(.mdc-list-item--selected):focus::before {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  content: "";
  pointer-events: none;
}

a.mdc-list-item {
  color: inherit;
  text-decoration: none;
}

.mdc-list-item__start {
  fill: currentColor;
  flex-shrink: 0;
  pointer-events: none;
}
.mdc-list-item--with-leading-icon .mdc-list-item__start {
  color: var(--mat-list-list-item-leading-icon-color, var(--mat-sys-on-surface-variant));
  width: var(--mat-list-list-item-leading-icon-size, 24px);
  height: var(--mat-list-list-item-leading-icon-size, 24px);
  margin-left: 16px;
  margin-right: 32px;
}
[dir=rtl] .mdc-list-item--with-leading-icon .mdc-list-item__start {
  margin-left: 32px;
  margin-right: 16px;
}
.mdc-list-item--with-leading-icon:hover .mdc-list-item__start {
  color: var(--mat-list-list-item-hover-leading-icon-color);
}
.mdc-list-item--with-leading-avatar .mdc-list-item__start {
  width: var(--mat-list-list-item-leading-avatar-size, 40px);
  height: var(--mat-list-list-item-leading-avatar-size, 40px);
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 50%;
}
.mdc-list-item--with-leading-avatar .mdc-list-item__start, [dir=rtl] .mdc-list-item--with-leading-avatar .mdc-list-item__start {
  margin-left: 16px;
  margin-right: 16px;
  border-radius: 50%;
}

.mdc-list-item__end {
  flex-shrink: 0;
  pointer-events: none;
}
.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  font-family: var(--mat-list-list-item-trailing-supporting-text-font, var(--mat-sys-label-small-font));
  line-height: var(--mat-list-list-item-trailing-supporting-text-line-height, var(--mat-sys-label-small-line-height));
  font-size: var(--mat-list-list-item-trailing-supporting-text-size, var(--mat-sys-label-small-size));
  font-weight: var(--mat-list-list-item-trailing-supporting-text-weight, var(--mat-sys-label-small-weight));
  letter-spacing: var(--mat-list-list-item-trailing-supporting-text-tracking, var(--mat-sys-label-small-tracking));
}
.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--mat-list-list-item-trailing-icon-color, var(--mat-sys-on-surface-variant));
  width: var(--mat-list-list-item-trailing-icon-size, 24px);
  height: var(--mat-list-list-item-trailing-icon-size, 24px);
}
.mdc-list-item--with-trailing-icon:hover .mdc-list-item__end {
  color: var(--mat-list-list-item-hover-trailing-icon-color);
}
.mdc-list-item.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  color: var(--mat-list-list-item-trailing-supporting-text-color, var(--mat-sys-on-surface-variant));
}
.mdc-list-item--selected.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--mat-list-list-item-selected-trailing-icon-color, var(--mat-sys-primary));
}

.mdc-list-item__content {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  align-self: center;
  flex: 1;
  pointer-events: none;
}
.mdc-list-item--with-two-lines .mdc-list-item__content, .mdc-list-item--with-three-lines .mdc-list-item__content {
  align-self: stretch;
}

.mdc-list-item__primary-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: var(--mat-list-list-item-label-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-list-list-item-label-text-font, var(--mat-sys-body-large-font));
  line-height: var(--mat-list-list-item-label-text-line-height, var(--mat-sys-body-large-line-height));
  font-size: var(--mat-list-list-item-label-text-size, var(--mat-sys-body-large-size));
  font-weight: var(--mat-list-list-item-label-text-weight, var(--mat-sys-body-large-weight));
  letter-spacing: var(--mat-list-list-item-label-text-tracking, var(--mat-sys-body-large-tracking));
}
.mdc-list-item:hover .mdc-list-item__primary-text {
  color: var(--mat-list-list-item-hover-label-text-color, var(--mat-sys-on-surface));
}
.mdc-list-item:focus .mdc-list-item__primary-text {
  color: var(--mat-list-list-item-focus-label-text-color, var(--mat-sys-on-surface));
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text, .mdc-list-item--with-three-lines .mdc-list-item__primary-text {
  display: block;
  margin-top: 0;
  line-height: normal;
  margin-bottom: -20px;
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before, .mdc-list-item--with-three-lines .mdc-list-item__primary-text::before {
  display: inline-block;
  width: 0;
  height: 28px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after, .mdc-list-item--with-three-lines .mdc-list-item__primary-text::after {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: -20px;
}

.mdc-list-item__secondary-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: block;
  margin-top: 0;
  color: var(--mat-list-list-item-supporting-text-color, var(--mat-sys-on-surface-variant));
  font-family: var(--mat-list-list-item-supporting-text-font, var(--mat-sys-body-medium-font));
  line-height: var(--mat-list-list-item-supporting-text-line-height, var(--mat-sys-body-medium-line-height));
  font-size: var(--mat-list-list-item-supporting-text-size, var(--mat-sys-body-medium-size));
  font-weight: var(--mat-list-list-item-supporting-text-weight, var(--mat-sys-body-medium-weight));
  letter-spacing: var(--mat-list-list-item-supporting-text-tracking, var(--mat-sys-body-medium-tracking));
}
.mdc-list-item__secondary-text::before {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-three-lines .mdc-list-item__secondary-text {
  white-space: normal;
  line-height: 20px;
}
.mdc-list-item--with-overline .mdc-list-item__secondary-text {
  white-space: nowrap;
  line-height: auto;
}

.mdc-list-item--with-leading-radio.mdc-list-item,
.mdc-list-item--with-leading-checkbox.mdc-list-item,
.mdc-list-item--with-leading-icon.mdc-list-item,
.mdc-list-item--with-leading-avatar.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
[dir=rtl] .mdc-list-item--with-leading-radio.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-checkbox.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-icon.mdc-list-item,
[dir=rtl] .mdc-list-item--with-leading-avatar.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text {
  display: block;
  margin-top: 0;
  line-height: normal;
  margin-bottom: -20px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text::before {
  display: inline-block;
  width: 0;
  height: 32px;
  content: "";
  vertical-align: 0;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines .mdc-list-item__primary-text::after {
  display: inline-block;
  width: 0;
  height: 20px;
  content: "";
  vertical-align: -20px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  display: block;
  margin-top: 0;
  line-height: normal;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-icon.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before,
.mdc-list-item--with-leading-avatar.mdc-list-item--with-two-lines.mdc-list-item--with-trailing-meta .mdc-list-item__end::before {
  display: inline-block;
  width: 0;
  height: 32px;
  content: "";
  vertical-align: 0;
}

.mdc-list-item--with-trailing-icon.mdc-list-item, [dir=rtl] .mdc-list-item--with-trailing-icon.mdc-list-item {
  padding-left: 0;
  padding-right: 0;
}
.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  margin-left: 16px;
  margin-right: 16px;
}

.mdc-list-item--with-trailing-meta.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-meta.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
.mdc-list-item--with-trailing-meta .mdc-list-item__end {
  -webkit-user-select: none;
  user-select: none;
  margin-left: 28px;
  margin-right: 16px;
}
[dir=rtl] .mdc-list-item--with-trailing-meta .mdc-list-item__end {
  margin-left: 16px;
  margin-right: 28px;
}
.mdc-list-item--with-trailing-meta.mdc-list-item--with-three-lines .mdc-list-item__end, .mdc-list-item--with-trailing-meta.mdc-list-item--with-two-lines .mdc-list-item__end {
  display: block;
  line-height: normal;
  align-self: flex-start;
  margin-top: 0;
}
.mdc-list-item--with-trailing-meta.mdc-list-item--with-three-lines .mdc-list-item__end::before, .mdc-list-item--with-trailing-meta.mdc-list-item--with-two-lines .mdc-list-item__end::before {
  display: inline-block;
  width: 0;
  height: 28px;
  content: "";
  vertical-align: 0;
}

.mdc-list-item--with-leading-radio .mdc-list-item__start,
.mdc-list-item--with-leading-checkbox .mdc-list-item__start {
  margin-left: 8px;
  margin-right: 24px;
}
[dir=rtl] .mdc-list-item--with-leading-radio .mdc-list-item__start,
[dir=rtl] .mdc-list-item--with-leading-checkbox .mdc-list-item__start {
  margin-left: 24px;
  margin-right: 8px;
}
.mdc-list-item--with-leading-radio.mdc-list-item--with-two-lines .mdc-list-item__start,
.mdc-list-item--with-leading-checkbox.mdc-list-item--with-two-lines .mdc-list-item__start {
  align-self: flex-start;
  margin-top: 8px;
}

.mdc-list-item--with-trailing-radio.mdc-list-item,
.mdc-list-item--with-trailing-checkbox.mdc-list-item {
  padding-left: 16px;
  padding-right: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item {
  padding-left: 0;
  padding-right: 16px;
}
.mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-icon, .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-avatar,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-icon,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-avatar {
  padding-left: 0;
}
[dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-icon, [dir=rtl] .mdc-list-item--with-trailing-radio.mdc-list-item--with-leading-avatar,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-icon,
[dir=rtl] .mdc-list-item--with-trailing-checkbox.mdc-list-item--with-leading-avatar {
  padding-right: 0;
}
.mdc-list-item--with-trailing-radio .mdc-list-item__end,
.mdc-list-item--with-trailing-checkbox .mdc-list-item__end {
  margin-left: 24px;
  margin-right: 8px;
}
[dir=rtl] .mdc-list-item--with-trailing-radio .mdc-list-item__end,
[dir=rtl] .mdc-list-item--with-trailing-checkbox .mdc-list-item__end {
  margin-left: 8px;
  margin-right: 24px;
}
.mdc-list-item--with-trailing-radio.mdc-list-item--with-three-lines .mdc-list-item__end,
.mdc-list-item--with-trailing-checkbox.mdc-list-item--with-three-lines .mdc-list-item__end {
  align-self: flex-start;
  margin-top: 8px;
}

.mdc-list-group__subheader {
  margin: 0.75rem 16px;
}

.mdc-list-item--disabled .mdc-list-item__start,
.mdc-list-item--disabled .mdc-list-item__content,
.mdc-list-item--disabled .mdc-list-item__end {
  opacity: 1;
}
.mdc-list-item--disabled .mdc-list-item__primary-text,
.mdc-list-item--disabled .mdc-list-item__secondary-text {
  opacity: var(--mat-list-list-item-disabled-label-text-opacity, 0.3);
}
.mdc-list-item--disabled.mdc-list-item--with-leading-icon .mdc-list-item__start {
  color: var(--mat-list-list-item-disabled-leading-icon-color, var(--mat-sys-on-surface));
  opacity: var(--mat-list-list-item-disabled-leading-icon-opacity, 0.38);
}
.mdc-list-item--disabled.mdc-list-item--with-trailing-icon .mdc-list-item__end {
  color: var(--mat-list-list-item-disabled-trailing-icon-color, var(--mat-sys-on-surface));
  opacity: var(--mat-list-list-item-disabled-trailing-icon-opacity, 0.38);
}

.mat-mdc-list-item.mat-mdc-list-item-both-leading-and-trailing, [dir=rtl] .mat-mdc-list-item.mat-mdc-list-item-both-leading-and-trailing {
  padding-left: 0;
  padding-right: 0;
}

.mdc-list-item.mdc-list-item--disabled .mdc-list-item__primary-text {
  color: var(--mat-list-list-item-disabled-label-text-color, var(--mat-sys-on-surface));
}

.mdc-list-item:hover::before {
  background-color: var(--mat-list-list-item-hover-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-list-list-item-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
}

.mdc-list-item.mdc-list-item--disabled::before {
  background-color: var(--mat-list-list-item-disabled-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-list-list-item-disabled-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
}

.mdc-list-item:focus::before {
  background-color: var(--mat-list-list-item-focus-state-layer-color, var(--mat-sys-on-surface));
  opacity: var(--mat-list-list-item-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
}

.mdc-list-item--disabled .mdc-radio,
.mdc-list-item--disabled .mdc-checkbox {
  opacity: var(--mat-list-list-item-disabled-label-text-opacity, 0.3);
}

.mdc-list-item--with-leading-avatar .mat-mdc-list-item-avatar {
  border-radius: var(--mat-list-list-item-leading-avatar-shape, var(--mat-sys-corner-full));
  background-color: var(--mat-list-list-item-leading-avatar-color, var(--mat-sys-primary-container));
}

.mat-mdc-list-item-icon {
  font-size: var(--mat-list-list-item-leading-icon-size, 24px);
}

@media (forced-colors: active) {
  a.mdc-list-item--activated::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 10px;
    height: 0;
    border-bottom: solid 10px;
    border-radius: 10px;
  }
  a.mdc-list-item--activated [dir=rtl]::after {
    right: auto;
    left: 16px;
  }
}

.mat-mdc-list-base {
  display: block;
}
.mat-mdc-list-base .mdc-list-item__start,
.mat-mdc-list-base .mdc-list-item__end,
.mat-mdc-list-base .mdc-list-item__content {
  pointer-events: auto;
}

.mat-mdc-list-item,
.mat-mdc-list-option {
  width: 100%;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
.mat-mdc-list-item:not(.mat-mdc-list-item-interactive),
.mat-mdc-list-option:not(.mat-mdc-list-item-interactive) {
  cursor: default;
}
.mat-mdc-list-item .mat-divider-inset,
.mat-mdc-list-option .mat-divider-inset {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.mat-mdc-list-item .mat-mdc-list-item-avatar ~ .mat-divider-inset,
.mat-mdc-list-option .mat-mdc-list-item-avatar ~ .mat-divider-inset {
  margin-left: 72px;
}
[dir=rtl] .mat-mdc-list-item .mat-mdc-list-item-avatar ~ .mat-divider-inset,
[dir=rtl] .mat-mdc-list-option .mat-mdc-list-item-avatar ~ .mat-divider-inset {
  margin-right: 72px;
}

.mat-mdc-list-item-interactive::before {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  content: "";
  opacity: 0;
  pointer-events: none;
  border-radius: inherit;
}

.mat-mdc-list-item > .mat-focus-indicator {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
.mat-mdc-list-item:focus-visible > .mat-focus-indicator::before {
  content: "";
}

.mat-mdc-list-item.mdc-list-item--with-three-lines .mat-mdc-list-item-line.mdc-list-item__secondary-text {
  white-space: nowrap;
  line-height: normal;
}
.mat-mdc-list-item.mdc-list-item--with-three-lines .mat-mdc-list-item-unscoped-content.mdc-list-item__secondary-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

mat-action-list button {
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  -webkit-tap-highlight-color: transparent;
  text-align: start;
}
mat-action-list button::-moz-focus-inner {
  border: 0;
}

.mdc-list-item--with-leading-icon .mdc-list-item__start {
  margin-inline-start: var(--mat-list-list-item-leading-icon-start-space, 16px);
  margin-inline-end: var(--mat-list-list-item-leading-icon-end-space, 16px);
}

.mat-mdc-nav-list .mat-mdc-list-item {
  border-radius: var(--mat-list-active-indicator-shape, var(--mat-sys-corner-full));
  --mat-focus-indicator-border-radius: var(--mat-list-active-indicator-shape, var(--mat-sys-corner-full));
}
.mat-mdc-nav-list .mat-mdc-list-item.mdc-list-item--activated {
  background-color: var(--mat-list-active-indicator-color, var(--mat-sys-secondary-container));
}
`,nn=["unscopedContent"],on=["text"],rn=[[["","matListItemAvatar",""],["","matListItemIcon",""]],[["","matListItemTitle",""]],[["","matListItemLine",""]],"*",[["","matListItemMeta",""]],[["mat-divider"]]],an=["[matListItemAvatar],[matListItemIcon]","[matListItemTitle]","[matListItemLine]","*","[matListItemMeta]","mat-divider"];var sn=new H("ListOption"),ie=(()=>{class e{_elementRef=s(v);static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","matListItemTitle",""]],hostAttrs:[1,"mat-mdc-list-item-title","mdc-list-item__primary-text"]})}return e})(),ln=(()=>{class e{_elementRef=s(v);static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","matListItemLine",""]],hostAttrs:[1,"mat-mdc-list-item-line","mdc-list-item__secondary-text"]})}return e})(),cn=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","matListItemMeta",""]],hostAttrs:[1,"mat-mdc-list-item-meta","mdc-list-item__end"]})}return e})(),fi=(()=>{class e{_listOption=s(sn,{optional:!0});_isAlignedAtStart(){return!this._listOption||this._listOption?._getTogglePosition()==="after"}static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,hostVars:4,hostBindings:function(i,n){i&2&&w("mdc-list-item__start",n._isAlignedAtStart())("mdc-list-item__end",!n._isAlignedAtStart())}})}return e})(),dn=(()=>{class e extends fi{static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275dir=_({type:e,selectors:[["","matListItemAvatar",""]],hostAttrs:[1,"mat-mdc-list-item-avatar"],features:[A]})}return e})(),ne=(()=>{class e extends fi{static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275dir=_({type:e,selectors:[["","matListItemIcon",""]],hostAttrs:[1,"mat-mdc-list-item-icon"],features:[A]})}return e})(),mn=new H("MAT_LIST_CONFIG"),ee=(()=>{class e{_isNonInteractive=!0;get disableRipple(){return this._disableRipple}set disableRipple(t){this._disableRipple=P(t)}_disableRipple=!1;get disabled(){return this._disabled()}set disabled(t){this._disabled.set(P(t))}_disabled=O(!1);_defaultOptions=s(mn,{optional:!0});static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,hostVars:1,hostBindings:function(i,n){i&2&&N("aria-disabled",n.disabled)},inputs:{disableRipple:"disableRipple",disabled:"disabled"}})}return e})(),hn=(()=>{class e{_elementRef=s(v);_ngZone=s(T);_listBase=s(ee,{optional:!0});_platform=s(B);_hostElement;_isButtonElement;_noopAnimations=Mt();_avatars;_icons;set lines(t){this._explicitLines=ct(t,null),this._updateItemLines(!1)}_explicitLines=null;get disableRipple(){return this.disabled||this._disableRipple||this._noopAnimations||!!this._listBase?.disableRipple}set disableRipple(t){this._disableRipple=P(t)}_disableRipple=!1;get disabled(){return this._disabled()||!!this._listBase?.disabled}set disabled(t){this._disabled.set(P(t))}_disabled=O(!1);_subscriptions=new Qt;_rippleRenderer=null;_hasUnscopedTextContent=!1;rippleConfig;get rippleDisabled(){return this.disableRipple||!!this.rippleConfig.disabled}constructor(){s(Ue).load(ei);let t=s(ti,{optional:!0});this.rippleConfig=t||{},this._hostElement=this._elementRef.nativeElement,this._isButtonElement=this._hostElement.nodeName.toLowerCase()==="button",this._listBase&&!this._listBase._isNonInteractive&&this._initInteractiveListItem(),this._isButtonElement&&!this._hostElement.hasAttribute("type")&&this._hostElement.setAttribute("type","button")}ngAfterViewInit(){this._monitorProjectedLinesAndTitle(),this._updateItemLines(!0)}ngOnDestroy(){this._subscriptions.unsubscribe(),this._rippleRenderer!==null&&this._rippleRenderer._removeTriggerEvents()}_hasIconOrAvatar(){return!!(this._avatars.length||this._icons.length)}_initInteractiveListItem(){this._hostElement.classList.add("mat-mdc-list-item-interactive"),this._rippleRenderer=new Je(this,this._ngZone,this._hostElement,this._platform,s(nt)),this._rippleRenderer.setupTriggerEvents(this._hostElement)}_monitorProjectedLinesAndTitle(){this._ngZone.runOutsideAngular(()=>{this._subscriptions.add(xt(this._lines.changes,this._titles.changes).subscribe(()=>this._updateItemLines(!1)))})}_updateItemLines(t){if(!this._lines||!this._titles||!this._unscopedContent)return;t&&this._checkDomForUnscopedTextContent();let i=this._explicitLines??this._inferLinesFromContent(),n=this._unscopedContent.nativeElement;if(this._hostElement.classList.toggle("mat-mdc-list-item-single-line",i<=1),this._hostElement.classList.toggle("mdc-list-item--with-one-line",i<=1),this._hostElement.classList.toggle("mdc-list-item--with-two-lines",i===2),this._hostElement.classList.toggle("mdc-list-item--with-three-lines",i===3),this._hasUnscopedTextContent){let o=this._titles.length===0&&i===1;n.classList.toggle("mdc-list-item__primary-text",o),n.classList.toggle("mdc-list-item__secondary-text",!o)}else n.classList.remove("mdc-list-item__primary-text"),n.classList.remove("mdc-list-item__secondary-text")}_inferLinesFromContent(){let t=this._titles.length+this._lines.length;return this._hasUnscopedTextContent&&(t+=1),t}_checkDomForUnscopedTextContent(){this._hasUnscopedTextContent=Array.from(this._unscopedContent.nativeElement.childNodes).filter(t=>t.nodeType!==t.COMMENT_NODE).some(t=>!!(t.textContent&&t.textContent.trim()))}static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,contentQueries:function(i,n,o){if(i&1&&G(o,dn,4)(o,ne,4),i&2){let a;p(a=u())&&(n._avatars=a),p(a=u())&&(n._icons=a)}},hostVars:4,hostBindings:function(i,n){i&2&&(N("aria-disabled",n.disabled)("disabled",n._isButtonElement&&n.disabled||null),w("mdc-list-item--disabled",n.disabled))},inputs:{lines:"lines",disableRipple:"disableRipple",disabled:"disabled"}})}return e})();var bi=(()=>{class e extends hn{_lines;_titles;_meta;_unscopedContent;_itemText;get activated(){return this._activated}set activated(t){this._activated=P(t)}_activated=!1;_getAriaCurrent(){return this._hostElement.nodeName==="A"&&this._activated?"page":null}_hasBothLeadingAndTrailing(){return this._meta.length!==0&&(this._avatars.length!==0||this._icons.length!==0)}static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-list-item"],["a","mat-list-item",""],["button","mat-list-item",""]],contentQueries:function(i,n,o){if(i&1&&G(o,ln,5)(o,ie,5)(o,cn,5),i&2){let a;p(a=u())&&(n._lines=a),p(a=u())&&(n._titles=a),p(a=u())&&(n._meta=a)}},viewQuery:function(i,n){if(i&1&&at(nn,5)(on,5),i&2){let o;p(o=u())&&(n._unscopedContent=o.first),p(o=u())&&(n._itemText=o.first)}},hostAttrs:[1,"mat-mdc-list-item","mdc-list-item"],hostVars:13,hostBindings:function(i,n){i&2&&(N("aria-current",n._getAriaCurrent()),w("mdc-list-item--activated",n.activated)("mdc-list-item--with-leading-avatar",n._avatars.length!==0)("mdc-list-item--with-leading-icon",n._icons.length!==0)("mdc-list-item--with-trailing-meta",n._meta.length!==0)("mat-mdc-list-item-both-leading-and-trailing",n._hasBothLeadingAndTrailing())("_mat-animation-noopable",n._noopAnimations))},inputs:{activated:"activated"},exportAs:["matListItem"],features:[A],ngContentSelectors:an,decls:10,vars:0,consts:[["unscopedContent",""],[1,"mdc-list-item__content"],[1,"mat-mdc-list-item-unscoped-content",3,"cdkObserveContent"],[1,"mat-focus-indicator"]],template:function(i,n){i&1&&(C(rn),m(0),c(1,"span",1),m(2,1),m(3,2),c(4,"span",2,0),z("cdkObserveContent",function(){return n._updateItemLines(!0)}),m(6,3),d()(),m(7,4),m(8,5),ot(9,"div",3))},dependencies:[Ze],encapsulation:2})}return e})();var vi=(()=>{class e extends ee{_isNonInteractive=!1;static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-nav-list"]],hostAttrs:["role","navigation",1,"mat-mdc-nav-list","mat-mdc-list-base","mdc-list"],exportAs:["matNavList"],features:[F([{provide:ee,useExisting:e}]),A],ngContentSelectors:tn,decls:1,vars:0,template:function(i,n){i&1&&(C(),m(0))},styles:[en],encapsulation:2})}return e})();var wi=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({imports:[qe,ni,_i,W,gi]})}return e})();var fn=20,bn=(()=>{class e{_ngZone=s(T);_platform=s(B);_renderer=s(Xt).createRenderer(null,null);_cleanupGlobalListener;_scrolled=new k;_scrolledCount=0;scrollContainers=new Map;register(t){this.scrollContainers.has(t)||this.scrollContainers.set(t,t.elementScrolled().subscribe(()=>this._scrolled.next(t)))}deregister(t){let i=this.scrollContainers.get(t);i&&(i.unsubscribe(),this.scrollContainers.delete(t))}scrolled(t=fn){return this._platform.isBrowser?new we(i=>{this._cleanupGlobalListener||(this._cleanupGlobalListener=this._ngZone.runOutsideAngular(()=>this._renderer.listen("document","scroll",()=>this._scrolled.next())));let n=t>0?this._scrolled.pipe(Ut(t)).subscribe(i):this._scrolled.subscribe(i);return this._scrolledCount++,()=>{n.unsubscribe(),this._scrolledCount--,this._scrolledCount||(this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0)}}):xe()}ngOnDestroy(){this._cleanupGlobalListener?.(),this._cleanupGlobalListener=void 0,this.scrollContainers.forEach((t,i)=>this.deregister(i)),this._scrolled.complete()}ancestorScrolled(t,i){let n=this.getAncestorScrollContainers(t);return this.scrolled(i).pipe(X(o=>!o||n.indexOf(o)>-1))}getAncestorScrollContainers(t){let i=[];return this.scrollContainers.forEach((n,o)=>{this._targetContainsElement(o,t)&&i.push(o)}),i}_targetContainsElement(t,i){let n=He(i),o=t.getElementRef().nativeElement;do if(n==o)return!0;while(n=n.parentElement);return!1}static \u0275fac=function(i){return new(i||e)};static \u0275prov=Yt({token:e,factory:e.\u0275fac})}return e})(),ht=(()=>{class e{elementRef=s(v);scrollDispatcher=s(bn);ngZone=s(T);dir=s(Ot,{optional:!0});_scrollElement=this.elementRef.nativeElement;_destroyed=new k;_renderer=s(K);_cleanupScroll;_elementScrolled=new k;ngOnInit(){this._cleanupScroll=this.ngZone.runOutsideAngular(()=>this._renderer.listen(this._scrollElement,"scroll",t=>this._elementScrolled.next(t))),this.scrollDispatcher.register(this)}ngOnDestroy(){this._cleanupScroll?.(),this._elementScrolled.complete(),this.scrollDispatcher.deregister(this),this._destroyed.next(),this._destroyed.complete()}elementScrolled(){return this._elementScrolled}getElementRef(){return this.elementRef}scrollTo(t){let i=this.elementRef.nativeElement,n=this.dir&&this.dir.value=="rtl";t.left==null&&(t.left=n?t.end:t.start),t.right==null&&(t.right=n?t.start:t.end),t.bottom!=null&&(t.top=i.scrollHeight-i.clientHeight-t.bottom),n&&mt()!=dt.NORMAL?(t.left!=null&&(t.right=i.scrollWidth-i.clientWidth-t.left),mt()==dt.INVERTED?t.left=t.right:mt()==dt.NEGATED&&(t.left=t.right?-t.right:t.right)):t.right!=null&&(t.left=i.scrollWidth-i.clientWidth-t.right),this._applyScrollToOptions(t)}_applyScrollToOptions(t){let i=this.elementRef.nativeElement;Ke()?i.scrollTo(t):(t.top!=null&&(i.scrollTop=t.top),t.left!=null&&(i.scrollLeft=t.left))}measureScrollOffset(t){let i="left",n="right",o=this.elementRef.nativeElement;if(t=="top")return o.scrollTop;if(t=="bottom")return o.scrollHeight-o.clientHeight-o.scrollTop;let a=this.dir&&this.dir.value=="rtl";return t=="start"?t=a?n:i:t=="end"&&(t=a?i:n),a&&mt()==dt.INVERTED?t==i?o.scrollWidth-o.clientWidth-o.scrollLeft:o.scrollLeft:a&&mt()==dt.NEGATED?t==i?o.scrollLeft+o.scrollWidth-o.clientWidth:-o.scrollLeft:t==i?o.scrollLeft:o.scrollWidth-o.clientWidth-o.scrollLeft}static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","cdk-scrollable",""],["","cdkScrollable",""]]})}return e})(),vn=20,xi=(()=>{class e{_platform=s(B);_listeners;_viewportSize=null;_change=new k;_document=s(U);constructor(){let t=s(T),i=s(Xt).createRenderer(null,null);t.runOutsideAngular(()=>{if(this._platform.isBrowser){let n=o=>this._change.next(o);this._listeners=[i.listen("window","resize",n),i.listen("window","orientationchange",n)]}this.change().subscribe(()=>this._viewportSize=null)})}ngOnDestroy(){this._listeners?.forEach(t=>t()),this._change.complete()}getViewportSize(){this._viewportSize||this._updateViewportSize();let t={width:this._viewportSize.width,height:this._viewportSize.height};return this._platform.isBrowser||(this._viewportSize=null),t}getViewportRect(){let t=this.getViewportScrollPosition(),{width:i,height:n}=this.getViewportSize();return{top:t.top,left:t.left,bottom:t.top+n,right:t.left+i,height:n,width:i}}getViewportScrollPosition(){if(!this._platform.isBrowser)return{top:0,left:0};let t=this._document,i=this._getWindow(),n=t.documentElement,o=n.getBoundingClientRect(),a=-o.top||t.body?.scrollTop||i.scrollY||n.scrollTop||0,b=-o.left||t.body?.scrollLeft||i.scrollX||n.scrollLeft||0;return{top:a,left:b}}change(t=vn){return t>0?this._change.pipe(Ut(t)):this._change}_getWindow(){return this._document.defaultView||window}_updateViewportSize(){let t=this._getWindow();this._viewportSize=this._platform.isBrowser?{width:t.innerWidth,height:t.innerHeight}:{width:0,height:0}}static \u0275fac=function(i){return new(i||e)};static \u0275prov=Yt({token:e,factory:e.\u0275fac})}return e})();var oe=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({})}return e})();var Pt=["*"],xn=["content"],yi=[[["mat-drawer"],["mat-sidenav"]],[["mat-drawer-content"],["mat-sidenav-content"]],"*"],ki=["mat-drawer, mat-sidenav","mat-drawer-content, mat-sidenav-content","*"];function yn(e,r){if(e&1){let t=rt();c(0,"div",1),z("click",function(){et(t);let n=Q();return it(n._onBackdropClicked())}),d()}if(e&2){let t=Q();w("mat-drawer-shown",t._isShowingBackdrop())}}function kn(e,r){e&1&&(c(0,"mat-drawer-content"),m(1,2),d())}function Cn(e,r){if(e&1){let t=rt();c(0,"div",1),z("click",function(){et(t);let n=Q();return it(n._onBackdropClicked())}),d()}if(e&2){let t=Q();w("mat-drawer-shown",t._isShowingBackdrop())}}function Mn(e,r){e&1&&(c(0,"mat-sidenav-content"),m(1,2),d())}var On=`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--mat-sidenav-content-text-color, var(--mat-sys-on-background));
  background-color: var(--mat-sidenav-content-background-color, var(--mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--mat-sidenav-scrim-color, color-mix(in srgb, var(--mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--mat-sidenav-container-text-color, var(--mat-sys-on-surface-variant));
  box-shadow: var(--mat-sidenav-container-elevation-shadow, none);
  background-color: var(--mat-sidenav-container-background-color, var(--mat-sys-surface));
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  width: var(--mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`;var Sn=new H("MAT_DRAWER_DEFAULT_AUTOSIZE",{providedIn:"root",factory:()=>!1}),se=new H("MAT_DRAWER_CONTAINER"),vt=(()=>{class e extends ht{_platform=s(B);_changeDetectorRef=s(lt);_element=s(v);_ngZone=s(T);_isInert=!1;_container=s(ae);ngAfterContentInit(){this._container._contentMarginChanges.subscribe(()=>this._changeDetectorRef.markForCheck())}_drawerToggled(t){t.opened?this._ngZone.runOutsideAngular(()=>{t._animationEnd.pipe(ke(50),Gt(1)).subscribe(()=>this._updateInert())}):this._updateInert()}_drawerModeChanged(){this._updateInert()}_updateInert(){let t=this._container._isShowingBackdrop();if(t!==this._isInert){let i=this._element.nativeElement;this._isInert=t,t?i.setAttribute("inert","true"):i.removeAttribute("inert")}}_shouldBeHidden(){if(this._platform.isBrowser)return!1;let{start:t,end:i}=this._container;return t!=null&&t.mode!=="over"&&t.opened||i!=null&&i.mode!=="over"&&i.opened}static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-drawer-content"]],hostAttrs:[1,"mat-drawer-content"],hostVars:6,hostBindings:function(i,n){i&2&&(st("margin-left",n._container._contentMargins.left,"px")("margin-right",n._container._contentMargins.right,"px"),w("mat-drawer-content-hidden",n._shouldBeHidden()))},features:[F([{provide:ht,useExisting:e}]),A],ngContentSelectors:Pt,decls:1,vars:0,template:function(i,n){i&1&&(C(),m(0))},encapsulation:2})}return e})(),re=(()=>{class e{_elementRef=s(v);_focusTrapFactory=s(Xe);_focusMonitor=s(Qe);_platform=s(B);_ngZone=s(T);_renderer=s(K);_interactivityChecker=s(Ye);_doc=s(U);_container=s(se,{optional:!0});_focusTrap=null;_elementFocusedBeforeDrawerWasOpened=null;_eventCleanups;_isAttached=!1;_anchor=null;get position(){return this._position}set position(t){t=t==="end"?"end":"start",t!==this._position&&(this._isAttached&&this._updatePositionInParent(t),this._position=t,this.onPositionChanged.emit())}_position="start";get mode(){return this._mode}set mode(t){this._mode=t,this._updateFocusTrapState(),this._modeChanged.next(),this._getContent()?._drawerModeChanged()}_mode="over";get disableClose(){return this._disableClose}set disableClose(t){this._disableClose=P(t)}_disableClose=!1;get autoFocus(){let t=this._autoFocus;return t??(this.mode==="side"?"dialog":"first-tabbable")}set autoFocus(t){(t==="true"||t==="false"||t==null)&&(t=P(t)),this._autoFocus=t}_autoFocus;get opened(){return this._opened()}set opened(t){this.toggle(P(t))}_opened=O(!1);_openedVia=null;_animationStarted=new k;_animationEnd=new k;openedChange=new bt(!0);_openedStream=this.openedChange.pipe(X(t=>t),ft(()=>{}));openedStart=this._animationStarted.pipe(X(()=>this.opened),Zt(void 0));_closedStream=this.openedChange.pipe(X(t=>!t),ft(()=>{}));closedStart=this._animationStarted.pipe(X(()=>!this.opened),Zt(void 0));_destroyed=new k;onPositionChanged=new bt;_content;_modeChanged=new k;_injector=s(nt);_changeDetectorRef=s(lt);constructor(){this.openedChange.pipe(L(this._destroyed)).subscribe(t=>{t?(this._elementFocusedBeforeDrawerWasOpened=this._doc.activeElement,this._takeFocus()):this._isFocusWithinDrawer()&&this._restoreFocus(this._openedVia||"program")}),this._eventCleanups=this._ngZone.runOutsideAngular(()=>{let t=this._renderer,i=this._elementRef.nativeElement;return[t.listen(i,"keydown",n=>{n.keyCode===27&&!this.disableClose&&!$e(n)&&this._ngZone.run(()=>{this.close(),n.stopPropagation(),n.preventDefault()})}),t.listen(i,"transitionend",this._handleTransitionEvent),t.listen(i,"transitioncancel",this._handleTransitionEvent)]}),this._animationEnd.subscribe(()=>{this.openedChange.emit(this.opened)})}_focusByCssSelector(t,i){let n=this._elementRef.nativeElement.querySelector(t);n&&(this._interactivityChecker.isFocusable(n)||(n.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let o=()=>{a(),b(),n.removeAttribute("tabindex")},a=this._renderer.listen(n,"blur",o),b=this._renderer.listen(n,"mousedown",o)})),n.focus(i))}_takeFocus(){if(!this._focusTrap)return;let t=this._elementRef.nativeElement;switch(this.autoFocus){case!1:case"dialog":return;case!0:case"first-tabbable":kt(()=>{!this._focusTrap.focusInitialElement()&&typeof t.focus=="function"&&t.focus()},{injector:this._injector});break;case"first-heading":this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');break;default:this._focusByCssSelector(this.autoFocus);break}}_restoreFocus(t){this.autoFocus!=="dialog"&&(this._elementFocusedBeforeDrawerWasOpened?this._focusMonitor.focusVia(this._elementFocusedBeforeDrawerWasOpened,t):this._elementRef.nativeElement.blur(),this._elementFocusedBeforeDrawerWasOpened=null)}_isFocusWithinDrawer(){let t=this._doc.activeElement;return!!t&&this._elementRef.nativeElement.contains(t)}ngAfterViewInit(){this._isAttached=!0,this._position==="end"&&this._updatePositionInParent("end"),this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._updateFocusTrapState())}ngOnDestroy(){this._eventCleanups.forEach(t=>t()),this._focusTrap?.destroy(),this._anchor?.remove(),this._anchor=null,this._animationStarted.complete(),this._animationEnd.complete(),this._modeChanged.complete(),this._destroyed.next(),this._destroyed.complete()}open(t){return this.toggle(!0,t)}close(){return this.toggle(!1)}_closeViaBackdropClick(){return this._setOpen(!1,!0,"mouse")}toggle(t=!this.opened,i){t&&i&&(this._openedVia=i);let n=this._setOpen(t,!t&&this._isFocusWithinDrawer(),this._openedVia||"program");return t||(this._openedVia=null),n}_setOpen(t,i,n){return t===this.opened?Promise.resolve(t?"open":"close"):(this._opened.set(t),this._getContent()?._drawerToggled(this),this._container?._transitionsEnabled?(this._setIsAnimating(!0),setTimeout(()=>this._animationStarted.next())):setTimeout(()=>{this._animationStarted.next(),this._animationEnd.next()}),this._elementRef.nativeElement.classList.toggle("mat-drawer-opened",t),!t&&i&&this._restoreFocus(n),this._changeDetectorRef.markForCheck(),this._updateFocusTrapState(),new Promise(o=>{this.openedChange.pipe(Gt(1)).subscribe(a=>o(a?"open":"close"))}))}_getContent(){return this._container?._content||this._container?._userContent}_setIsAnimating(t){this._elementRef.nativeElement.classList.toggle("mat-drawer-animating",t)}_getWidth(){return this._elementRef.nativeElement.offsetWidth||0}_updateFocusTrapState(){this._focusTrap&&(this._focusTrap.enabled=this.opened&&!!this._container?._isShowingBackdrop())}_updatePositionInParent(t){if(!this._platform.isBrowser)return;let i=this._elementRef.nativeElement,n=i.parentNode;t==="end"?(this._anchor||(this._anchor=this._doc.createComment("mat-drawer-anchor"),n.insertBefore(this._anchor,i)),n.appendChild(i)):this._anchor&&this._anchor.parentNode.insertBefore(i,this._anchor)}_handleTransitionEvent=t=>{let i=this._elementRef.nativeElement;t.target===i&&this._ngZone.run(()=>{t.type==="transitionend"&&this._setIsAnimating(!1),this._animationEnd.next(t)})};static \u0275fac=function(i){return new(i||e)};static \u0275cmp=g({type:e,selectors:[["mat-drawer"]],viewQuery:function(i,n){if(i&1&&at(xn,5),i&2){let o;p(o=u())&&(n._content=o.first)}},hostAttrs:[1,"mat-drawer"],hostVars:12,hostBindings:function(i,n){i&2&&(N("align",null)("tabIndex",n.mode!=="side"?"-1":null),st("visibility",!n._container&&!n.opened?"hidden":null),w("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side"))},inputs:{position:"position",mode:"mode",disableClose:"disableClose",autoFocus:"autoFocus",opened:"opened"},outputs:{openedChange:"openedChange",_openedStream:"opened",openedStart:"openedStart",_closedStream:"closed",closedStart:"closedStart",onPositionChanged:"positionChanged"},exportAs:["matDrawer"],ngContentSelectors:Pt,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(i,n){i&1&&(C(),c(0,"div",1,0),m(2),d())},dependencies:[ht],encapsulation:2})}return e})(),ae=(()=>{class e{_dir=s(Ot,{optional:!0});_element=s(v);_ngZone=s(T);_changeDetectorRef=s(lt);_animationDisabled=Mt();_transitionsEnabled=!1;_allDrawers;_drawers=new Se;_content;_userContent;get start(){return this._start}get end(){return this._end}get autosize(){return this._autosize}set autosize(t){this._autosize=P(t)}_autosize=s(Sn);get hasBackdrop(){return this._drawerHasBackdrop(this._start)||this._drawerHasBackdrop(this._end)}set hasBackdrop(t){this._backdropOverride=t==null?null:P(t)}_backdropOverride=null;backdropClick=new bt;_start=null;_end=null;_left=null;_right=null;_destroyed=new k;_doCheckSubject=new k;_contentMargins={left:null,right:null};_contentMarginChanges=new k;get scrollable(){return this._userContent||this._content}_injector=s(nt);constructor(){let t=s(B),i=s(xi);this._dir?.change.pipe(L(this._destroyed)).subscribe(()=>{this._validateDrawers(),this.updateContentMargins()}),i.change().pipe(L(this._destroyed)).subscribe(()=>this.updateContentMargins()),!this._animationDisabled&&t.isBrowser&&this._ngZone.runOutsideAngular(()=>{setTimeout(()=>{this._element.nativeElement.classList.add("mat-drawer-transition"),this._transitionsEnabled=!0},200)})}ngAfterContentInit(){this._allDrawers.changes.pipe(yt(this._allDrawers),L(this._destroyed)).subscribe(t=>{this._drawers.reset(t.filter(i=>!i._container||i._container===this)),this._drawers.notifyOnChanges()}),this._drawers.changes.pipe(yt(null)).subscribe(()=>{this._validateDrawers(),this._drawers.forEach(t=>{this._watchDrawerToggle(t),this._watchDrawerPosition(t),this._watchDrawerMode(t)}),(!this._drawers.length||this._isDrawerOpen(this._start)||this._isDrawerOpen(this._end))&&this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),this._ngZone.runOutsideAngular(()=>{this._doCheckSubject.pipe(ye(10),L(this._destroyed)).subscribe(()=>this.updateContentMargins())})}ngOnDestroy(){this._contentMarginChanges.complete(),this._doCheckSubject.complete(),this._drawers.destroy(),this._destroyed.next(),this._destroyed.complete()}open(){this._drawers.forEach(t=>t.open())}close(){this._drawers.forEach(t=>t.close())}updateContentMargins(){let t=0,i=0;if(this._left&&this._left.opened){if(this._left.mode=="side")t+=this._left._getWidth();else if(this._left.mode=="push"){let n=this._left._getWidth();t+=n,i-=n}}if(this._right&&this._right.opened){if(this._right.mode=="side")i+=this._right._getWidth();else if(this._right.mode=="push"){let n=this._right._getWidth();i+=n,t-=n}}t=t||null,i=i||null,(t!==this._contentMargins.left||i!==this._contentMargins.right)&&(this._contentMargins={left:t,right:i},this._ngZone.run(()=>this._contentMarginChanges.next(this._contentMargins)))}ngDoCheck(){this._autosize&&this._isPushed()&&this._ngZone.runOutsideAngular(()=>this._doCheckSubject.next())}_watchDrawerToggle(t){t._animationStarted.pipe(L(this._drawers.changes)).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),t.mode!=="side"&&t.openedChange.pipe(L(this._drawers.changes)).subscribe(()=>this._setContainerClass(t.opened))}_watchDrawerPosition(t){t.onPositionChanged.pipe(L(this._drawers.changes)).subscribe(()=>{kt({read:()=>this._validateDrawers()},{injector:this._injector})})}_watchDrawerMode(t){t._modeChanged.pipe(L(xt(this._drawers.changes,this._destroyed))).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()})}_setContainerClass(t){let i=this._element.nativeElement.classList,n="mat-drawer-container-has-open";t?i.add(n):i.remove(n)}_validateDrawers(){this._start=this._end=null,this._drawers.forEach(t=>{t.position=="end"?(this._end!=null,this._end=t):(this._start!=null,this._start=t)}),this._right=this._left=null,this._dir&&this._dir.value==="rtl"?(this._left=this._end,this._right=this._start):(this._left=this._start,this._right=this._end)}_isPushed(){return this._isDrawerOpen(this._start)&&this._start.mode!="over"||this._isDrawerOpen(this._end)&&this._end.mode!="over"}_onBackdropClicked(){this.backdropClick.emit(),this._closeModalDrawersViaBackdrop()}_closeModalDrawersViaBackdrop(){[this._start,this._end].filter(t=>t&&!t.disableClose&&this._drawerHasBackdrop(t)).forEach(t=>t._closeViaBackdropClick())}_isShowingBackdrop(){return this._isDrawerOpen(this._start)&&this._drawerHasBackdrop(this._start)||this._isDrawerOpen(this._end)&&this._drawerHasBackdrop(this._end)}_isDrawerOpen(t){return t!=null&&t.opened}_drawerHasBackdrop(t){return this._backdropOverride==null?!!t&&t.mode!=="side":this._backdropOverride}static \u0275fac=function(i){return new(i||e)};static \u0275cmp=g({type:e,selectors:[["mat-drawer-container"]],contentQueries:function(i,n,o){if(i&1&&G(o,vt,5)(o,re,5),i&2){let a;p(a=u())&&(n._content=a.first),p(a=u())&&(n._allDrawers=a)}},viewQuery:function(i,n){if(i&1&&at(vt,5),i&2){let o;p(o=u())&&(n._userContent=o.first)}},hostAttrs:[1,"mat-drawer-container"],hostVars:2,hostBindings:function(i,n){i&2&&w("mat-drawer-container-explicit-backdrop",n._backdropOverride)},inputs:{autosize:"autosize",hasBackdrop:"hasBackdrop"},outputs:{backdropClick:"backdropClick"},exportAs:["matDrawerContainer"],features:[F([{provide:se,useExisting:e}])],ngContentSelectors:ki,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(i,n){i&1&&(C(yi),J(0,yn,1,2,"div",0),m(1),m(2,1),J(3,kn,2,0,"mat-drawer-content")),i&2&&(tt(n.hasBackdrop?0:-1),h(3),tt(n._content?-1:3))},dependencies:[vt],styles:[`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--mat-sidenav-content-text-color, var(--mat-sys-on-background));
  background-color: var(--mat-sidenav-content-background-color, var(--mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--mat-sidenav-scrim-color, color-mix(in srgb, var(--mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--mat-sidenav-container-text-color, var(--mat-sys-on-surface-variant));
  box-shadow: var(--mat-sidenav-container-elevation-shadow, none);
  background-color: var(--mat-sidenav-container-background-color, var(--mat-sys-surface));
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  width: var(--mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`],encapsulation:2})}return e})(),St=(()=>{class e extends vt{static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-sidenav-content"]],hostAttrs:[1,"mat-drawer-content","mat-sidenav-content"],features:[F([{provide:ht,useExisting:e},{provide:vt,useExisting:e}]),A],ngContentSelectors:Pt,decls:1,vars:0,template:function(i,n){i&1&&(C(),m(0))},encapsulation:2})}return e})(),le=(()=>{class e extends re{get fixedInViewport(){return this._fixedInViewport}set fixedInViewport(t){this._fixedInViewport=P(t)}_fixedInViewport=!1;get fixedTopGap(){return this._fixedTopGap}set fixedTopGap(t){this._fixedTopGap=ct(t)}_fixedTopGap=0;get fixedBottomGap(){return this._fixedBottomGap}set fixedBottomGap(t){this._fixedBottomGap=ct(t)}_fixedBottomGap=0;static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-sidenav"]],hostAttrs:[1,"mat-drawer","mat-sidenav"],hostVars:16,hostBindings:function(i,n){i&2&&(N("tabIndex",n.mode!=="side"?"-1":null)("align",null),st("top",n.fixedInViewport?n.fixedTopGap:null,"px")("bottom",n.fixedInViewport?n.fixedBottomGap:null,"px"),w("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side")("mat-sidenav-fixed",n.fixedInViewport))},inputs:{fixedInViewport:"fixedInViewport",fixedTopGap:"fixedTopGap",fixedBottomGap:"fixedBottomGap"},exportAs:["matSidenav"],features:[F([{provide:re,useExisting:e}]),A],ngContentSelectors:Pt,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(i,n){i&1&&(C(),c(0,"div",1,0),m(2),d())},dependencies:[ht],encapsulation:2})}return e})(),Ci=(()=>{class e extends ae{_allDrawers=void 0;_content=void 0;static \u0275fac=(()=>{let t;return function(n){return(t||(t=I(e)))(n||e)}})();static \u0275cmp=g({type:e,selectors:[["mat-sidenav-container"]],contentQueries:function(i,n,o){if(i&1&&G(o,St,5)(o,le,5),i&2){let a;p(a=u())&&(n._content=a.first),p(a=u())&&(n._allDrawers=a)}},hostAttrs:[1,"mat-drawer-container","mat-sidenav-container"],hostVars:2,hostBindings:function(i,n){i&2&&w("mat-drawer-container-explicit-backdrop",n._backdropOverride)},exportAs:["matSidenavContainer"],features:[F([{provide:se,useExisting:e},{provide:ae,useExisting:e}]),A],ngContentSelectors:ki,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(i,n){i&1&&(C(yi),J(0,Cn,1,2,"div",0),m(1),m(2,1),J(3,Mn,2,0,"mat-sidenav-content")),i&2&&(tt(n.hasBackdrop?0:-1),h(3),tt(n._content?-1:3))},dependencies:[St],styles:[On],encapsulation:2})}return e})(),Mi=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({imports:[oe,W,oe]})}return e})();var Dn=["*",[["mat-toolbar-row"]]],Tn=["*","mat-toolbar-row"],En=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["mat-toolbar-row"]],hostAttrs:[1,"mat-toolbar-row"],exportAs:["matToolbarRow"]})}return e})(),Oi=(()=>{class e{_elementRef=s(v);_platform=s(B);_document=s(U);color;_toolbarRows;ngAfterViewInit(){this._platform.isBrowser&&(this._checkToolbarMixedModes(),this._toolbarRows.changes.subscribe(()=>this._checkToolbarMixedModes()))}_checkToolbarMixedModes(){this._toolbarRows.length}static \u0275fac=function(i){return new(i||e)};static \u0275cmp=g({type:e,selectors:[["mat-toolbar"]],contentQueries:function(i,n,o){if(i&1&&G(o,En,5),i&2){let a;p(a=u())&&(n._toolbarRows=a)}},hostAttrs:[1,"mat-toolbar"],hostVars:6,hostBindings:function(i,n){i&2&&($t(n.color?"mat-"+n.color:""),w("mat-toolbar-multiple-rows",n._toolbarRows.length>0)("mat-toolbar-single-row",n._toolbarRows.length===0))},inputs:{color:"color"},exportAs:["matToolbar"],ngContentSelectors:Tn,decls:2,vars:0,template:function(i,n){i&1&&(C(Dn),m(0),m(1,1))},styles:[`.mat-toolbar {
  background: var(--mat-toolbar-container-background-color, var(--mat-sys-surface));
  color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}
.mat-toolbar, .mat-toolbar h1, .mat-toolbar h2, .mat-toolbar h3, .mat-toolbar h4, .mat-toolbar h5, .mat-toolbar h6 {
  font-family: var(--mat-toolbar-title-text-font, var(--mat-sys-title-large-font));
  font-size: var(--mat-toolbar-title-text-size, var(--mat-sys-title-large-size));
  line-height: var(--mat-toolbar-title-text-line-height, var(--mat-sys-title-large-line-height));
  font-weight: var(--mat-toolbar-title-text-weight, var(--mat-sys-title-large-weight));
  letter-spacing: var(--mat-toolbar-title-text-tracking, var(--mat-sys-title-large-tracking));
  margin: 0;
}
@media (forced-colors: active) {
  .mat-toolbar {
    outline: solid 1px;
  }
}
.mat-toolbar .mat-form-field-underline,
.mat-toolbar .mat-form-field-ripple,
.mat-toolbar .mat-focused .mat-form-field-ripple {
  background-color: currentColor;
}
.mat-toolbar .mat-form-field-label,
.mat-toolbar .mat-focused .mat-form-field-label,
.mat-toolbar .mat-select-value,
.mat-toolbar .mat-select-arrow,
.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow {
  color: inherit;
}
.mat-toolbar .mat-input-element {
  caret-color: currentColor;
}
.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed {
  --mat-button-text-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
  --mat-button-outlined-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}

.mat-toolbar-row, .mat-toolbar-single-row {
  display: flex;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-row, .mat-toolbar-single-row {
    height: var(--mat-toolbar-mobile-height, 56px);
  }
}

.mat-toolbar-multiple-rows {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;
  min-height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-multiple-rows {
    min-height: var(--mat-toolbar-mobile-height, 56px);
  }
}
`],encapsulation:2})}return e})();var Si=(()=>{class e{static \u0275fac=function(i){return new(i||e)};static \u0275mod=S({type:e});static \u0275inj=M({imports:[W]})}return e})();var Dt=e=>e===void 0||e==="auto"||e==="instant"||e==="smooth";function Pi(e,r){this.scrollLeft=e,this.scrollTop=r}var ce=(e,r,t="cannot convert to dictionary.")=>`Failed to execute '${e}' on '${r}': ${t}`,Tt=(e,r,t)=>ce(e,r,`The provided value '${t}' is not a valid enum value of type ScrollBehavior.`),q=(e,r,t)=>{var i;let n=`__SEAMLESS.BACKUP$${r}`;return!e[n]&&e[r]&&!(!((i=e[r])===null||i===void 0)&&i.__isPolyfill)&&(e[n]=e[r]),e[n]||t},Et=e=>{let r=typeof e;return e!==null&&(r==="object"||r==="function")},pt=e=>"scrollBehavior"in window.document.documentElement.style&&e?.forcePolyfill!==!0,de=e=>{Object.defineProperty(e,"__isPolyfill",{value:!0})},ut=(e,r)=>{de(r),[HTMLElement.prototype,SVGElement.prototype,Element.prototype].forEach(t=>{q(t,e),t[e]=r})},wt=e=>e.ownerDocument.scrollingElement||e.ownerDocument.documentElement;function Di(e){if(typeof Event=="function")return new Event("scrollend",{bubbles:e,cancelable:!1});let r=document.createEvent("Event");return r.initEvent("scrollend",e,!1),r}var Ln=e=>.5*(1-Math.cos(Math.PI*e));function Rt(){var e;let r;return!((e=window.performance)===null||e===void 0)&&e.now?r=()=>window.performance.now():r=()=>window.Date.now(),Rt=r,r()}var In=500,me=e=>{let t=(Rt()-e.timeStamp)/(e.duration||In);if(t>1){e.method(e.targetX,e.targetY),e.callback();return}let i=(e.timingFunc||Ln)(t),n=e.startX+(e.targetX-e.startX)*i,o=e.startY+(e.targetY-e.startY)*i;e.method(n,o),e.rafId=window.requestAnimationFrame(()=>{me(e)})};var Lt=e=>isFinite(e)?Number(e):0,An=e=>{var r;return(r=e.isConnected)!==null&&r!==void 0?r:!e.ownerDocument||!(e.ownerDocument.compareDocumentPosition(e)&1)},zn=(e,r,t)=>{var i,n;if(!An(e))return;let o=e.scrollLeft,a=e.scrollTop,b=Lt((i=r.left)!==null&&i!==void 0?i:o),x=Lt((n=r.top)!==null&&n!==void 0?n:a);if(b===o&&x===a)return;let Y=q(HTMLElement.prototype,"scroll",Pi),y=q(Object.getPrototypeOf(e),"scroll",Y).bind(e);if(r.behavior!=="smooth"){y(b,x);return}let D=()=>{window.removeEventListener("wheel",l),window.removeEventListener("touchmove",l)},V=()=>{D();let _t=e.nodeType===9;e.dispatchEvent(Di(_t))},R=Object.assign(Object.assign({},t),{timeStamp:Rt(),startX:o,startY:a,targetX:b,targetY:x,rafId:0,method:y,callback:V}),l=()=>{window.cancelAnimationFrame(R.rafId),D()};window.addEventListener("wheel",l,{passive:!0,once:!0}),window.addEventListener("touchmove",l,{passive:!0,once:!0}),me(R)},Fn=e=>e.window===e,he=e=>(r,t,i)=>{let[n,o]=Fn(r)?[wt(r.document.documentElement),"Window"]:[r,"Element"],a=t??{};if(!Et(a))throw new TypeError(ce(e,o));if(!Dt(a.behavior))throw new TypeError(Tt(e,o,a.behavior));e==="scrollBy"&&(a.left=Lt(a.left)+n.scrollLeft,a.top=Lt(a.top)+n.scrollTop),zn(n,a,i)},pe=he("scroll"),Ti=he("scrollTo"),Ei=he("scrollBy"),Ri=pe;var zi=e=>{switch(e){case"horizontal-tb":case"lr":case"lr-tb":case"rl":case"rl-tb":return 0;case"vertical-rl":case"tb":case"tb-rl":return 1;case"vertical-lr":case"tb-lr":return 2;case"sideways-rl":return 3;case"sideways-lr":return 4}return 0},Fi=(e,r,t,i)=>{let n=0;switch(r||(n^=2),e){case 0:n=n>>1|(n&1)<<1,[t,i]=[i,t];break;case 1:case 3:n^=1;break;case 4:n^=2;break}return[n,t,i]},Bn=e=>(Fi(zi(e.writingMode),e.direction!=="rtl",void 0,void 0)[0]&1)===1,Vn=(e,r,t)=>{let[i,n,o]=Fi(r,t,e.block||"start",e.inline||"nearest");return[n,o].map((a,b)=>{switch(a){case"center":return 1;case"nearest":return 0;default:{let x=i>>b&1;return a==="start"==!x?2:3}}})},Li=(e,r,t,i,n,o,a)=>e!==0?e:n<r&&o>t||n>r&&o<t?null:n<=r&&a<=i||o>=t&&a>=i?2:o>t&&a<i||n<r&&a>i?3:null,Ii=e=>e!=="visible"&&e!=="clip",Nn=e=>{var r;try{return((r=e.ownerDocument.defaultView)===null||r===void 0?void 0:r.frameElement)||null}catch{return null}},jn=(e,r)=>e.clientHeight<e.scrollHeight||e.clientWidth<e.scrollWidth?Ii(r.overflowY)||Ii(r.overflowX)||e===wt(e):!1,Ai=e=>{let r=e.parentNode,t=e.parentElement;if(t===null&&r!==null){if(r.nodeType===11)return r.host;if(r.nodeType===9)return Nn(e)}return t},ue=(e,r,t)=>e<r?r:e>t?t:e,Wn=e=>["scroll-margin","scroll-snap-margin"].filter(r=>r in e.documentElement.style)[0],Hn=(e,r,t)=>{let{top:i,right:n,bottom:o,left:a}=r,b=Wn(e.ownerDocument);if(!b)return[i,n,o,a];let x=Y=>{let y=t.getPropertyValue(`${b}-${Y}`);return parseInt(y,10)||0};return[i-x("top"),n+x("right"),o+x("bottom"),a-x("left")]},It=(e,r,t)=>{switch(e){case 1:return(r+t)/2;case 3:return t;case 2:case 0:return r}},Qn=(e,r)=>{var t,i,n;let o=(t=e.ownerDocument.defaultView)===null||t===void 0?void 0:t.visualViewport,[a,b,x,Y]=e===wt(e)?[0,0,(i=o?.width)!==null&&i!==void 0?i:e.clientWidth,(n=o?.height)!==null&&n!==void 0?n:e.clientHeight]:[r.left,r.top,e.clientWidth,e.clientHeight],y=a+e.clientLeft,D=b+e.clientTop,V=y+x,R=D+Y;return[D,V,R,y]},Un=(e,r)=>{let t=[],i=e.ownerDocument,n=i.defaultView;if(!n)return t;let o=window.getComputedStyle(e),a=o.direction!=="rtl",b=zi(o.writingMode||o.getPropertyValue("-webkit-writing-mode")||o.getPropertyValue("-ms-writing-mode")),[x,Y]=Vn(r,b,a),[y,D,V,R]=Hn(e,e.getBoundingClientRect(),o);for(let l=Ai(e);l!==null;l=Ai(l)){if(i!==l.ownerDocument){if(i=l.ownerDocument,n=i.defaultView,!n)break;let{left:be,top:ve}=l.getBoundingClientRect();y+=ve,D+=be,V+=ve,R+=be}let _t=n.getComputedStyle(l);if(_t.position==="fixed")break;if(!jn(l,_t))continue;let qi=l.getBoundingClientRect(),[zt,Ft,Bt,Vt]=Qn(l,qi),Nt=Li(x,Vt,Ft,l.clientWidth,R,D,D-R),jt=Li(Y,zt,Bt,l.clientHeight,y,V,V-y),fe=Nt===null?0:It(Nt,R,D)-It(Nt,Vt,Ft),Yi=jt===null?0:It(jt,y,V)-It(jt,zt,Bt),Wt=Bn(_t)?ue(fe,-l.scrollWidth+l.clientWidth-l.scrollLeft,-l.scrollLeft):ue(fe,-l.scrollLeft,l.scrollWidth-l.clientWidth-l.scrollLeft),Ht=ue(Yi,-l.scrollTop,l.scrollHeight-l.clientHeight-l.scrollTop);t.push([l,{left:l.scrollLeft+Wt,top:l.scrollTop+Ht,behavior:r.behavior}]),y=Math.max(y-Ht,zt),D=Math.min(D-Wt,Ft),V=Math.min(V-Ht,Bt),R=Math.max(R-Wt,Vt)}return t},Gn=(e,r,t)=>{let i=r||{};if(!Dt(i.behavior))throw new TypeError(Tt("scrollIntoView","Element",i.behavior));Un(e,i).forEach(([o,a])=>{Ri(o,a,t)})},ge=Gn;var gt=(e,r)=>t=>{if(pt(t))return;let i={scroll:pe,scrollTo:Ti,scrollBy:Ei}[e];r(e,function(){let n=arguments;if(arguments.length===1){i(this,n[0],t);return}let o=n[0],a=n[1];i(this,{left:o,top:a})})},Bi=gt("scroll",ut),Vi=gt("scrollTo",ut),Ni=gt("scrollBy",ut),_e=(e,r)=>{de(r),q(window,e),window[e]=r},ji=gt("scroll",_e),Wi=gt("scrollTo",_e),Hi=gt("scrollBy",_e);function Zn(e){ge(this,{block:e??!0?"start":"end",inline:"nearest"})}var Qi=e=>{if(pt(e))return;let r=q(window.HTMLElement.prototype,"scrollIntoView",Zn);ut("scrollIntoView",function(){let i=arguments,n=i[0];if(i.length===1&&Et(n)){ge(this,n,e);return}r.apply(this,i)})};var Ui=e=>{pt(e)||(Bi(e),Vi(e),Ni(e),Qi(e),ji(e),Wi(e),Hi(e))};var Gi=(()=>{class e{scrolledFromTop=O(!1);scrollOffset=O(0);isBrowser=typeof window<"u";alreadyActivated=O(!1);document=s(U);onWindowScroll(t){let i=this.document.documentElement?.scrollTop||this.document.scrollingElement?.scrollTop;switch(t){case"classic":return this.classicMode(i);case"smart":return this.smartMode(i)}}classicMode(t){return!!(this.isBrowser&&t&&t>window.innerHeight)}smartMode(t){let i=!1;return t===0&&(i=!1,this.scrolledFromTop.set(!1)),this.scrolledFromTop()&&t&&this.scrollOffset()>t&&(i=!0),this.isBrowser&&t&&t>window.innerHeight*2&&(this.scrolledFromTop.set(!0),this.scrollOffset.set(t)),i}scrollToTop(){this.isBrowser&&(this.alreadyActivated()||(Ui(),this.alreadyActivated.set(!0)),window.scroll({top:0,left:0,behavior:"smooth"}))}static \u0275fac=function(i){return new(i||e)};static \u0275prov=Ce({token:e,factory:e.\u0275fac})}return e})();var Zi=(()=>{class e{mode=Re("classic",{alias:"ngxScrollTopMode"});show=O(!1);el=s(v);core=s(Gi);constructor(){this.hideElement();let t=s(T),i=s(qt);Le(s(Oe))&&t.runOutsideAngular(()=>{let n=!1,o=()=>{n||(n=!0,requestAnimationFrame(()=>{this.onWindowScroll(),n=!1}))};window.addEventListener("scroll",o,{passive:!0}),i.onDestroy(()=>window.removeEventListener("scroll",o))})}onClick(){this.core.scrollToTop()}onWindowScroll(){let t=this.core.onWindowScroll(this.mode());this.show()!==t&&(t?this.showElement():this.hideElement(),this.show.set(t))}hideElement(){this.el.nativeElement.style.display="none"}showElement(){this.el.nativeElement.style.display=""}static \u0275fac=function(i){return new(i||e)};static \u0275dir=_({type:e,selectors:[["","ngxScrollTop",""]],hostBindings:function(i,n){i&1&&z("click",function(){return n.onClick()})},inputs:{mode:[1,"ngxScrollTopMode","mode"]},features:[F([Gi])]})}return e})();var qn=()=>({exact:!0}),Yn=(e,r)=>r.path;function Xn(e,r){if(e&1){let t=rt();c(0,"a",20,0),z("click",function(){et(t);let n=Q();return it(n.closeNavigation())}),c(2,"mat-icon",21),f(3),d(),c(4,"span",22),f(5),d()()}if(e&2){let t=r.$implicit,i=Ct(1);j("activated",i.isActive)("routerLink","/"+t.path)("routerLinkActiveOptions",Ee(5,qn)),h(3),Kt(t.icon),h(2),Kt(t.label)}}var At=class e{breakpoint=s(Ge);site=ci;links=[{path:"",label:"Overview",icon:"home"},{path:"installation",label:"Installation",icon:"download"},{path:"searching",label:"Searching & filters",icon:"search"},{path:"databases-and-settings",label:"Databases & settings",icon:"settings"},{path:"players",label:"Players",icon:"groups"},{path:"teams-and-leagues",label:"Teams & leagues",icon:"shield"},{path:"referees-and-stadiums",label:"Referees & stadiums",icon:"sports"},{path:"supported-data",label:"Supported FIFA data",icon:"dataset"},{path:"development",label:"Development",icon:"code"},{path:"database",label:"Database generation",icon:"storage"},{path:"licensing",label:"Licensing",icon:"policy"},{path:"releases",label:"Releases",icon:"new_releases"}];compactNavigation=We(this.breakpoint.observe("(max-width: 900px)").pipe(ft(r=>r.matches)),{initialValue:!1});mobileNavigationOpen=O(!1);navigationMode=te(()=>this.compactNavigation()?"over":"side");navigationOpened=te(()=>!this.compactNavigation()||this.mobileNavigationOpen());toggleNavigation(){this.mobileNavigationOpen.update(r=>!r)}closeNavigation(){this.compactNavigation()&&this.mobileNavigationOpen.set(!1)}navigationChanged(r){this.compactNavigation()&&!r&&this.mobileNavigationOpen.set(!1)}static \u0275fac=function(t){return new(t||e)};static \u0275cmp=g({type:e,selectors:[["app-root"]],features:[Pe([hi])],decls:47,vars:11,consts:[["activePage","routerLinkActive"],["href","#main-content",1,"skip-link"],[1,"site-header"],["type","button","mat-icon-button","","aria-label","Open documentation navigation","aria-controls","documentation-navigation",1,"navigation-trigger",3,"click"],["routerLink","/","aria-label","QDB Finder documentation home",1,"brand"],["ngSrc","qdb-finder.png","width","28","height","28","alt","","priority",""],[1,"documentation-label"],[1,"toolbar-spacer"],["mat-button","",3,"href"],["id","documentation-navigation","aria-label","Documentation navigation",3,"openedChange","mode","opened"],[1,"navigation-heading"],["aria-label","Documentation pages"],["mat-list-item","","routerLinkActive","active","ariaCurrentWhenActive","page",3,"activated","routerLink","routerLinkActiveOptions"],[1,"content-shell"],["id","main-content","tabindex","-1"],[1,"footer-inner"],[3,"href"],["aria-label","Project links",1,"footer-links"],["type","button","mat-mini-fab","","ngxScrollTop","","aria-label","Scroll to top",1,"scroll-to-top"],["aria-hidden","true"],["mat-list-item","","routerLinkActive","active","ariaCurrentWhenActive","page",3,"click","activated","routerLink","routerLinkActiveOptions"],["matListItemIcon",""],["matListItemTitle",""]],template:function(t,i){t&1&&(c(0,"a",1),f(1,"Skip to content"),d(),c(2,"header",2)(3,"mat-toolbar")(4,"button",3),z("click",function(){return i.toggleNavigation()}),c(5,"mat-icon"),f(6,"menu"),d()(),c(7,"a",4),ot(8,"img",5),c(9,"span"),f(10,"QDB Finder"),d(),c(11,"span",6),f(12,"Documentation"),d()(),ot(13,"span",7),c(14,"a",8)(15,"mat-icon"),f(16,"code"),d(),f(17," GitHub "),d()()(),c(18,"mat-sidenav-container")(19,"mat-sidenav",9),z("openedChange",function(o){return i.navigationChanged(o)}),c(20,"p",10),f(21,"Documentation"),d(),c(22,"mat-nav-list",11),De(23,Xn,6,6,"a",12,Yn),d()(),c(25,"mat-sidenav-content")(26,"div",13)(27,"main",14),ot(28,"router-outlet"),d(),c(29,"footer")(30,"div",15)(31,"p"),f(32),c(33,"a",16),f(34),d()(),c(35,"nav",17)(36,"a",8),f(37,"Latest download"),d(),c(38,"a",8),f(39,"Source"),d(),c(40,"a",8),f(41,"Changelog"),d(),c(42,"a",8),f(43,"MIT License"),d()()()()()()(),c(44,"button",18)(45,"mat-icon",19),f(46,"keyboard_arrow_up"),d()()),t&2&&(h(4),N("aria-expanded",i.navigationOpened()),h(10),j("href",i.site.links.repository,$),h(5),j("mode",i.navigationMode())("opened",i.navigationOpened()),h(4),Te(i.links),h(9),Jt(" \xA9 ",i.site.copyrightYear," Dominik Hlad\xEDk \xB7 "),h(),j("href",i.site.links.version,$),h(),Jt("QDB Finder ",i.site.versionLabel),h(2),j("href",i.site.links.latestRelease,$),h(2),j("href",i.site.links.repository,$),h(2),j("href",i.site.links.changelog,$),h(2),j("href",i.site.links.license,$))},dependencies:[Ie,ai,oi,ri,ii,li,si,wi,vi,bi,ne,ie,Mi,le,Ci,St,Si,Oi,Zi,Be,Ve,Fe],styles:['[_nghost-%COMP%]{display:flex;min-height:100vh;flex-direction:column;background:#f7f8fc}.skip-link[_ngcontent-%COMP%]{position:fixed;z-index:100;top:.5rem;left:.5rem;padding:.7rem 1rem;border-radius:6px;background:var(--qdb-brand);color:#fff;font-weight:700;text-decoration:none;transform:translateY(-150%)}.skip-link[_ngcontent-%COMP%]:focus{transform:translateY(0)}.site-header[_ngcontent-%COMP%]{position:sticky;z-index:20;top:0;flex:0 0 auto}mat-toolbar[_ngcontent-%COMP%]{height:56px;border-bottom:1px solid #dfe3ed;background:#fff;color:var(--mat-sys-on-surface, #1a1b20)}.navigation-trigger[_ngcontent-%COMP%]{display:none;margin-right:.25rem}.brand[_ngcontent-%COMP%]{display:inline-flex;min-width:0;align-items:center;gap:.65rem;color:inherit;font-size:1rem;font-weight:700;text-decoration:none}.brand[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{border-radius:6px}.documentation-label[_ngcontent-%COMP%]{color:#686f7d;font-weight:400}.documentation-label[_ngcontent-%COMP%]:before{content:"\\b7";margin-right:.65rem}.toolbar-spacer[_ngcontent-%COMP%]{flex:1}mat-sidenav-container[_ngcontent-%COMP%]{min-height:calc(100vh - 56px);flex:1 0 auto;background:radial-gradient(circle at top right,rgb(35 86 168 / 10%),transparent 35rem),#f7f8fc}mat-sidenav[_ngcontent-%COMP%]{width:280px;border-right:1px solid #dfe3ed;background:var(--mat-sys-surface, #fff)}.navigation-heading[_ngcontent-%COMP%]{margin:1.5rem 1rem .5rem;color:#687184;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}mat-nav-list[_ngcontent-%COMP%]{padding:0 .5rem}mat-nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{margin-bottom:.15rem;border-radius:7px}mat-nav-list[_ngcontent-%COMP%]   a.active[_ngcontent-%COMP%]{background:#e8efff;color:var(--qdb-brand)}.content-shell[_ngcontent-%COMP%]{display:flex;min-height:calc(100vh - 56px);flex-direction:column}main[_ngcontent-%COMP%]{width:min(920px,100%);min-width:0;flex:1;margin:0 auto;padding:clamp(2rem,5vw,4.5rem)}main[_ngcontent-%COMP%]:focus{outline:none}footer[_ngcontent-%COMP%]{flex:0 0 auto;border-top:1px solid #dfe3ed;background:var(--mat-sys-surface, #fff);color:#565d6b}.scroll-to-top[_ngcontent-%COMP%]{position:fixed;z-index:30;right:1.25rem;bottom:1.25rem}.footer-inner[_ngcontent-%COMP%]{display:flex;max-width:1100px;align-items:center;justify-content:space-between;gap:1rem;margin:auto;padding:1rem clamp(1rem,4vw,2rem)}.footer-inner[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:0}.footer-inner[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:var(--qdb-brand);text-underline-offset:.2em}.footer-links[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.25rem}a[_ngcontent-%COMP%]:focus-visible{outline:2px solid var(--qdb-brand);outline-offset:2px}@media(max-width:900px){.navigation-trigger[_ngcontent-%COMP%]{display:inline-flex}}@media(max-width:620px){.documentation-label[_ngcontent-%COMP%]{display:none}main[_ngcontent-%COMP%]{padding:1.75rem 1rem 2.5rem}.footer-inner[_ngcontent-%COMP%]{align-items:flex-start;flex-direction:column}.footer-links[_ngcontent-%COMP%]{justify-content:flex-start}}']})};Ae(At,ui).catch(e=>console.error(e));
