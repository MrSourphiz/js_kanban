'use strict';
(function () {
  let addButton = document.querySelector('.add-button');

  let taskGroup = document.querySelector('.task-list');

  let newTaskInput = document.querySelector('.new-task__input');

  let backlogTasksList = document.querySelector('.backlog');
  let inProcessTasksList = document.querySelector('.in-process');
  let doneTasksList = document.querySelector('.done');

  let deletedTaskList = document.querySelector('.deleted');
  let isEmpty;

  let deleteButton = document.querySelector('.delete-button');
  let readyToDelete;

  let templateTask = document.querySelector('#task').content.querySelector('.list__item');
  let fragment = document.createDocumentFragment();

  let tasksMemory;
  let belowElement;

  if (localStorage.getItem('taskStorage')) {
    tasksMemory = JSON.parse(localStorage.getItem('taskStorage'));
  } else {
    tasksMemory = [];
  }

  localStorage.setItem('taskStorage', JSON.stringify(tasksMemory));
  let returnTaskMemory = JSON.parse(localStorage.getItem('taskStorage'));

  function TaskObject(id, status, content) {
    this.id = id;
    this.status = status;
    this.content = content;
  }

  function checkTask(str) {
    tasksMemory.forEach(function (item) {
      switch (true) {
        case str.value === '':
          alert('Введите название задачи!');
          isEmpty = true;
          break;
        case item.content === str.value:
          alert('Такая задача уже есть!');
          isEmpty = true;
          break;
        default:
          isEmpty = false;
          break;
      }
    });
  }

  function createTask(taskId, taskValue, taskClass) {
    let taskItem = templateTask.cloneNode(true);
    let taskContent = taskItem.children[0];
    taskContent.textContent = taskValue;
    taskItem.classList.add(taskClass);
    taskItem.dataset.id = taskId;
    taskItem.draggable = true;

    fragment.appendChild(taskItem);

    switch (true) {
      case taskClass.includes('backlog'):
        backlogTasksList.appendChild(fragment);
        break;
      case taskClass.includes('in-process'):
        inProcessTasksList.appendChild(fragment);
        break;
      case taskClass.includes('done'):
        doneTasksList.appendChild(fragment);
        break;
      case taskClass.includes('deleted'):
        deletedTaskList.appendChild(fragment);
        break;
    }
  }

  function getEventsForTaskButtons() {
    let readyToEdit = false;
    let editButtons = document.querySelectorAll('.item__edit-button');
    let itemDoneButtons = document.querySelectorAll('.item__done-button');
    let itemInput = document.querySelectorAll('.item__input');
    let itemContent = document.querySelectorAll('.item__content');

    for (let k = 0; k < editButtons.length; k++) {
      let oldTaskContent = itemContent[k].textContent;

      editButtons[k].addEventListener('click', function () {
        if (!readyToEdit) {
          readyToEdit = !readyToEdit;
          itemInput[k].style.display = 'block';
          itemDoneButtons[k].style.display = 'block';
          itemContent[k].style.color = 'transparent';
          editButtons[k].classList.add('item__delete-button');
          editButtons[k].classList.remove('item__edit-button');
          editButtons[k].setAttribute('aria-label', 'Отменить изменения');
        } else {
          readyToEdit = !readyToEdit;
          itemInput[k].style.display = 'none';
          itemDoneButtons[k].style.display = 'none';
          itemContent[k].style.color = 'black';
          editButtons[k].classList.add('item__edit-button');
          editButtons[k].classList.remove('item__delete-button');
          editButtons[k].setAttribute('aria-label', 'Редактировать');
          itemInput[k].value = '';
        }
      });

      itemDoneButtons[k].addEventListener('click', function () {
        readyToEdit = !readyToEdit;
        itemInput[k].style.display = 'none';
        itemDoneButtons[k].style.display = 'none';
        itemContent[k].style.color = 'black';
        editButtons[k].classList.add('item__edit-button');
        editButtons[k].classList.remove('item__delete-button');
        itemContent[k].textContent = itemInput[k].value;

        tasksMemory.forEach(function (item) {
          if (oldTaskContent === item.content) {
            checkTask(itemInput[k]);
            if (!isEmpty) {
              item.content = itemInput[k].value;
            }
          }
        });

        localStorage.setItem('taskStorage', JSON.stringify(tasksMemory));
      });
    }
  }

  function addTask() {
    checkTask(newTaskInput);
    if (!isEmpty) {
      let taskId = Date.now();
      let newTask = new TaskObject(taskId, 'backlog', newTaskInput.value);
      tasksMemory.push(newTask);
      localStorage.setItem('taskStorage', JSON.stringify(tasksMemory));

      createTask(taskId, newTaskInput.value, 'backlog__item');
    }
    getEventsForTaskButtons();
  }

  function checkDeletedList() {
    let elements = deletedTaskList.querySelectorAll('.deleted__item');

    if (elements.length === 0) {
      readyToDelete = false;
      deleteButton.setAttribute('disabled', 'disabled');
    } else {
      readyToDelete = true;
      deleteButton.removeAttribute('disabled');
    }
  }

  function deleteTasks() {
    let deletedElements = deletedTaskList.querySelectorAll('.deleted__item');
    checkDeletedList();
    if (readyToDelete) {

      deletedElements.forEach(function (item) {
        deletedTaskList.removeChild(item);
      });

      tasksMemory = tasksMemory.filter(item => item.status !== 'deleted');

      localStorage.setItem('taskStorage', JSON.stringify(tasksMemory));

      deleteButton.setAttribute('disabled', 'disabled');
      readyToDelete = false;
    }
  }

  returnTaskMemory.forEach(function (item) {
    let taskClass = item.status + '__item';
    createTask(item.id, item.content, taskClass);
    getEventsForTaskButtons();
  });

  taskGroup.addEventListener('dragenter', function (evt) {
    if (evt.target.classList.contains('list')) {
      evt.target.classList.add('drop');
    }
  });

  taskGroup.addEventListener('dragleave', function (evt) {
    if (evt.target.classList.contains('drop')) {
      evt.target.classList.remove('drop');
    }
  });

  taskGroup.addEventListener('dragstart', function (evt) {
    if (evt.target.classList.contains('list__item')) {
      evt.target.classList.add('selected');
      evt.dataTransfer.setData('text/plain', evt.target.dataset.id);
    }
  });

  taskGroup.addEventListener('dragend', function (evt) {
    if (evt.target.classList.contains('list__item')) {
      evt.target.classList.remove('selected');
    }
    checkDeletedList();
  });

  taskGroup.addEventListener('dragover', function (evt) {
    evt.preventDefault();
    belowElement = evt.target;
  });

  taskGroup.addEventListener('drop', function (evt) {
    let draggableTask = taskGroup.querySelector(`[data-id="${evt.dataTransfer.getData('text/plain')}"]`);
    let draggableTaskCurrentClass = draggableTask.classList[1];
    let draggableTaskNewClass;
    let newTaskStatus;

    if (belowElement === draggableTask) {
      return;
    }

    if (belowElement.classList.contains('list__item')) {
      draggableTaskNewClass = belowElement.parentElement.classList[1] + '__item';
      newTaskStatus = belowElement.parentElement.classList[1];
      const center = belowElement.getBoundingClientRect().y + belowElement.getBoundingClientRect().height / 2;

      if (evt.clientY > center) {
        if (belowElement.nextElementSibling !== null) {
          belowElement = belowElement.nextElementSibling;
        } else {
          return;
        }
      }

      belowElement.parentElement.insertBefore(draggableTask, belowElement);
      draggableTask.classList.remove(draggableTaskCurrentClass);
      draggableTask.classList.add(draggableTaskNewClass);
    }

    if (evt.target.classList.contains('list')) {
      newTaskStatus = evt.target.classList[1];
      draggableTaskNewClass = evt.target.classList[1] + '__item';

      evt.target.append(draggableTask);
      draggableTask.classList.remove(draggableTaskCurrentClass);
      draggableTask.classList.add(draggableTaskNewClass);

      if (evt.target.classList.contains('drop')) {
        evt.target.classList.remove('drop');
      }
    }

    tasksMemory.forEach(function (item) {
      let draggableTaskContent = draggableTask.children[0];
      if (draggableTaskContent.textContent === item.content) {
        if (newTaskStatus !== '') {
          item.status = newTaskStatus;
        }
      }
    });
    localStorage.setItem('taskStorage', JSON.stringify(tasksMemory));
  });

  checkDeletedList();

  addButton.addEventListener('click', function () {
    addTask();
    newTaskInput.value = '';
  });
  deleteButton.addEventListener('click', deleteTasks);
})();
