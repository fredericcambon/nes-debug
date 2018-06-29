import blessed from "blessed";

function TableEditForm(options) {
  var self = this;

  if (!(this instanceof blessed.Node)) {
    return new TableEditForm(options);
  }

  this.options = options;

  blessed.Box.call(this, options);

  this.form = blessed.form({
    parent: this,
    keys: true,
    left: 0,
    top: 0,
    width: "90%",
    left: "center",
    content: "Submit or cancel?"
  });

  var label1 = blessed.text({
    parent: this,
    top: 3,
    left: 5,
    content: "ADDR:"
  });
  var firstName = blessed.textbox({
    parent: this.form,
    name: "firstname",
    top: 4,
    left: 5,
    height: 3,
    inputOnFocus: true,
    mouse: true,
    content: "first",
    border: {
      type: "line"
    },
    focus: {
      fg: "blue"
    }
  });
  var label2 = blessed.text({
    parent: this,
    content: "VALUE:",
    top: 8,
    left: 5
  });
  var lastName = blessed.textbox({
    parent: this.form,
    name: "lastname",
    top: 9,
    left: 5,
    height: 3,
    mouse: true,
    inputOnFocus: true,
    content: "last",
    border: {
      type: "line"
    },
    focus: {
      fg: "blue"
    }
  });
  /*
  this.submit = blessed.button({
    parent: this.form,
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
      left: 1,
      right: 1
    },
    left: 10,
    top: 3,
    shrink: true,
    name: "submit",
    content: "submit",
    style: {
      bg: "blue",
      focus: {
        bg: "red"
      },
      hover: {
        bg: "red"
      }
    }
  });

  this.addr = blessed.textarea({
    parent: this.form,
    mouse: true,
    keys: true,
    name: "firstname",
    top: 4,
    left: 5,
    height: 3,
    width: 10,
    inputOnFocus: true,
    content: "first",
    border: {
      type: "line"
    },
    focus: {
      fg: "blue"
    }
  });

  this.cancel = blessed.button({
    parent: this.form,
    mouse: true,
    keys: true,
    shrink: true,
    padding: {
      left: 1,
      right: 1
    },
    left: 20,
    top: 3,
    shrink: true,
    name: "cancel",
    content: "cancel",
    style: {
      bg: "blue",
      focus: {
        bg: "red"
      },
      hover: {
        bg: "red"
      }
    }
  });*/

  //this.cancel.on("press", function() {
  //  console.log("hello");
  //this.reset();
  //});

  /*
  this.submit.on("press", function() {

  });


  this.on("submit", function(data) {
    this.setContent("Submitted.");
  });

  this.on("reset", function(data) {
    this.setContent("Canceled.");
    this.screen.render();
  });*/
}

TableEditForm.prototype.focus = function() {
  this.form.focus();
};

TableEditForm.prototype.render = function() {
  blessed.Box.prototype.render.call(this);
};

TableEditForm.prototype.__proto__ = blessed.Box.prototype;

TableEditForm.prototype.type = "tableEditForm";

module.exports = TableEditForm;
