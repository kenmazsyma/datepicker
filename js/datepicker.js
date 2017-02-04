var LANG = {
	US : 0,
	UK : 1,
	JP : 2,
	parse : function(l) {
		/-(.*)$/.exec(l);
		if (RegExp.$1=='') {
			return LANG.UK;
		}
		var ret = {
			'jp' : LANG.JP,
			'JP' : LANG.JP,
			'us' : LANG.US,
			'US' : LANG.US,
		}[RegExp.$1];
		if (ret===undefined) {
			return LANG.UK;
		}
		return ret;
	}
};

function DP_Static(v) {
	this.div = $('<div>').html(v)
}

DP_Static.prototype.elm = function() {
	return this.div;
}

DP_Static.prototype.focus = function() {
	return false;
}

DP_Static.prototype.blur = function() {
}


function DP_Number(v, min, max, p) {
	var self = this;
	this.v = v;
	this.min = min;
	this.div = $('<div>');
	this.fs = false;
	this.fillch = (p&&p.fillch) ? p.fillch : '';
	this.minus = (p&&p.minus) ? p.minus : '';
	this.minuspos = (p&&p.minuspos) ? p.minuspos : null;
	this.mon = (p&&p.mon) ? p.mon : null;
	this.form = function(v) {
		if (v.length>0&&v[0]=='-') {
			var s = (self.sp + v.substr(1)).substr(-self.len).replace(/ /g, '&nbsp;');
			switch (self.minuspos) {
			case 1:
				return self.minus + s;
			case 2:
				return s + self.minus;
			}
		}
		if (this.mon) {
			var n = parseInt(v);
			if (!isNaN(n)) {
				return this.mon[n];
			}
		}
		var s = (self.sp + v).substr(-self.len).replace(/ /g, '&nbsp;');
		return (s=='') ? '&nbsp;' : s;
	};
	this.setMax(max);
	this.draw();
}

DP_Number.prototype.setMax = function(m) {
	this.max = m;
	this.len = Number(m).toString().length;
	this.sp = function(len, ch) {
		var ret = '';
		for (var i=0; i<len; i++) {
			ret += ch;
		}
		return ret;
	}(this.len, this.fillch);
	if (this.v > m ) {
		this.v = m;
		this.draw();
	}
}

DP_Number.prototype.draw = function() {
	var prev = Number(this.v).toString();
	var v = this.fs ? ((this.vv=='') ? prev : this.vv) : prev;
	this.div.html(this.form(v));
}

DP_Number.prototype.val = function() {
	return this.v;
}

DP_Number.prototype.elm = function() {
	return this.div;
}

DP_Number.prototype.focus = function() {
	this.fs = true;
	this.vv = '';
	this.div.html(this.form(Number(this.v).toString()));
	this.div.addClass('fs');
	return true;
}
DP_Number.prototype.blur = function() {
	this.fs = false;
	this.div.removeClass('fs');
	if (this.vv !='') {
		var v = parseInt(this.vv);
		this.v = isNaN(v) ? this.v : v;
	}
	this.draw();
	this.onblur&&this.onblur();
}

DP_Number.prototype.input = function(code) {
	if (code==13) {
		return 1;
	}
	if (code==8) {
		if (this.vv.length>0) {
			this.vv = this.vv.substring(0, this.vv.length-2);
			this.draw();
			return 0;
		}
		return -1;
	}
	if (code==189) {
		if ((this.vv.length==0)&&(this.minuspos!=null)) {
			this.vv = '-';
			this.draw();
		}
	}
	if ((code>=48) && (code<=57)) {
		var next = this.vv + String.fromCharCode(code);
		if (parseInt(next)>this.max) return 0;
		if (parseInt(next)<this.min) return 0;
		if ((this.minuspos!=null) && ((next=='0')||(next=='-0'))) return 0;
		this.vv = next;
		this.draw();
		return (this.vv.length==this.len) ? 1 : 0;
	}
	return 0;
}

function DatePicker(elm, d, lang) {
	var cur = -1;
	var self = this;
	this.edit = false;
	this._ = $(elm);
	this._D = (d===undefined) ? new Date() : d;
	this._L = (lang===undefined) 
			? LANG.parse(navigator.language?navigator.language : navigator.userLanguage)
			: LANG.parse(lang);
	var inp = $('<input type="number">').keydown(function(e) {
		if ((cur==-1) || (cur>=self.elms.length)) return;
		var move = self.elms[cur].input(e.keyCode);
		if (move==-1) {
			while(1) {
				self.elms[cur].blur();
				--cur;
				if (cur<0) {
					self._.blur();
					break;
				}
				if (self.elms[cur].focus()) break;
			}
		} else if (move==1) {
			while(1) {
				self.elms[cur].blur();
				cur++;
				if (cur>=self.elms.length) {
					self._.blur();
					break;
				}
				if (self.elms[cur].focus()) break;
			}
		}
	}).focus(function(e) {
		for (cur = 0; cur<self.elms.length; cur++) {
			if (self.elms[0].focus()) break;
		}
		if (cur==self.elms.length) cur = -1;
	}).blur(function(e) {
		if ((cur>=0)&&(cur<self.elms.length)) self.elms[cur].blur();
		self.makeValue();
	});
	this._.append(inp).attr('tabindex', 0).focus(function(e){
		if (!self.edit) return false;
		inp.focus();
	}).addClass('datepicker')
	.click(function() {
		self._.focus();
	})
	.blur(function(e){
		inp.blur();
	});
	var getMaxDate = function(y,m) {
		var max = [31,28,31,30,31,30,31,31,30,31,30,31][m-1];
		if (m==2) {
			max = ((y%4==0)&&(y%100!=0))||(y%400==0) ? 29 : 28;
		}
		return max;
	}
	var build = function(y,m,d,h,mm) {
		var dt = new Date();
		dt.setFullYear(y);
		dt.setMonth(m-1);
		dt.setDate(d);
		dt.setHours(h);
		dt.setMinutes(mm);
		self._D = dt;
	}
	var sep = function() {
		var dt = self._D;
		return {
			y: dt.getFullYear(),
			m: dt.getMonth()+1,
			d: dt.getDate(),
			h: dt.getHours(),
			mm: dt.getMinutes()
		};
	}();
	var mon = [ '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
				'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	switch (this._L) {
	case LANG.US:
		this.elms = [
			new DP_Number(sep.m, 1, 12, {mon:mon}),
			new DP_Static(''),
			new DP_Number(sep.d, 1, 31),
			new DP_Static(','),
			new DP_Number(sep.y, -9999999999, 9999999999,{minus:'B.C.', minuspos:2}),
			new DP_Static(''),
			new DP_Number(sep.h, 0, 23, {fillch:'0'}),
			new DP_Static(':'),
			new DP_Number(sep.mm, 0, 59, {fillch:'0'})
		];
		this.elms[0].onblur = function() {
			var max = getMaxDate(self.elms[4].val(), self.elms[0].val());
			self.elms[2].setMax(max);
		};
		this.elms[4].onblur = this.elms[0].onblur;
		this.makeValue = function() {
			var e = self.elms;
			build(e[4].val(), e[0].val(), e[2].val(), e[6].val(), e[8].val());
		}
		break;
	case LANG.UK:
		this.elms = [
			new DP_Number(sep.d, 1, 31),
			new DP_Static(''),
			new DP_Number(sep.m, 1, 12, {mon:mon}),
			new DP_Static(','),
			new DP_Number(sep.y, -9999999999, 9999999999,{minus:'B.C.', minuspos:2}),
			new DP_Static(''),
			new DP_Number(sep.h, 0, 23, {fillch:'0'}),
			new DP_Static(':'),
			new DP_Number(sep.mm, 0, 59, {fillch:'0'})
		];
		this.elms[2].onblur = function() {
			var max = getMaxDate(self.elms[4].val(), self.elms[2].val());
			self.elms[0].setMax(max);
		};
		this.elms[4].onblur = this.elms[2].onblur;
		this.makeValue = function() {
			var e = self.elms;
			build(e[4].val(), e[2].val(), e[0].val(), e[6].val(), e[8].val());
		}
		break;
	case LANG.JP:
		this.elms = [
			new DP_Number(sep.y, -9999999999, 9999999999,{minus:'紀元前', minuspos:1}),
			new DP_Static('年'),
			new DP_Number(sep.m, 1, 12),
			new DP_Static('月'),
			new DP_Number(sep.d, 1, 31),
			new DP_Static('日'),
			new DP_Number(sep.h, 0, 23, {fillch:'0'}),
			new DP_Static(':'),
			new DP_Number(sep.mm, 0, 59, {fillch:'0'})
		];
		this.elms[2].onblur = function() {
			var max = getMaxDate(self.elms[0].val(), self.elms[2].val());
			self.elms[4].setMax(max);
		};
		this.elms[0].onblur = this.elms[2].onblur;
		this.makeValue = function() {
			var e = self.elms;
			build(e[0].val(), e[2].val(), e[4].val(), e[6].val(), e[8].val());
		}
		break;
	}
	var d = $('<div>');
	for ( var i=0; i<this.elms.length; i++ ) {
		d.append(this.elms[i].elm());
	}
	this._.append(d);
}

DatePicker.prototype.mode = function(edit) {
	this.edit = edit;
	if (!edit) {
		this._.blur();
	}
}

DatePicker.prototype.val = function() {
	return this._D;
}
