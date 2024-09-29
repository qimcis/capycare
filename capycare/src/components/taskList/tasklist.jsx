import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

const TodoItem = ({ todo, index, actions, isEditing, isSelected, onEditTodo, onClickTodo }) => (
  <Draggable draggableId={todo.id} index={index}>
    {(provided) => (
      <li
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`card bg-base-100 shadow-xl mb-2 ${isSelected ? 'border-2 border-primary' : ''}`}
        onClick={() => onClickTodo(todo.id)}
      >
        <div className="card-body p-4">
          <h3 className="card-title text-lg">{todo.title}</h3>
          <p>{todo.description}</p>
          <div className="card-actions justify-end">
            <button className="btn btn-xs btn-ghost" onClick={() => onEditTodo(todo.id)}>Edit</button>
            <button className="btn btn-xs btn-ghost" onClick={() => actions.delete(todo.id)}>Delete</button>
          </div>
        </div>
      </li>
    )}
  </Draggable>
);

const TodoForm = ({ mode, todo, onAddTodo, onClose }) => {
  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTodo({ id: todo?.id || uuidv4(), title, description });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl mb-4">
      <div className="card-body">
        <input
          type="text"
          placeholder="Task title"
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Task description"
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <div className="card-actions justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{mode === 'add' ? 'Add' : 'Save'}</button>
        </div>
      </div>
    </form>
  );
};

const TaskList = () => {
  const [todos, setTodos] = useState([]);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filteredTodos = useMemo(() => {
    switch(filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const actions = {
    add: (newTodo) => setTodos([...todos, newTodo]),
    delete: (id) => setTodos(todos.filter(todo => todo.id !== id)),
    edit: (updatedTodo) => setTodos(todos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)),
    toggle: (id) => setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo)),
    reorder: (startIndex, endIndex) => {
      const result = Array.from(todos);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      setTodos(result);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    actions.reorder(result.source.index, result.destination.index);
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 bg-base-200 rounded-box shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Task List</h2>
      
      {!showForm && (
        <div className="text-center mb-6">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add New Task</button>
        </div>
      )}

      {showForm && (
        <TodoForm
          mode="add"
          onAddTodo={actions.add}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="flex justify-between mb-4">
        <div className="btn-group">
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`btn btn-sm ${filter === 'active' ? 'btn-active' : ''}`} onClick={() => setFilter('active')}>Active</button>
          <button className={`btn btn-sm ${filter === 'completed' ? 'btn-active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {filteredTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  index={index}
                  actions={actions}
                  isEditing={editingTodoId === todo.id}
                  isSelected={selectedTodoId === todo.id}
                  onEditTodo={setEditingTodoId}
                  onClickTodo={setSelectedTodoId}
                />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default TaskList;