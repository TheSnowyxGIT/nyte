
class SubjectBox {
    static getHTMLSubjectBox() {
        let obj = $($("#SubjectBox")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    constructor(subject, parent) {
        this.subject = subject;
        this.module = parent.module;
        this.semester = parent.semester.semester;
        this.params_url = `semester=${this.semester.name}&module=${this.module.code}&subject=${subject.code}`;
        this.loadHTML();
    }

    loadHTML() {
        this.obj = SubjectBox.getHTMLSubjectBox();

        $(this.obj).find(".code").text(this.subject.code);

        $(this.obj).find("a").on("click", () => {
            window.location.replace("/ranking?" + this.params_url);
        })
    }

    appendTo(jqueryElt) {
        $(this.obj).appendTo(jqueryElt);
    }
}


class ModuleBox {
    static getHTMLModuleBox() {
        let obj = $($("#ModuleBox")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    constructor(module, parent) {
        this.module = module;
        this.semester = parent;
        this.params_url = `semester=${this.semester.semester.name}&module=${module.code}`;
        this.loadHTML();
    }

    loadHTML() {
        this.obj = ModuleBox.getHTMLModuleBox();

        $(this.obj).find(".code").text(this.module.code);

        $(this.obj).find("a").on("click", () => {
            window.location.replace("/ranking?" + this.params_url);
        })

        $(this.obj).find("bottom").empty();
        Object.values(this.module.subjects).forEach(subject => {
            let subject_obj = new SubjectBox(subject, this);
            subject_obj.appendTo($(this.obj).children().eq(1));
        })
    }

    appendTo(jqueryElt) {
        $(this.obj).appendTo(jqueryElt);
    }
}

class SemesterBox {
    static getHTMLSemesterBox() {
        let obj = $($("#SemesterBox")[0]).clone();
        obj.removeAttr('id');
        return obj;
    }
    constructor(semester) {
        this.semester = semester;
        this.params_url = `semester=${semester.name}`;
        this.loadHTML();
    }

    loadHTML() {
        this.obj = SemesterBox.getHTMLSemesterBox();

        $(this.obj).find(".name").text(this.semester.name);

        $(this.obj).find("a").on("click", () => {
            window.location.replace("/ranking?" + this.params_url);
        })

        $(this.obj).find("bottom").empty();
        Object.values(this.semester.modules).forEach(module => {
            let module_obj = new ModuleBox(module, this);
            module_obj.appendTo($(this.obj).children().eq(1));
        })
    }

    appendTo(jqueryElt) {
        $(this.obj).appendTo(jqueryElt);
    }
}


function generate_page() {
    $(".semester_list").empty();
    Object.values(semesters).forEach(semester => {
        let semester_obj = new SemesterBox(semester);
        semester_obj.appendTo($(".semester_list"));
    })
}

$(document).ready(() => {
    generate_page();
})
