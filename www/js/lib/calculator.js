(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.calculator = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require("@adrien.pgd/grades")

},{"@adrien.pgd/grades":2}],2:[function(require,module,exports){
const { typeCheck } = require("type-check");


const check_option = {
    customTypes: {
        COEF: {
            typeOf: "Number",
            validate: (x) => x >= 0
        },
        THRESHOLD: {
            typeOf: "Number",
            validate: (x) => x >= 0 && x <= 20
        },
        CALCULTYPE: {
            typeOf: "String",
            validate: (x) => Object.keys(calculeTypes).includes(x)
        },
        GRADETWENTY: {
            typeOf: "Number",
            validate: (x) => x >= 0 && x <= 20
        }
    }
}

const calculeTypes = {
    LINEAR: (sctype) => {
        if (!typeCheck("Object", sctype.typeData, check_option)) {
            throw { error: "SCTypeDataErrorError" };
        }
        let sum = 0;
        let sum_coef = 0;
        for (const control of Object.values(sctype.controls)) {
            if (!control.value) {
                continue;
            }
            if (!typeCheck("{grade: GRADETWENTY}", control.value, check_option)) {
                throw { error: "ControlGradeDataError" };
            }
            if (!typeCheck("{coef: COEF}", control.data, check_option)) {
                throw { error: "ControlDataError" };
            }
            let grade = control.value.grade;
            sum += grade * control.data.coef;
            sum_coef += control.data.coef;
        }

        let average = NaN;
        if (sum_coef != 0) {
            average = sum / sum_coef;
        }
        return average;
    },
    THRESHOLDS: (sctype) => {
        if (!typeCheck("[GRADETWENTY]", sctype.typeData, check_option)) {
            throw { error: "SCTypeDataErrorError" };
        }
        let number_fails = 0;
        let number_success = 0;
        for (const control of Object.values(sctype.controls)) {
            if (!control.value) {
                continue;
            }
            if (!typeCheck("{success: Boolean}", control.value, check_option)) {
                throw { error: "ControlGradeDataError" };
            }
            if (!typeCheck("Object", control.data, check_option)) {
                throw { error: "ControlDataError" };
            }
            if (control.value.success){
                number_success += 1;
            } else {
                number_fails += 1;
            }
        }

        let average = NaN;
        if (number_fails + number_success == 0){
            return average;
        }
        if (number_success == 0){
            average = sctype.typeData[0]
        } else if (number_success >= sctype.typeData.length){
            average = sctype.typeData[sctype.typeData.length - 1]
        } else {
            average = sctype.typeData[number_success];
        }
        return average;
    }
}

const checkTypes = {
    LINEAR: (value) => {
        if (!typeCheck("{grade: GRADETWENTY}", value, check_option)) {
            return false;
        }
        return true;
    },
    THRESHOLDS: (value) => {
        if (!typeCheck("{success: Boolean}", value, check_option)) {
            return false;
        }
        return true;
    }
}


let control_format = `
{
    data: {...},
    ...
}`

let sctype_format = `
{
    coef: COEF,
    type: CALCULTYPE,
    typeData: {...},
    controls: [
        ${control_format}
    ],
    ...
}`

let subject_format = `
{
    coef: COEF,
    threshold: THRESHOLD,
    sctypes: [
        ${sctype_format}
    ],
    ...
}`

let module_format = `
{
    coef: COEF,
    subjects: [
        ${subject_format}
    ],
    ...
}`

let semester_format = `
{
    modules: [
        ${module_format}
    ],
    ...
}`

let all_format = `
{
    semesters: [
        ${semester_format}
    ],
    ...
}`

module.exports.checkValueByType = (type, value) => {
    if (!typeCheck("CALCULTYPE", type, check_option)){
        return false;
    }
    return checkTypes[type](value);
}

module.exports.check = (data) => {
    let syntax = typeCheck(all_format, data, check_option);
    if (!syntax) {
        return false;
    }
    return true;
}

/* Evals */

module.exports.eval_sctype = (sctype) => {
    if (!typeCheck(sctype_format, sctype, check_option)) {
        throw { error: "GradeStructureError", where: "eval_sctype" };
    }

    let average = calculeTypes[sctype.type](sctype);

    let total_controls = sctype.controls.length;
    let completed_controls = Object.values(sctype.controls).filter(control => control.value).length;

    sctype.eval = {
        value: average,
        total_controls: total_controls,
        completed_controls: completed_controls
    }
    return sctype.eval.value;
}

module.exports.eval_subject = (subject) => {
    if (!typeCheck(subject_format, subject, check_option)) {
        throw { error: "GradeStructureError", where: "eval_subject" };
    }

    let sum = Object.values(subject.sctypes).reduce((acc, sctype) => {
        let value = this.eval_sctype(sctype);
        return acc + (isNaN(value) ? 0 : value * sctype.coef)
    }, 0);
    let coef_sum = Object.values(subject.sctypes).reduce((acc, sctype) => {
        return acc + (isNaN(sctype.eval.value) ? 0 : sctype.coef)
    }, 0);
    let average = NaN;
    if (coef_sum != 0) {
        average = sum / coef_sum;
    }

    let total_controls = Object.values(subject.sctypes).reduce((acc, sctype)=>{
        return acc + sctype.eval.total_controls
    }, 0);
    let completed_controls = Object.values(subject.sctypes).reduce((acc, sctype)=>{
        return acc + sctype.eval.completed_controls
    }, 0);

    let status = average < 10 ? "Unvalidated" : "Validated";
    if (isNaN(average)) {
        status = "None";
    } 
    subject.eval = {
        value: average,
        status: status,
        underthreshold: average < subject.threshold,
        total_controls: total_controls,
        completed_controls: completed_controls
    }
    return subject.eval.value;
}

module.exports.eval_module = (module) => {
    if (!typeCheck(module_format, module, check_option)) {
        throw { error: "GradeStructureError", where: "eval_module" };
    }

    let sum = Object.values(module.subjects).reduce((acc, subject) => {
        let value = this.eval_subject(subject);
        return acc + (isNaN(value) ? 0 : value * subject.coef)
    }, 0);
    let coef_sum = Object.values(module.subjects).reduce((acc, subject) => {
        return acc + (isNaN(subject.eval.value) ? 0 : subject.coef)
    }, 0);
    let average = NaN;
    if (coef_sum != 0) {
        average = sum / coef_sum;
    }

    /* Subject validation */
    let status;
    let some_under_threhold = Object.values(module.subjects).some(subject => subject.eval.underthreshold);
    let some_under_ten = Object.values(module.subjects).some(subject => subject.eval.value < 10);
    if (average < 10 || some_under_threhold) {
        let total_points = 0;
        let unvalidated_indexes = []
        for (let i = 0; i < module.subjects.length; i++) {
            let subject = module.subjects[i];
            if (isNaN(subject.eval.value)) {
                subject.eval.status = "None"
            } else if (subject.eval.value >= 10) {
                total_points += (subject.eval.value - 10) * subject.coef;
                subject.eval.status = "Validated"
            } else {
                unvalidated_indexes.push({ index: i, average: subject.eval.value, coef: subject.coef });
            }
        }
        unvalidated_indexes = unvalidated_indexes.sort((a, b) => { return a.average * a.coef > b.average * b.coef });
        unvalidated_indexes = unvalidated_indexes.filter(obj => !module.subjects[obj.index].eval.underthreshold);
        for (let i = 0; i < unvalidated_indexes.length; i++) {
            let subject = module.subjects[unvalidated_indexes[i].index];
            let needed_points = (10 - subject.eval.value) * subject.coef;
            if (total_points >= needed_points) {
                subject.eval.status = "ValidatedCO"
                total_points -= needed_points;
            } else {
                subject.eval.status = "Unvalidated"
            }
        }
        status = "Unvalidated";
    } else if (average >= 10 && some_under_ten) {
        module.subjects.forEach((subject) => {
            if (isNaN(subject.eval.value)) {
                subject.eval.status = "None"
            } else if (subject.eval.value < 10) {
                subject.eval.status = "ValidatedCO"
            } else {
                subject.eval.status = "Validated"
            }
        });
        status = "ValidatedCO";
    } else {
        status = "Validated";
    }
    if (isNaN(average)) {
        status = "None"
    }

    let total_controls = Object.values(module.subjects).reduce((acc, subject)=>{
        return acc + subject.eval.total_controls
    }, 0);
    let completed_controls = Object.values(module.subjects).reduce((acc, subject)=>{
        return acc + subject.eval.completed_controls
    }, 0);

    module.eval = {
        value: average,
        status: status,
        total_controls: total_controls,
        completed_controls: completed_controls
    }
    return module.eval.value;
}

module.exports.eval_semester = (semester) => {
    if (!typeCheck(semester_format, semester, check_option)) {
        throw { error: "GradeStructureError", where: "eval_semester" };
    }
    let sum = Object.values(semester.modules).reduce((acc, module) => {
        let value = this.eval_module(module)
        return acc + (isNaN(value) ? 0 : value * module.coef)
    }, 0);
    let coef_sum = Object.values(semester.modules).reduce((acc, module) => {
        return acc + (isNaN(module.eval.value) ? 0 : module.coef)
    }, 0);
    let average = NaN;
    if (coef_sum != 0) {
        average = sum / coef_sum;
    }

    let total_controls = Object.values(semester.modules).reduce((acc, module)=>{
        return acc + module.eval.total_controls
    }, 0);
    let completed_controls = Object.values(semester.modules).reduce((acc, module)=>{
        return acc + module.eval.completed_controls
    }, 0);

    semester.eval = {
        value: average,
        total_controls: total_controls,
        completed_controls: completed_controls
    }
    return semester.eval.value;
}

module.exports.eval = (data) => {
    if (!typeCheck(all_format, data, check_option)) {
        throw { error: "GradeStructureError", where: "eval" };
    }
    for (const semester of data.semesters) {
        this.eval_semester(semester)
    }
}
/*
const data = {
    semesters: [
        {
            name: 'S6',
            modules: [
                {
                    name: 'Mathematiques',
                    coef: 1,
                    subjects: [
                        { name: 'folo', coef: 1, threshold: 0, sctypes: [] },
                        {
                            name: 'apxf',
                            coef: 1,
                            threshold: 6,
                            sctypes: [
                                {
                                    name: 'qcm',
                                    coef: 1,
                                    type: 'LINEAIR',
                                    typeData: {},
                                    controls: [
                                        { name: 'qcm1', data: { coef: 2 }, value: {grade: 5} },
                                        { name: 'qcm2', data: { coef: 1 } }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

this.eval_subject(data.semesters[0].modules[0].subjects[1])
console.dir(data.semesters[0].modules[0].subjects[1], {depth: null})
*/
/*
console.log(this.eval(data))
console.dir(data, {depth: null})
*/

},{"type-check":10}],3:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var apply, curry, flip, fix, over, memoize, toString$ = {}.toString;
apply = curry$(function(f, list){
  return f.apply(null, list);
});
curry = function(f){
  return curry$(f);
};
flip = curry$(function(f, x, y){
  return f(y, x);
});
fix = function(f){
  return function(g){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  }(function(g){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  });
};
over = curry$(function(f, g, x, y){
  return f(g(x), g(y));
});
memoize = function(f){
  var memo;
  memo = {};
  return function(){
    var args, res$, i$, to$, key, arg;
    res$ = [];
    for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
      res$.push(arguments[i$]);
    }
    args = res$;
    key = (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = args).length; i$ < len$; ++i$) {
        arg = ref$[i$];
        results$.push(arg + toString$.call(arg).slice(8, -1));
      }
      return results$;
    }()).join('');
    return memo[key] = key in memo
      ? memo[key]
      : f.apply(null, args);
  };
};
module.exports = {
  curry: curry,
  flip: flip,
  fix: fix,
  apply: apply,
  over: over,
  memoize: memoize
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],4:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var each, map, compact, filter, reject, remove, partition, find, head, first, tail, last, initial, empty, reverse, unique, uniqueBy, fold, foldl, fold1, foldl1, foldr, foldr1, unfoldr, concat, concatMap, flatten, difference, intersection, union, countBy, groupBy, andList, orList, any, all, sort, sortWith, sortBy, sum, product, mean, average, maximum, minimum, maximumBy, minimumBy, scan, scanl, scan1, scanl1, scanr, scanr1, slice, take, drop, splitAt, takeWhile, dropWhile, span, breakList, zip, zipWith, zipAll, zipAllWith, at, elemIndex, elemIndices, findIndex, findIndices, toString$ = {}.toString;
each = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    f(x);
  }
  return xs;
});
map = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    results$.push(f(x));
  }
  return results$;
});
compact = function(xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      results$.push(x);
    }
  }
  return results$;
};
filter = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
reject = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
remove = curry$(function(el, xs){
  var i, x$;
  i = elemIndex(el, xs);
  x$ = xs.slice();
  if (i != null) {
    x$.splice(i, 1);
  }
  return x$;
});
partition = curry$(function(f, xs){
  var passed, failed, i$, len$, x;
  passed = [];
  failed = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    (f(x) ? passed : failed).push(x);
  }
  return [passed, failed];
});
find = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return x;
    }
  }
});
head = first = function(xs){
  return xs[0];
};
tail = function(xs){
  if (!xs.length) {
    return;
  }
  return xs.slice(1);
};
last = function(xs){
  return xs[xs.length - 1];
};
initial = function(xs){
  if (!xs.length) {
    return;
  }
  return xs.slice(0, -1);
};
empty = function(xs){
  return !xs.length;
};
reverse = function(xs){
  return xs.concat().reverse();
};
unique = function(xs){
  var result, i$, len$, x;
  result = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!in$(x, result)) {
      result.push(x);
    }
  }
  return result;
};
uniqueBy = curry$(function(f, xs){
  var seen, i$, len$, x, val, results$ = [];
  seen = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    val = f(x);
    if (in$(val, seen)) {
      continue;
    }
    seen.push(val);
    results$.push(x);
  }
  return results$;
});
fold = foldl = curry$(function(f, memo, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    memo = f(memo, x);
  }
  return memo;
});
fold1 = foldl1 = curry$(function(f, xs){
  return fold(f, xs[0], xs.slice(1));
});
foldr = curry$(function(f, memo, xs){
  var i$, x;
  for (i$ = xs.length - 1; i$ >= 0; --i$) {
    x = xs[i$];
    memo = f(x, memo);
  }
  return memo;
});
foldr1 = curry$(function(f, xs){
  return foldr(f, xs[xs.length - 1], xs.slice(0, -1));
});
unfoldr = curry$(function(f, b){
  var result, x, that;
  result = [];
  x = b;
  while ((that = f(x)) != null) {
    result.push(that[0]);
    x = that[1];
  }
  return result;
});
concat = function(xss){
  return [].concat.apply([], xss);
};
concatMap = curry$(function(f, xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(f(x));
    }
    return results$;
  }()));
});
flatten = function(xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      if (toString$.call(x).slice(8, -1) === 'Array') {
        results$.push(flatten(x));
      } else {
        results$.push(x);
      }
    }
    return results$;
  }()));
};
difference = function(xs){
  var yss, res$, i$, to$, results, len$, x, j$, len1$, ys;
  res$ = [];
  for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  yss = res$;
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
intersection = function(xs){
  var yss, res$, i$, to$, results, len$, x, j$, len1$, ys;
  res$ = [];
  for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  yss = res$;
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (!in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
union = function(){
  var xss, res$, i$, to$, results, len$, xs, j$, len1$, x;
  res$ = [];
  for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  xss = res$;
  results = [];
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    for (j$ = 0, len1$ = xs.length; j$ < len1$; ++j$) {
      x = xs[j$];
      if (!in$(x, results)) {
        results.push(x);
      }
    }
  }
  return results;
};
countBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key] += 1;
    } else {
      results[key] = 1;
    }
  }
  return results;
});
groupBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key].push(x);
    } else {
      results[key] = [x];
    }
  }
  return results;
});
andList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!x) {
      return false;
    }
  }
  return true;
};
orList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      return true;
    }
  }
  return false;
};
any = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return true;
    }
  }
  return false;
});
all = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      return false;
    }
  }
  return true;
});
sort = function(xs){
  return xs.concat().sort(function(x, y){
    if (x > y) {
      return 1;
    } else if (x < y) {
      return -1;
    } else {
      return 0;
    }
  });
};
sortWith = curry$(function(f, xs){
  return xs.concat().sort(f);
});
sortBy = curry$(function(f, xs){
  return xs.concat().sort(function(x, y){
    if (f(x) > f(y)) {
      return 1;
    } else if (f(x) < f(y)) {
      return -1;
    } else {
      return 0;
    }
  });
});
sum = function(xs){
  var result, i$, len$, x;
  result = 0;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result += x;
  }
  return result;
};
product = function(xs){
  var result, i$, len$, x;
  result = 1;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result *= x;
  }
  return result;
};
mean = average = function(xs){
  var sum, i$, len$, x;
  sum = 0;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    sum += x;
  }
  return sum / xs.length;
};
maximum = function(xs){
  var max, i$, ref$, len$, x;
  max = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x > max) {
      max = x;
    }
  }
  return max;
};
minimum = function(xs){
  var min, i$, ref$, len$, x;
  min = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x < min) {
      min = x;
    }
  }
  return min;
};
maximumBy = curry$(function(f, xs){
  var max, i$, ref$, len$, x;
  max = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (f(x) > f(max)) {
      max = x;
    }
  }
  return max;
});
minimumBy = curry$(function(f, xs){
  var min, i$, ref$, len$, x;
  min = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (f(x) < f(min)) {
      min = x;
    }
  }
  return min;
});
scan = scanl = curry$(function(f, memo, xs){
  var last, x;
  last = memo;
  return [memo].concat((function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(last = f(last, x));
    }
    return results$;
  }()));
});
scan1 = scanl1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  return scan(f, xs[0], xs.slice(1));
});
scanr = curry$(function(f, memo, xs){
  xs = xs.concat().reverse();
  return scan(f, memo, xs).reverse();
});
scanr1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  xs = xs.concat().reverse();
  return scan(f, xs[0], xs.slice(1)).reverse();
});
slice = curry$(function(x, y, xs){
  return xs.slice(x, y);
});
take = curry$(function(n, xs){
  if (n <= 0) {
    return xs.slice(0, 0);
  } else {
    return xs.slice(0, n);
  }
});
drop = curry$(function(n, xs){
  if (n <= 0) {
    return xs;
  } else {
    return xs.slice(n);
  }
});
splitAt = curry$(function(n, xs){
  return [take(n, xs), drop(n, xs)];
});
takeWhile = curry$(function(p, xs){
  var len, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  i = 0;
  while (i < len && p(xs[i])) {
    i += 1;
  }
  return xs.slice(0, i);
});
dropWhile = curry$(function(p, xs){
  var len, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  i = 0;
  while (i < len && p(xs[i])) {
    i += 1;
  }
  return xs.slice(i);
});
span = curry$(function(p, xs){
  return [takeWhile(p, xs), dropWhile(p, xs)];
});
breakList = curry$(function(p, xs){
  return span(compose$(p, not$), xs);
});
zip = curry$(function(xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push([x, ys[i]]);
  }
  return result;
});
zipWith = curry$(function(f, xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push(f(x, ys[i]));
  }
  return result;
});
zipAll = function(){
  var xss, res$, i$, to$, minLength, len$, xs, ref$, i, lresult$, j$, results$ = [];
  res$ = [];
  for (i$ = 0, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  xss = res$;
  minLength = undefined;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    lresult$ = [];
    for (j$ = 0, len$ = xss.length; j$ < len$; ++j$) {
      xs = xss[j$];
      lresult$.push(xs[i]);
    }
    results$.push(lresult$);
  }
  return results$;
};
zipAllWith = function(f){
  var xss, res$, i$, to$, minLength, len$, xs, ref$, i, results$ = [];
  res$ = [];
  for (i$ = 1, to$ = arguments.length; i$ < to$; ++i$) {
    res$.push(arguments[i$]);
  }
  xss = res$;
  minLength = undefined;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    results$.push(f.apply(null, (fn$())));
  }
  return results$;
  function fn$(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xss).length; i$ < len$; ++i$) {
      xs = ref$[i$];
      results$.push(xs[i]);
    }
    return results$;
  }
};
at = curry$(function(n, xs){
  if (n < 0) {
    return xs[xs.length + n];
  } else {
    return xs[n];
  }
});
elemIndex = curry$(function(el, xs){
  var i$, len$, i, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (x === el) {
      return i;
    }
  }
});
elemIndices = curry$(function(el, xs){
  var i$, len$, i, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (x === el) {
      results$.push(i);
    }
  }
  return results$;
});
findIndex = curry$(function(f, xs){
  var i$, len$, i, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (f(x)) {
      return i;
    }
  }
});
findIndices = curry$(function(f, xs){
  var i$, len$, i, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (f(x)) {
      results$.push(i);
    }
  }
  return results$;
});
module.exports = {
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  remove: remove,
  partition: partition,
  find: find,
  head: head,
  first: first,
  tail: tail,
  last: last,
  initial: initial,
  empty: empty,
  reverse: reverse,
  difference: difference,
  intersection: intersection,
  union: union,
  countBy: countBy,
  groupBy: groupBy,
  fold: fold,
  fold1: fold1,
  foldl: foldl,
  foldl1: foldl1,
  foldr: foldr,
  foldr1: foldr1,
  unfoldr: unfoldr,
  andList: andList,
  orList: orList,
  any: any,
  all: all,
  unique: unique,
  uniqueBy: uniqueBy,
  sort: sort,
  sortWith: sortWith,
  sortBy: sortBy,
  sum: sum,
  product: product,
  mean: mean,
  average: average,
  concat: concat,
  concatMap: concatMap,
  flatten: flatten,
  maximum: maximum,
  minimum: minimum,
  maximumBy: maximumBy,
  minimumBy: minimumBy,
  scan: scan,
  scan1: scan1,
  scanl: scanl,
  scanl1: scanl1,
  scanr: scanr,
  scanr1: scanr1,
  slice: slice,
  take: take,
  drop: drop,
  splitAt: splitAt,
  takeWhile: takeWhile,
  dropWhile: dropWhile,
  span: span,
  breakList: breakList,
  zip: zip,
  zipWith: zipWith,
  zipAll: zipAll,
  zipAllWith: zipAllWith,
  at: at,
  elemIndex: elemIndex,
  elemIndices: elemIndices,
  findIndex: findIndex,
  findIndices: findIndices
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
function in$(x, xs){
  var i = -1, l = xs.length >>> 0;
  while (++i < l) if (x === xs[i]) return true;
  return false;
}
function compose$() {
  var functions = arguments;
  return function() {
    var i, result;
    result = functions[0].apply(this, arguments);
    for (i = 1; i < functions.length; ++i) {
      result = functions[i](result);
    }
    return result;
  };
}
function not$(x){ return !x; }
},{}],5:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var max, min, negate, abs, signum, quot, rem, div, mod, recip, pi, tau, exp, sqrt, ln, pow, sin, tan, cos, asin, acos, atan, atan2, truncate, round, ceiling, floor, isItNaN, even, odd, gcd, lcm;
max = curry$(function(x$, y$){
  return x$ > y$ ? x$ : y$;
});
min = curry$(function(x$, y$){
  return x$ < y$ ? x$ : y$;
});
negate = function(x){
  return -x;
};
abs = Math.abs;
signum = function(x){
  if (x < 0) {
    return -1;
  } else if (x > 0) {
    return 1;
  } else {
    return 0;
  }
};
quot = curry$(function(x, y){
  return ~~(x / y);
});
rem = curry$(function(x$, y$){
  return x$ % y$;
});
div = curry$(function(x, y){
  return Math.floor(x / y);
});
mod = curry$(function(x$, y$){
  var ref$;
  return ((x$) % (ref$ = y$) + ref$) % ref$;
});
recip = (function(it){
  return 1 / it;
});
pi = Math.PI;
tau = pi * 2;
exp = Math.exp;
sqrt = Math.sqrt;
ln = Math.log;
pow = curry$(function(x$, y$){
  return Math.pow(x$, y$);
});
sin = Math.sin;
tan = Math.tan;
cos = Math.cos;
asin = Math.asin;
acos = Math.acos;
atan = Math.atan;
atan2 = curry$(function(x, y){
  return Math.atan2(x, y);
});
truncate = function(x){
  return ~~x;
};
round = Math.round;
ceiling = Math.ceil;
floor = Math.floor;
isItNaN = function(x){
  return x !== x;
};
even = function(x){
  return x % 2 === 0;
};
odd = function(x){
  return x % 2 !== 0;
};
gcd = curry$(function(x, y){
  var z;
  x = Math.abs(x);
  y = Math.abs(y);
  while (y !== 0) {
    z = x % y;
    x = y;
    y = z;
  }
  return x;
});
lcm = curry$(function(x, y){
  return Math.abs(Math.floor(x / gcd(x, y) * y));
});
module.exports = {
  max: max,
  min: min,
  negate: negate,
  abs: abs,
  signum: signum,
  quot: quot,
  rem: rem,
  div: div,
  mod: mod,
  recip: recip,
  pi: pi,
  tau: tau,
  exp: exp,
  sqrt: sqrt,
  ln: ln,
  pow: pow,
  sin: sin,
  tan: tan,
  cos: cos,
  acos: acos,
  asin: asin,
  atan: atan,
  atan2: atan2,
  truncate: truncate,
  round: round,
  ceiling: ceiling,
  floor: floor,
  isItNaN: isItNaN,
  even: even,
  odd: odd,
  gcd: gcd,
  lcm: lcm
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],6:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var values, keys, pairsToObj, objToPairs, listsToObj, objToLists, empty, each, map, compact, filter, reject, partition, find;
values = function(object){
  var i$, x, results$ = [];
  for (i$ in object) {
    x = object[i$];
    results$.push(x);
  }
  return results$;
};
keys = function(object){
  var x, results$ = [];
  for (x in object) {
    results$.push(x);
  }
  return results$;
};
pairsToObj = function(object){
  var i$, len$, x, resultObj$ = {};
  for (i$ = 0, len$ = object.length; i$ < len$; ++i$) {
    x = object[i$];
    resultObj$[x[0]] = x[1];
  }
  return resultObj$;
};
objToPairs = function(object){
  var key, value, results$ = [];
  for (key in object) {
    value = object[key];
    results$.push([key, value]);
  }
  return results$;
};
listsToObj = curry$(function(keys, values){
  var i$, len$, i, key, resultObj$ = {};
  for (i$ = 0, len$ = keys.length; i$ < len$; ++i$) {
    i = i$;
    key = keys[i$];
    resultObj$[key] = values[i];
  }
  return resultObj$;
});
objToLists = function(object){
  var keys, values, key, value;
  keys = [];
  values = [];
  for (key in object) {
    value = object[key];
    keys.push(key);
    values.push(value);
  }
  return [keys, values];
};
empty = function(object){
  var x;
  for (x in object) {
    return false;
  }
  return true;
};
each = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    f(x);
  }
  return object;
});
map = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    resultObj$[k] = f(x);
  }
  return resultObj$;
});
compact = function(object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (x) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
};
filter = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (f(x)) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
});
reject = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (!f(x)) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
});
partition = curry$(function(f, object){
  var passed, failed, k, x;
  passed = {};
  failed = {};
  for (k in object) {
    x = object[k];
    (f(x) ? passed : failed)[k] = x;
  }
  return [passed, failed];
});
find = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    if (f(x)) {
      return x;
    }
  }
});
module.exports = {
  values: values,
  keys: keys,
  pairsToObj: pairsToObj,
  objToPairs: objToPairs,
  listsToObj: listsToObj,
  objToLists: objToLists,
  empty: empty,
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  partition: partition,
  find: find
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],7:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var split, join, lines, unlines, words, unwords, chars, unchars, reverse, repeat, capitalize, camelize, dasherize;
split = curry$(function(sep, str){
  return str.split(sep);
});
join = curry$(function(sep, xs){
  return xs.join(sep);
});
lines = function(str){
  if (!str.length) {
    return [];
  }
  return str.split('\n');
};
unlines = function(it){
  return it.join('\n');
};
words = function(str){
  if (!str.length) {
    return [];
  }
  return str.split(/[ ]+/);
};
unwords = function(it){
  return it.join(' ');
};
chars = function(it){
  return it.split('');
};
unchars = function(it){
  return it.join('');
};
reverse = function(str){
  return str.split('').reverse().join('');
};
repeat = curry$(function(n, str){
  var result, i$;
  result = '';
  for (i$ = 0; i$ < n; ++i$) {
    result += str;
  }
  return result;
});
capitalize = function(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
};
camelize = function(it){
  return it.replace(/[-_]+(.)?/g, function(arg$, c){
    return (c != null ? c : '').toUpperCase();
  });
};
dasherize = function(str){
  return str.replace(/([^-A-Z])([A-Z]+)/g, function(arg$, lower, upper){
    return lower + "-" + (upper.length > 1
      ? upper
      : upper.toLowerCase());
  }).replace(/^([A-Z]+)/, function(arg$, upper){
    if (upper.length > 1) {
      return upper + "-";
    } else {
      return upper.toLowerCase();
    }
  });
};
module.exports = {
  split: split,
  join: join,
  lines: lines,
  unlines: unlines,
  words: words,
  unwords: unwords,
  chars: chars,
  unchars: unchars,
  reverse: reverse,
  repeat: repeat,
  capitalize: capitalize,
  camelize: camelize,
  dasherize: dasherize
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],8:[function(require,module,exports){
// Generated by LiveScript 1.6.0
var Func, List, Obj, Str, Num, id, isType, replicate, prelude, toString$ = {}.toString;
Func = require('./Func.js');
List = require('./List.js');
Obj = require('./Obj.js');
Str = require('./Str.js');
Num = require('./Num.js');
id = function(x){
  return x;
};
isType = curry$(function(type, x){
  return toString$.call(x).slice(8, -1) === type;
});
replicate = curry$(function(n, x){
  var i$, results$ = [];
  for (i$ = 0; i$ < n; ++i$) {
    results$.push(x);
  }
  return results$;
});
Str.empty = List.empty;
Str.slice = List.slice;
Str.take = List.take;
Str.drop = List.drop;
Str.splitAt = List.splitAt;
Str.takeWhile = List.takeWhile;
Str.dropWhile = List.dropWhile;
Str.span = List.span;
Str.breakStr = List.breakList;
prelude = {
  Func: Func,
  List: List,
  Obj: Obj,
  Str: Str,
  Num: Num,
  id: id,
  isType: isType,
  replicate: replicate
};
prelude.each = List.each;
prelude.map = List.map;
prelude.filter = List.filter;
prelude.compact = List.compact;
prelude.reject = List.reject;
prelude.partition = List.partition;
prelude.find = List.find;
prelude.head = List.head;
prelude.first = List.first;
prelude.tail = List.tail;
prelude.last = List.last;
prelude.initial = List.initial;
prelude.empty = List.empty;
prelude.reverse = List.reverse;
prelude.difference = List.difference;
prelude.intersection = List.intersection;
prelude.union = List.union;
prelude.countBy = List.countBy;
prelude.groupBy = List.groupBy;
prelude.fold = List.fold;
prelude.foldl = List.foldl;
prelude.fold1 = List.fold1;
prelude.foldl1 = List.foldl1;
prelude.foldr = List.foldr;
prelude.foldr1 = List.foldr1;
prelude.unfoldr = List.unfoldr;
prelude.andList = List.andList;
prelude.orList = List.orList;
prelude.any = List.any;
prelude.all = List.all;
prelude.unique = List.unique;
prelude.uniqueBy = List.uniqueBy;
prelude.sort = List.sort;
prelude.sortWith = List.sortWith;
prelude.sortBy = List.sortBy;
prelude.sum = List.sum;
prelude.product = List.product;
prelude.mean = List.mean;
prelude.average = List.average;
prelude.concat = List.concat;
prelude.concatMap = List.concatMap;
prelude.flatten = List.flatten;
prelude.maximum = List.maximum;
prelude.minimum = List.minimum;
prelude.maximumBy = List.maximumBy;
prelude.minimumBy = List.minimumBy;
prelude.scan = List.scan;
prelude.scanl = List.scanl;
prelude.scan1 = List.scan1;
prelude.scanl1 = List.scanl1;
prelude.scanr = List.scanr;
prelude.scanr1 = List.scanr1;
prelude.slice = List.slice;
prelude.take = List.take;
prelude.drop = List.drop;
prelude.splitAt = List.splitAt;
prelude.takeWhile = List.takeWhile;
prelude.dropWhile = List.dropWhile;
prelude.span = List.span;
prelude.breakList = List.breakList;
prelude.zip = List.zip;
prelude.zipWith = List.zipWith;
prelude.zipAll = List.zipAll;
prelude.zipAllWith = List.zipAllWith;
prelude.at = List.at;
prelude.elemIndex = List.elemIndex;
prelude.elemIndices = List.elemIndices;
prelude.findIndex = List.findIndex;
prelude.findIndices = List.findIndices;
prelude.apply = Func.apply;
prelude.curry = Func.curry;
prelude.flip = Func.flip;
prelude.fix = Func.fix;
prelude.over = Func.over;
prelude.split = Str.split;
prelude.join = Str.join;
prelude.lines = Str.lines;
prelude.unlines = Str.unlines;
prelude.words = Str.words;
prelude.unwords = Str.unwords;
prelude.chars = Str.chars;
prelude.unchars = Str.unchars;
prelude.repeat = Str.repeat;
prelude.capitalize = Str.capitalize;
prelude.camelize = Str.camelize;
prelude.dasherize = Str.dasherize;
prelude.values = Obj.values;
prelude.keys = Obj.keys;
prelude.pairsToObj = Obj.pairsToObj;
prelude.objToPairs = Obj.objToPairs;
prelude.listsToObj = Obj.listsToObj;
prelude.objToLists = Obj.objToLists;
prelude.max = Num.max;
prelude.min = Num.min;
prelude.negate = Num.negate;
prelude.abs = Num.abs;
prelude.signum = Num.signum;
prelude.quot = Num.quot;
prelude.rem = Num.rem;
prelude.div = Num.div;
prelude.mod = Num.mod;
prelude.recip = Num.recip;
prelude.pi = Num.pi;
prelude.tau = Num.tau;
prelude.exp = Num.exp;
prelude.sqrt = Num.sqrt;
prelude.ln = Num.ln;
prelude.pow = Num.pow;
prelude.sin = Num.sin;
prelude.tan = Num.tan;
prelude.cos = Num.cos;
prelude.acos = Num.acos;
prelude.asin = Num.asin;
prelude.atan = Num.atan;
prelude.atan2 = Num.atan2;
prelude.truncate = Num.truncate;
prelude.round = Num.round;
prelude.ceiling = Num.ceiling;
prelude.floor = Num.floor;
prelude.isItNaN = Num.isItNaN;
prelude.even = Num.even;
prelude.odd = Num.odd;
prelude.gcd = Num.gcd;
prelude.lcm = Num.lcm;
prelude.VERSION = '1.2.1';
module.exports = prelude;
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{"./Func.js":3,"./List.js":4,"./Num.js":5,"./Obj.js":6,"./Str.js":7}],9:[function(require,module,exports){
// Generated by LiveScript 1.6.0
(function(){
  var ref$, any, all, isItNaN, types, defaultType, toString$ = {}.toString;
  ref$ = require('prelude-ls'), any = ref$.any, all = ref$.all, isItNaN = ref$.isItNaN;
  types = {
    Number: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it);
      }
    },
    NaN: {
      typeOf: 'Number',
      validate: isItNaN
    },
    Int: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it) && it % 1 === 0;
      }
    },
    Float: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it);
      }
    },
    Date: {
      typeOf: 'Date',
      validate: function(it){
        return !isItNaN(it.getTime());
      }
    }
  };
  defaultType = {
    array: 'Array',
    tuple: 'Array'
  };
  function checkArray(input, type, options){
    return all(function(it){
      return checkMultiple(it, type.of, options);
    }, input);
  }
  function checkTuple(input, type, options){
    var i, i$, ref$, len$, types;
    i = 0;
    for (i$ = 0, len$ = (ref$ = type.of).length; i$ < len$; ++i$) {
      types = ref$[i$];
      if (!checkMultiple(input[i], types, options)) {
        return false;
      }
      i++;
    }
    return input.length <= i;
  }
  function checkFields(input, type, options){
    var inputKeys, numInputKeys, k, numOfKeys, key, ref$, types;
    inputKeys = {};
    numInputKeys = 0;
    for (k in input) {
      inputKeys[k] = true;
      numInputKeys++;
    }
    numOfKeys = 0;
    for (key in ref$ = type.of) {
      types = ref$[key];
      if (!checkMultiple(input[key], types, options)) {
        return false;
      }
      if (inputKeys[key]) {
        numOfKeys++;
      }
    }
    return type.subset || numInputKeys === numOfKeys;
  }
  function checkStructure(input, type, options){
    if (!(input instanceof Object)) {
      return false;
    }
    switch (type.structure) {
    case 'fields':
      return checkFields(input, type, options);
    case 'array':
      return checkArray(input, type, options);
    case 'tuple':
      return checkTuple(input, type, options);
    }
  }
  function check(input, typeObj, options){
    var type, structure, setting, that;
    type = typeObj.type, structure = typeObj.structure;
    if (type) {
      if (type === '*') {
        return true;
      }
      setting = options.customTypes[type] || types[type];
      if (setting) {
        return (setting.typeOf === void 8 || setting.typeOf === toString$.call(input).slice(8, -1)) && setting.validate(input);
      } else {
        return type === toString$.call(input).slice(8, -1) && (!structure || checkStructure(input, typeObj, options));
      }
    } else if (structure) {
      if (that = defaultType[structure]) {
        if (that !== toString$.call(input).slice(8, -1)) {
          return false;
        }
      }
      return checkStructure(input, typeObj, options);
    } else {
      throw new Error("No type defined. Input: " + input + ".");
    }
  }
  function checkMultiple(input, types, options){
    if (toString$.call(types).slice(8, -1) !== 'Array') {
      throw new Error("Types must be in an array. Input: " + input + ".");
    }
    return any(function(it){
      return check(input, it, options);
    }, types);
  }
  module.exports = function(parsedType, input, options){
    options == null && (options = {});
    if (options.customTypes == null) {
      options.customTypes = {};
    }
    return checkMultiple(input, parsedType, options);
  };
}).call(this);

},{"prelude-ls":8}],10:[function(require,module,exports){
// Generated by LiveScript 1.6.0
(function(){
  var VERSION, parseType, parsedTypeCheck, typeCheck;
  VERSION = '0.4.0';
  parseType = require('./parse-type');
  parsedTypeCheck = require('./check');
  typeCheck = function(type, input, options){
    return parsedTypeCheck(parseType(type), input, options);
  };
  module.exports = {
    VERSION: VERSION,
    typeCheck: typeCheck,
    parsedTypeCheck: parsedTypeCheck,
    parseType: parseType
  };
}).call(this);

},{"./check":9,"./parse-type":11}],11:[function(require,module,exports){
// Generated by LiveScript 1.6.0
(function(){
  var identifierRegex, tokenRegex;
  identifierRegex = /[\$\w]+/;
  function peek(tokens){
    var token;
    token = tokens[0];
    if (token == null) {
      throw new Error('Unexpected end of input.');
    }
    return token;
  }
  function consumeIdent(tokens){
    var token;
    token = peek(tokens);
    if (!identifierRegex.test(token)) {
      throw new Error("Expected text, got '" + token + "' instead.");
    }
    return tokens.shift();
  }
  function consumeOp(tokens, op){
    var token;
    token = peek(tokens);
    if (token !== op) {
      throw new Error("Expected '" + op + "', got '" + token + "' instead.");
    }
    return tokens.shift();
  }
  function maybeConsumeOp(tokens, op){
    var token;
    token = tokens[0];
    if (token === op) {
      return tokens.shift();
    } else {
      return null;
    }
  }
  function consumeArray(tokens){
    var types;
    consumeOp(tokens, '[');
    if (peek(tokens) === ']') {
      throw new Error("Must specify type of Array - eg. [Type], got [] instead.");
    }
    types = consumeTypes(tokens);
    consumeOp(tokens, ']');
    return {
      structure: 'array',
      of: types
    };
  }
  function consumeTuple(tokens){
    var components;
    components = [];
    consumeOp(tokens, '(');
    if (peek(tokens) === ')') {
      throw new Error("Tuple must be of at least length 1 - eg. (Type), got () instead.");
    }
    for (;;) {
      components.push(consumeTypes(tokens));
      maybeConsumeOp(tokens, ',');
      if (')' === peek(tokens)) {
        break;
      }
    }
    consumeOp(tokens, ')');
    return {
      structure: 'tuple',
      of: components
    };
  }
  function consumeFields(tokens){
    var fields, subset, ref$, key, types;
    fields = {};
    consumeOp(tokens, '{');
    subset = false;
    for (;;) {
      if (maybeConsumeOp(tokens, '...')) {
        subset = true;
        break;
      }
      ref$ = consumeField(tokens), key = ref$[0], types = ref$[1];
      fields[key] = types;
      maybeConsumeOp(tokens, ',');
      if ('}' === peek(tokens)) {
        break;
      }
    }
    consumeOp(tokens, '}');
    return {
      structure: 'fields',
      of: fields,
      subset: subset
    };
  }
  function consumeField(tokens){
    var key, types;
    key = consumeIdent(tokens);
    consumeOp(tokens, ':');
    types = consumeTypes(tokens);
    return [key, types];
  }
  function maybeConsumeStructure(tokens){
    switch (tokens[0]) {
    case '[':
      return consumeArray(tokens);
    case '(':
      return consumeTuple(tokens);
    case '{':
      return consumeFields(tokens);
    }
  }
  function consumeType(tokens){
    var token, wildcard, type, structure;
    token = peek(tokens);
    wildcard = token === '*';
    if (wildcard || identifierRegex.test(token)) {
      type = wildcard
        ? consumeOp(tokens, '*')
        : consumeIdent(tokens);
      structure = maybeConsumeStructure(tokens);
      if (structure) {
        return structure.type = type, structure;
      } else {
        return {
          type: type
        };
      }
    } else {
      structure = maybeConsumeStructure(tokens);
      if (!structure) {
        throw new Error("Unexpected character: " + token);
      }
      return structure;
    }
  }
  function consumeTypes(tokens){
    var lookahead, types, typesSoFar, typeObj, type, structure;
    if ('::' === peek(tokens)) {
      throw new Error("No comment before comment separator '::' found.");
    }
    lookahead = tokens[1];
    if (lookahead != null && lookahead === '::') {
      tokens.shift();
      tokens.shift();
    }
    types = [];
    typesSoFar = {};
    if ('Maybe' === peek(tokens)) {
      tokens.shift();
      types = [
        {
          type: 'Undefined'
        }, {
          type: 'Null'
        }
      ];
      typesSoFar = {
        Undefined: true,
        Null: true
      };
    }
    for (;;) {
      typeObj = consumeType(tokens), type = typeObj.type, structure = typeObj.structure;
      if (!typesSoFar[type]) {
        types.push(typeObj);
      }
      if (structure == null) {
        typesSoFar[type] = true;
      }
      if (!maybeConsumeOp(tokens, '|')) {
        break;
      }
    }
    return types;
  }
  tokenRegex = RegExp('\\.\\.\\.|::|->|' + identifierRegex.source + '|\\S', 'g');
  module.exports = function(input){
    var tokens, e;
    if (!input.length) {
      throw new Error('No type specified.');
    }
    tokens = input.match(tokenRegex) || [];
    if (in$('->', tokens)) {
      throw new Error("Function types are not supported.\ To validate that something is a function, you may use 'Function'.");
    }
    try {
      return consumeTypes(tokens);
    } catch (e$) {
      e = e$;
      throw new Error(e.message + " - Remaining tokens: " + JSON.stringify(tokens) + " - Initial input: '" + input + "'");
    }
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);

},{}]},{},[1])(1)
});
