var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {

    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var auditTask = function(taskEl) {
  //get date from task element
  var date = $(taskEl).find("span").text().trim();
  //convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  //apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-tem-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};


var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}; 

//sortable jquery code
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  //event listeners:
  activate: function(event) {
    console.log("activate", this);
  },
  deactivate: function(event) {
    console.log("deactivate", this);
  },
  over: function(event) {
    console.log("over", event.target);
  }, 
  out: function(event) {
    console.log("out", event.target);
  },
  update: function(event) {
    var tempArr = [];
    //loop over the current set of children in srotable list
    $(this).children().each(function(){
      var text = $(this)
        .find("p")
        .text()
        .trim();
      var date = $(this)
        .find("span")
        .text()
        .trim();

//add task to temp array as an object
      tempArr.push({
        text: text, 
        date: date
      }); 
    }); // children loop end
    
    // trim down lists id to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    //update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();  
    
  } // tempArray push 
}); // end save tasks function

// droppable
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
    console.log("drop");
  }, 
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
}); // end droppable
// paragraph to text box logic
$(".list-group").on("click", "p", function() {
    var text = $(this)
        .text()
        .trim();
    var textInput = $("<textarea>")
        .addClass("form-control")
        .val(text);
    $(this).replaceWith(textInput); 
    textInput.trigger("focus");  
});
$(".list-group").on("blur", "textarea", function() {
    //get the textareas current value/text
    var text = $(this)
        .val()
        .trim();
    //get the parent ul's id attribute
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");
    //get the task's position in the list of other li elements
    var index = $(this)
        .closest(".list-group-item")
        .index();
    tasks[status][index].text = text;
    saveTasks();
    //recreate the p element
    var taskP = $("<p>")
        .addclass("m-1")
        .text(text);
    //replace text area with p element
    $(this).replaceWith(taskP);
});
// edit dates logic
$(".list-group").on("click", "span", function(){
    //get the current task
    var date = $(this)
        .text()
        .trim();
    //create new input element
    var dateInput = $("<input>")
        .attr("type", "text")
        .addClass("form-control")
        .val(date);
    //swap out elements
    $(this).replaceWith(dateInput);
    // jquery ui datepicker
    dateInput.datepicker({
      minDate: 1,
      onClose: function(){
        //when calendar is closed, force a "change" event on the dateInput
        $(this).trigger("change");
      }
    });
    //automatically focus on the new element
    dateInput.trigger("focus");
});
$(".list-group").on("change", "input[type='text']", function(){
    //get current text
    var date = $(this)
        .val()
        .trim()
    // get the parent ul's id attribute
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");
    //get the tasks position in the list of other li elements
    var index = $(this)
        .closest(".list-group-item")
        .index();
    //update the task in array and re-save to localstorage
    tasks[status][index].date = date;
    saveTasks();
    // recreate span elemt with bootstrap classes
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(date);
    //replace inpust with span element
    $(this).replaceWith(taskSpan);
    // pass task's li element into audit task to check the new due date
    auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

//date picker
$("#modalDueDate").datepicker({
  minDate: 1
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();


