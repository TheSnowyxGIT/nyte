class Control {
    /*--- prefabs ---*/
    static getBasicHTML() {
        let obj = $($("#basicCBOX")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    static getCheckHTML() {
        let obj = $($("#checkCBOX")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    static getHTMLByType(type) {
        if (type === "LINEAR") {
            return this.getBasicHTML();
        } else if (type === "THRESHOLDS") {
            return this.getCheckHTML();
        } else {
            return this.getBasicHTML();
        }
    }
    /*--- refreshs ---*/
    static refreshHTMLBasic(controlItem) {
        const value = controlItem.control.value;
        if (!value) {
            $(controlItem.obj).find("input").val("");
        } else if (!isNaN(value.grade)) {
            $(controlItem.obj).find("input").val(value.grade.toFixed(2));
        } else {
            $(controlItem.obj).find("input").val("error");
        }
        // set coef
        $(controlItem.obj).find(".coef").text(`[x${controlItem.control.data.coef.toFixed(2)}]`);
    }
    static refreshHTMLCheck(controlItem) {
        const value = controlItem.control.value;
        $(controlItem.obj).removeClass("success");
        $(controlItem.obj).removeClass("fail");
        if (!value) {
            ;
        } else if (value.success) {
            $(controlItem.obj).addClass("success");
        } else {
            $(controlItem.obj).addClass("fail");
        }
    }
    static refreshHTMLByType(controlItem) {
        if (controlItem.type === "LINEAR") {
            return this.refreshHTMLBasic(controlItem);
        } else if (controlItem.type === "THRESHOLDS") {
            return this.refreshHTMLCheck(controlItem);
        } else {
            return this.refreshHTMLBasic(controlItem);
        }
    }
    /* Events */
    static setChangeEventBasic(controlItem){
        $(controlItem.obj).find("input").on("change", () => {
            var input = $(controlItem.obj).find("input");

            if ($(input).val() == "") {
                controlItem.control.value = undefined;
                socket.emit("reset_grade", { controlId: controlItem.control.id});
            }
            else {
                let value = parseFloat($(input).val());
                if (value < 0 || value > 20 || isNaN(value)) {
                    let new_value = controlItem.control.value;
                    if (typeof new_value == "undefined") {
                        $(input).val("");
                    } else {
                        $(input).val(new_value.grade.toFixed(2));
                    }
                } else {
                    controlItem.control.value = {grade: value};
                    $(input).val(value.toFixed(2))
                    // send grade to server
                    socket.emit("set_grade", { controlId: controlItem.control.id, value: {
                        grade: value
                    }});
                }
            }
            controlItem.sctype.subject.module.refreshHTML();
        })
    }
    static setChangeEventCheck(controlItem){
        $(controlItem.obj).find("button").on("click", () => {

            if ($(controlItem.obj).hasClass("success")){
                controlItem.control.value = {success: false};
                socket.emit("set_grade", { controlId: controlItem.control.id, value: {
                    success: false
                }});
            } else if ($(controlItem.obj).hasClass("fail")) {
                controlItem.control.value = undefined;
                socket.emit("reset_grade", { controlId: controlItem.control.id});
            } else {
                controlItem.control.value = {success: true};
                socket.emit("set_grade", { controlId: controlItem.control.id, value: {
                    success: true
                }});
            }
            controlItem.sctype.subject.module.refreshHTML();
        })
    }
    static setChangeEvent(controlItem){
        if (controlItem.type === "LINEAR") {
            this.setChangeEventBasic(controlItem);
        } else if (controlItem.type === "THRESHOLDS") {
            return this.setChangeEventCheck(controlItem);
        } else {
            this.setChangeEventBasic(controlItem);
        }
    }

    constructor(control, type, parent) {
        this.type = type;
        this.control = control;
        this.sctype = parent;
        this.loadHTML();
    }


    loadHTML() {
        this.obj = Control.getHTMLByType(this.type);

        $(this.obj).find(".noteName").text(this.control.name);

        Control.setChangeEvent(this)

        this.refreshHTML();
    }

    refreshHTML() {
        Control.refreshHTMLByType(this);
    }

    appendTo(jqueryElement) {
        $(this.obj).appendTo(jqueryElement);
    }
}


class ScType {
    /*--- prefabs ---*/
    static getHTML() {
        let obj = $($("#CTBOX")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }


    constructor(sctype, parent) {
        this.sctype = sctype;
        this.controls = [];
        this.subject = parent;
        this.loadHTML();
    }

    loadHTML() {
        this.obj = ScType.getHTML();

        $(this.obj).find(".controlName").text(this.sctype.name);
        $(this.obj).find(".controlType").text(`[ ${this.sctype.type} ]`);
        $(this.obj).find(".controlCoef").text(`[x${this.sctype.coef.toFixed(2)}]`);

        $(this.obj).find(".noteBoxes").empty();
        this.sctype.controls.forEach((control) => {
            let _control = new Control(control, this.sctype.type, this);
            _control.appendTo($(this.obj).find(".noteBoxes"));
            this.controls.push(_control)
        });

        this.refreshHTML();
    }

    refreshHTML() {
        this.controls.forEach(control => {
            control.refreshHTML();
        })
    }

    appendTo(jqueryElement) {
        $(this.obj).appendTo(jqueryElement);
    }
}

class Subject {
    /*--- prefabs ---*/
    static getHTML() {
        let obj = $($("#SubjectHTML")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    static getAVGHTML() {
        let obj = $($("#CTypeAVG")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }

    constructor(subject, parent) {
        this.subject = subject;
        this.sctypes = [];
        this.module = parent;
        this.loadHTML();
    }

    loadHTML() {
        this.obj = Subject.getHTML();

        $(this.obj).find(".boxSubject").text(this.subject.name);

        $(this.obj).find(".boxNotes").empty();
        this.subject.sctypes.forEach((ct) => {
            let _sctype = new ScType(ct, this);
            _sctype.appendTo($(this.obj).find(".boxNotes"));
            this.sctypes.push(_sctype)
        });

        this.refreshHTML();
    }

    refreshHTML() {
        const average = this.subject.eval.value;
        if (isNaN(average) || average == null) {
            $(this.obj).find(".dial").find(".dialVal").text("---");
            $(this.obj).find(".dial").addClass("empty");
        } else {
            $(this.obj).find(".dial").find(".dialVal").text(average.toFixed(2));
            $(this.obj).find(".dial").get(0).style.setProperty("--note", average.toFixed(2));
            $(this.obj).find(".dial").removeClass("empty");
        }

        $(this.obj).find(".boxDesc").empty();
        this.subject.sctypes.forEach((ct) => {
            let _sctype_avg = Subject.getAVGHTML();

            $(_sctype_avg).find(".name").text(ct.name);
            if (isNaN(ct.eval.value) || ct.eval.value == null) {
                $(_sctype_avg).find('.progressBar').addClass("empty");
            } else {
                $(_sctype_avg).find('.progressBar').removeClass("empty");
                $(_sctype_avg).find('.progressBar').find('.slide').get(0).style.setProperty("--value", ct.eval.value.toFixed(2));
            }

            $(this.obj).find(".boxDesc").append(_sctype_avg);
        })



        this.sctypes.forEach(sctype => {
            sctype.refreshHTML();
        })
    }

    appendTo(jqueryElement) {
        $(this.obj).appendTo(jqueryElement);
    }
}

class Module {
    /*--- prefabs ---*/
    static getModuleHTML() {
        let obj = $($("#ModuleBOX")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    static getValidSubjectHTML() {
        let obj = $($("#ValidSubjectBOX")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }

    constructor(module) {
        this.module = module;
        this.subjects = [];
        this.loadHTML();
    }

    loadHTML() {
        this.obj = Module.getModuleHTML();

        $(this.obj).find(".module-head").find(".title").find("h2").text(this.module.name);

        $(this.obj).find(".subject-container").empty();
        this.subjects = [];
        this.module.subjects.forEach((subject) => {
            let _subject = new Subject(subject, this);
            _subject.appendTo($(this.obj).find(".subject-container"));
            this.subjects.push(_subject)
        });

        this.refreshHTML();
    }

    refreshHTML() {

        calculator.eval_module(this.module)

        const percent = this.module.eval.completed_controls / this.module.eval.total_controls * 100.0;
        $(this.obj).find(".module-head").find(".title").find("p").text(`${percent.toFixed(2)}% rempli`)

        const average = this.module.eval.value;
        const status = this.module.eval.status;
        if (isNaN(average) || average == null) {
            $(this.obj).find(".module-head").find(".progressBar").addClass("empty");

            $(this.obj).find(".module-head").find(".average").text("- / -");
        } else {
            $(this.obj).find(".module-head").find(".progressBar").removeClass("empty");
            $(this.obj).find(".module-head").find(".progressBar").find('.slide').get(0).style.setProperty("--value", average.toFixed(2));

            $(this.obj).find(".module-head").find(".average").find("span").text(`${average.toFixed(2)} / 20`);
        }

        let valid_area = $(this.obj).find(".valid-area")
        // do classes
        valid_area.find(".main").find(".value").removeClass("Valid")
        valid_area.find(".main").find(".value").removeClass("NoValid")
        valid_area.find(".main").find(".value").removeClass("none")
        if (status == "Validated") {
            valid_area.find(".main").find(".value").text("Validé")
            valid_area.find(".main").find(".value").addClass("Valid")
        } else if (status == "ValidatedCO") {
            valid_area.find(".main").find(".value").text("Validé Co")
            valid_area.find(".main").find(".value").addClass("Valid")
        } else if (status == "Unvalidated") {
            valid_area.find(".main").find(".value").text("Non Validé")
            valid_area.find(".main").find(".value").addClass("NoValid")
        } else {
            valid_area.find(".main").find(".value").text("Pas de notes")
            valid_area.find(".main").find(".value").addClass("none")
        }

        valid_area.find(".subjects").empty()
        this.module.subjects.forEach(subject => {
            let obj = Module.getValidSubjectHTML();

            $(obj).find(".name").text(subject.name)

            $(obj).find(".value").removeClass("Valid")
            $(obj).find(".value").removeClass("NoValid")
            $(obj).find(".value").removeClass("none")

            if (subject.eval.status == "Validated") {
                $(obj).find(".value").text("Validé")
                $(obj).find(".value").addClass("Valid")
            } else if (subject.eval.status == "ValidatedCO") {
                $(obj).find(".value").text("Validé Co")
                $(obj).find(".value").addClass("Valid")
            } else if (subject.eval.status == "Unvalidated") {
                $(obj).find(".value").text("Non Validé")
                $(obj).find(".value").addClass("NoValid")
            } else {
                $(obj).find(".value").text("Pas de notes")
                $(obj).find(".value").addClass("none")
            }
            valid_area.find(".subjects").append(obj);
        });

        this.subjects.forEach(subject => {
            subject.refreshHTML();
        })
    }

    remove() {
        $(this.obj).remove();
    }

    appendTo(jqueryElement) {
        $(this.obj).appendTo(jqueryElement);
    }
}

class SemesterList {
    /*--- prefabs ---*/
    static getSemesterBtnHTML() {
        let obj = $($("#SemesterBtnHTML")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }

    constructor(jqueryElment) {
        this.buttons = []
        this.parent = jqueryElment;
        $(this.parent).empty();
    }

    addSemester(semester, clickCallback) {
        let obj = SemesterList.getSemesterBtnHTML();

        $(obj).text(semester.name);

        $(obj).click((e) => clickCallback(e));

        this.buttons.push({
            id: semester.id,
            obj: obj
        });

        $(obj).appendTo(this.parent)
    }

    select(semesterId) {
        this.buttons.forEach(btn => {
            if (btn.id == semesterId) {
                $(btn.obj).addClass("active");
            } else {
                $(btn.obj).removeClass("active");
            }
        })
    }

    removeSemester(semesterId) {
        const mapped = this.buttons.map(obj => obj.id);
        const index = mapped.indexOf(semesterId);
        const button = this.buttons[index];
        $(button.obj).remove();
        this.buttons.splice(index, 1);
    }
}


class ModuleList {
    /*--- prefabs ---*/
    static getModuleBtnHTML() {
        let obj = $($("#ModuleBtnHTML")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }

    constructor(jqueryElment) {
        this.buttons = []
        this.parent = jqueryElment;
        $(".selected-modules-count").find("span").text("0 module selectionné")
        this.clear();
    }

    addModule(module, clickCallback) {
        let obj = ModuleList.getModuleBtnHTML();

        $(obj).find("label").text(module.name);

        $(obj).click((e) => clickCallback(e));

        this.buttons.push({
            id: module.id,
            selected: false,
            obj: obj
        });

        $(obj).appendTo(this.parent)
    }

    clear() {
        $(this.parent).empty();
    }

    toggle(moduleId) {
        const mapped = this.buttons.map(obj => obj.id);
        const index = mapped.indexOf(moduleId);
        const button = this.buttons[index];
        var checked = $(button.obj).find("input").is(":checked");
        if (checked) {
            button.selected = false;
        } else {
            button.selected = true;
        }
        $(button.obj).find("input").attr("checked", !checked);

        let number = this.getNumberSelected();
        let text = `${number} modules selectionnés`
        if (number < 2) {
            text = `${number} module selectionné`
        }
        $(".selected-modules-count").find("span").text(text)
    }

    getNumberSelected() {
        let number = 0;
        for (const btn of this.buttons) {
            if (btn.selected) {
                number += 1;
            }
        }
        return number;
    }

    removeModule(moduleId) {
        const mapped = this.buttons.map(obj => obj.id);
        const index = mapped.indexOf(moduleId);
        const button = this.buttons[index];
        $(button.obj).remove();
        this.buttons.splice(index, 1);
    }
}

class Grade {
    constructor(data) {
        if (!calculator.check(data)) {
            console.log("We cannot create the grade class du to an error in the data given by the server")
            return;
        }


        this.data = data;
        this.moduleBoxes = [];
        this.semesterList = new SemesterList($(".semester-list"));
        this.addSemesters();
        this.selectSemester(data.semesters[data.semesters.length - 1])
    }

    addSemesters() {
        Object.values(this.data.semesters).forEach(semester => {
            this.semesterList.addSemester(semester, () => {
                this.selectSemester(semester);
            });
        })
    }

    setModules(semester) {
        this.moduleList = new ModuleList($(".module-list"));
        this.moduleList.clear();
        this.cleanAllModuleBoxes()
        Object.values(semester.modules).forEach(module => {
            this.moduleList.addModule(module, () => {
                this.toggleModule(module);
            });
            this.toggleModule(module)
        })

    }

    selectSemester(semester) {
        this.semesterList.select(semester.id);
        this.setModules(semester)
    }

    toggleModule(module) {
        this.moduleList.toggle(module.id);
        if (this._moduleIsShow(module.id)) {
            let mapped = this.moduleBoxes.map(obj => obj.moduleId);
            let index = mapped.indexOf(module.id);
            let moduleBox = this.moduleBoxes[index];
            moduleBox.item.remove();
            this.moduleBoxes.splice(index, 1);
        } else {
            const moduleItem = new Module(module);
            moduleItem.appendTo($(".module-container"));
            this.moduleBoxes.push({
                moduleId: module.id,
                item: moduleItem
            })
        }
    }

    cleanAllModuleBoxes() {
        this.moduleBoxes.forEach(moduleBox => {
            moduleBox.item.remove();
        })
        this.moduleBoxes = []
    }

    _moduleIsShow(moduleId) {
        let mapped = this.moduleBoxes.map(obj => obj.moduleId);
        return mapped.some(id => id == moduleId);
    }
}





function clear_modules_list() {
    module_list_boxes = {}
    $(".selected-modules-count").find("span").text("0 module selectionné")
    $(".module-list").empty();
}

function clear_modules() {
    modules_boxes = {};
    $(".module-container").empty();
}

function generate_modules_list(semesterId) {
    clear_modules_list();

    const semester = getById(grades.semesters, semesterId);

    Object.values(semester.modules).forEach((module) => {
        let obj = $(prefabs.module_list_box).clone();

        $(obj).find("label").text(module.name);
        $(obj).attr("semesterId", semester.id)
        $(obj).attr("index", module.id)

        module_list_boxes[module.id] = obj;

        $(".module-list").append(obj);
    })
}

function generate_semester_list() {
    $(".semester-list").empty();

    let sorted_semester = Object.values(grades.semesters).sort((a, b) => a.name > b.name);
    sorted_semester.forEach(semester => {
        let obj = $(prefabs.semester_list_box).clone();

        $(obj).text(semester.name);
        $(obj).attr("semesterId", semester.id)

        semester_list_boxes[semester.id] = obj;

        $(".semester-list").append(obj);
    })
}



function select_module(semesterId, moduleId) {
    $(module_list_boxes[moduleId]).addClass("active");

    evaluate();

    if (!Object.values(modules_boxes).some(obj => obj.moduleId == moduleId)) {
        append_module_box(moduleId, semesterId)
    }

    let count = Object.keys(modules_boxes).length;
    if (count < 2) {
        $(".selected-modules-count").find("span").text(`${count} module selectionné`)
    } else {
        $(".selected-modules-count").find("span").text(`${count} modules selectionnés`)
    }
}

function unselect_module(semester, index) {
    $(module_list_boxes[index]).removeClass("active");

    let a = -1;
    for (let i = 0; i < modules_boxes.length; i++) {
        const module_box = modules_boxes[i];
        if (module_box.semester == semester && module_box.index == index) {
            $(module_box.obj).remove();
            a = i;
            break;
        }
    }
    if (a >= 0) {
        modules_boxes.splice(a, 1);
    }

    let count = modules_boxes.length;
    if (count < 2)
        $(".selected-modules-count").find("span").text(`${count} module selectionné`)
    else
        $(".selected-modules-count").find("span").text(`${count} modules selectionnés`)
}


/*
function create_ct_avg_box(ct_data) {
    let obj = $(prefabs.ct_avg_box).clone();
    let progressBar = obj.find(".progressBar");

    $(obj).find(".name").text(ct_data.name);

    const average = ct_data.eval.value;
    if (isNaN(average)) {
        $(progressBar).addClass("empty");
    } else {
        $(progressBar).removeClass("empty");
        $(progressBar).find('.slide').get(0).style.setProperty("--value", average.toFixed(2));
    }

    return obj;
}

*/


function remove_grades(control) {
    control.value = undefined;
}


function evaluate() {
    calculator.eval(grades)
}

var grade;
function generate_page() {
    grade = new Grade(grades);
}


$(document).ready(() => {
    generate_page();
})



$(document).on("click", ".boxSep", function (e) {
    if ($(this).parent().hasClass("boxDeployed")) {
        $(this).parent().removeClass("boxDeployed")
    } else {
        $(this).parent().addClass("boxDeployed")
    }
})

/*

$(document).on("change", ".noteRes", function (e) {
    let control = $(this).closest(".noteBox");
    let control_index = control.attr("index");
    let ct = $(control).closest(".control");
    let ct_index = ct.attr("index");
    let box = $(ct).closest(".box");
    let subject_index = box.attr("index");
    let module_box = $(box).closest(".module-box");
    let module_index = module_box.attr("index");
    let semester = module_box.attr("semester");

    if ($(this).val() == "") {
        remove_grades(grades[semester][module_index].data[subject_index].data[ct_index].data[control_index]);
        socket.emit("reset_grade", { control_id: control_id = grades[semester][module_index].data[subject_index].data[ct_index].data[control_index].id });
    }
    else {
        let value = parseFloat($(this).val());
        if (value < 0 || value > 20 || isNaN(value)) {
            let new_value = 0;
            new_value = grades[semester][module_index].data[subject_index].data[ct_index].data[control_index].value;
            if (typeof new_value == "undefined") {
                $(this).val("");
            } else {
                $(this).val(new_value.toFixed(2));
            }
        } else {
            let control_id;
            grades[semester][module_index].data[subject_index].data[ct_index].data[control_index].value = value;
            control_id = grades[semester][module_index].data[subject_index].data[ct_index].data[control_index].id;
            $(this).val(value.toFixed(2))
            // send grade to server
            socket.emit("set_grade", { control_id: control_id, value: value });
        }
    }

    evaluate(semester, module_index);
    refresh_averages();
})

$(document).on("click", ".semester-btn", function (e) {
    let semester = $(this).attr("semester");
    if (!$(this).hasClass("active")) {
        select_semester(semester);
    }
})


$(document).on("click", ".module-btn", function (e) {
    let semester = $(this).attr("semester");
    let index = $(this).attr("index");

    if ($(this).hasClass("active")) {
        unselect_module(semester, index)
    } else {
        select_module(semester, index)
    }
})


*/
