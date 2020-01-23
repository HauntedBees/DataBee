/*
Fraction.js v4.0.12 09/09/2015
http://www.xarg.org/2014/03/rational-numbers-in-javascript/

Copyright (c) 2015, Robert Eisele (robert@xarg.org)
Dual licensed under the MIT or GPL Version 2 licenses.
*/
(function(x){function l(a,b){var c=0,k=1,h=1,e=0,u=0,l=0,p=1,r=1,f=0,g=1,t=1,q=1;if(void 0!==a&&null!==a)if(void 0!==b)c=a,k=b,h=c*k;else switch(typeof a){case "object":"d"in a&&"n"in a?(c=a.n,k=a.d,"s"in a&&(c*=a.s)):0 in a?(c=a[0],1 in a&&(k=a[1])):v();h=c*k;break;case "number":0>a&&(h=a,a=-a);if(0===a%1)c=a;else if(0<a){1<=a&&(r=Math.pow(10,Math.floor(1+Math.log(a)/Math.LN10)),a/=r);for(;1E7>=g&&1E7>=q;)if(c=(f+t)/(g+q),a===c){1E7>=g+q?(c=f+t,k=g+q):q>g?(c=t,k=q):(c=f,k=g);break}else a>c?(f+=t,
g+=q):(t+=f,q+=g),1E7<g?(c=t,k=q):(c=f,k=g);c*=r}else if(isNaN(a)||isNaN(b))k=c=NaN;break;case "string":g=a.match(/\d+|./g);null===g&&v();"-"===g[f]?(h=-1,f++):"+"===g[f]&&f++;if(g.length===f+1)u=n(g[f++],h);else if("."===g[f+1]||"."===g[f]){"."!==g[f]&&(e=n(g[f++],h));f++;if(f+1===g.length||"("===g[f+1]&&")"===g[f+3]||"'"===g[f+1]&&"'"===g[f+3])u=n(g[f],h),p=Math.pow(10,g[f].length),f++;if("("===g[f]&&")"===g[f+2]||"'"===g[f]&&"'"===g[f+2])l=n(g[f+1],h),r=Math.pow(10,g[f+1].length)-1,f+=3}else"/"===
g[f+1]||":"===g[f+1]?(u=n(g[f],h),p=n(g[f+2],1),f+=3):"/"===g[f+3]&&" "===g[f+1]&&(e=n(g[f],h),u=n(g[f+2],h),p=n(g[f+4],1),f+=5);if(g.length<=f){k=p*r;h=c=l+k*e+r*u;break}default:v()}if(0===k)throw new y;d.s=0>h?-1:1;d.n=Math.abs(c);d.d=Math.abs(k)}function w(a){function b(){var b=Error.apply(this,arguments);b.name=this.name=a;this.stack=b.stack;this.message=b.message}function c(){}c.prototype=Error.prototype;b.prototype=new c;return b}function n(a,b){isNaN(a=parseInt(a,10))&&v();return a*b}function v(){throw new z;
}function p(a,b){if(!a)return b;if(!b)return a;for(;;){a%=b;if(!a)return b;b%=a;if(!b)return a}}function e(a,b){if(!(this instanceof e))return new e(a,b);l(a,b);a=e.REDUCE?p(d.d,d.n):1;this.s=d.s;this.n=d.n/a;this.d=d.d/a}var d={s:1,n:0,d:1},y=e.DivisionByZero=w("DivisionByZero"),z=e.InvalidParameter=w("InvalidParameter");e.REDUCE=1;e.prototype={s:1,n:0,d:1,abs:function(){return new e(this.n,this.d)},neg:function(){return new e(-this.s*this.n,this.d)},add:function(a,b){l(a,b);return new e(this.s*
this.n*d.d+d.s*this.d*d.n,this.d*d.d)},sub:function(a,b){l(a,b);return new e(this.s*this.n*d.d-d.s*this.d*d.n,this.d*d.d)},mul:function(a,b){l(a,b);return new e(this.s*d.s*this.n*d.n,this.d*d.d)},div:function(a,b){l(a,b);return new e(this.s*d.s*this.n*d.d,this.d*d.n)},clone:function(){return new e(this)},mod:function(a,b){if(isNaN(this.n)||isNaN(this.d))return new e(NaN);if(void 0===a)return new e(this.s*this.n%this.d,1);l(a,b);0===d.n&&0===this.d&&e(0,0);return new e(this.s*d.d*this.n%(d.n*this.d),
d.d*this.d)},gcd:function(a,b){l(a,b);return new e(p(d.n,this.n)*p(d.d,this.d),d.d*this.d)},lcm:function(a,b){l(a,b);return 0===d.n&&0===this.n?new e:new e(d.n*this.n,p(d.n,this.n)*p(d.d,this.d))},ceil:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||isNaN(this.d)?new e(NaN):new e(Math.ceil(a*this.s*this.n/this.d),a)},floor:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||isNaN(this.d)?new e(NaN):new e(Math.floor(a*this.s*this.n/this.d),a)},round:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||
isNaN(this.d)?new e(NaN):new e(Math.round(a*this.s*this.n/this.d),a)},inverse:function(){return new e(this.s*this.d,this.n)},pow:function(a){return 0>a?new e(Math.pow(this.s*this.d,-a),Math.pow(this.n,-a)):new e(Math.pow(this.s*this.n,a),Math.pow(this.d,a))},equals:function(a,b){l(a,b);return this.s*this.n*d.d===d.s*d.n*this.d},compare:function(a,b){l(a,b);var c=this.s*this.n*d.d-d.s*d.n*this.d;return(0<c)-(0>c)},simplify:function(a){function b(a){return 1===a.length?new e(a[0]):b(a.slice(1)).inverse().add(a[0])}
if(isNaN(this.n)||isNaN(this.d))return this;var c=this.abs().toContinued();a=a||.001;for(var k=0;k<c.length;k++){var h=b(c.slice(0,k+1));if(h.sub(this.abs()).abs().valueOf()<a)return h.mul(this.s)}return this},divisible:function(a,b){l(a,b);return!(!(d.n*this.d)||this.n*d.d%(d.n*this.d))},valueOf:function(){return this.s*this.n/this.d},toFraction:function(a){var b,c="",k=this.n,e=this.d;0>this.s&&(c+="-");1===e?c+=k:(a&&0<(b=Math.floor(k/e))&&(c=c+b+" ",k%=e),c=c+k+"/",c+=e);return c},toLatex:function(a){var b,
c="",e=this.n,d=this.d;0>this.s&&(c+="-");1===d?c+=e:(a&&0<(b=Math.floor(e/d))&&(c+=b,e%=d),c=c+"\\frac{"+e+"}{"+d,c+="}");return c},toContinued:function(){var a=this.n,b=this.d,c=[];if(isNaN(this.n)||isNaN(this.d))return c;do{c.push(Math.floor(a/b));var e=a%b;a=b;b=e}while(1!==a);return c},toString:function(a){var b=this.n,c=this.d;if(isNaN(b)||isNaN(c))return"NaN";if(!e.REDUCE){var d=p(b,c);b/=d;c/=d}a:{for(d=c;0===d%2;d/=2);for(;0===d%5;d/=5);if(1===d)d=0;else{for(var h=10%d,m=1;1!==h;m++)if(h=
10*h%d,2E3<m){d=0;break a}d=m}}a:{h=1;m=10;for(var l=d,n=1;0<l;m=m*m%c,l>>=1)l&1&&(n=n*m%c);m=n;for(l=0;300>l;l++){if(h===m){m=l;break a}h=10*h%c;m=10*m%c}m=0}h=-1===this.s?"-":"";h+=b/c|0;(b=b%c*10)&&(h+=".");if(d){for(a=m;a--;)h+=b/c|0,b%=c,b*=10;h+="(";for(a=d;a--;)h+=b/c|0,b%=c,b*=10;h+=")"}else for(a=a||15;b&&a--;)h+=b/c|0,b%=c,b*=10;return h}};"function"===typeof define&&define.amd?define([],function(){return e}):"object"===typeof exports?(Object.defineProperty(exports,"__esModule",{value:!0}),
e["default"]=e,e.Fraction=e,module.exports=e):x.Fraction=e})(this);