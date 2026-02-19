// app/todos/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Todo>>({});

  // New todo form
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    loadTodos();
  }, [filter, priorityFilter, showCompleted]);

  async function loadTodos() {
    let query = supabase.from("todos").select("*").order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("category", filter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
    if (!showCompleted) query = query.eq("completed", false);

    const { data } = await query;
    setTodos(data || []);
  }

  async function addTodo() {
    if (!newTitle.trim()) return;

    await supabase.from("todos").insert({
      title: newTitle,
      description: newDescription || null,
      category: newCategory,
      priority: newPriority,
      due_date: newDueDate || null,
      completed: false,
    });

    setNewTitle("");
    setNewDescription("");
    setNewCategory("general");
    setNewPriority("medium");
    setNewDueDate("");
    loadTodos();
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    loadTodos();
  }

  async function deleteTodo(id: string) {
    if (!confirm("Delete this task?")) return;
    await supabase.from("todos").delete().eq("id", id);
    loadTodos();
  }

  async function updateTodo(id: string) {
    await supabase.from("todos").update(editForm).eq("id", id);
    setEditing(null);
    setEditForm({});
    loadTodos();
  }

  const stats = {
    total: todos.filter((t) => !t.completed).length,
    high: todos.filter((t) => !t.completed && t.priority === "high").length,
    overdue: todos.filter(
      (t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()
    ).length,
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "var(--rose-deep)";
    if (p === "medium") return "var(--gold-mid)";
    return "var(--ink-light)";
  };

  const categoryIcon = (c: string) => {
    const icons: Record<string, string> = {
      school: "📚",
      personal: "✨",
      errands: "🛒",
      work: "💼",
      health: "💪",
      general: "📝",
    };
    return icons[c] || "📝";
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Nav */}
      <nav className="victorian-nav mb-6">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="nav-link">
            ← Dashboard
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-amber-100">To-Do List</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 fade-in-1">
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--green-mid)" }}>
              {stats.total}
            </p>
            <p className="text-xs font-['Lora'] text-stone-500 uppercase tracking-wide">Active</p>
          </div>
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--rose-deep)" }}>
              {stats.high}
            </p>
            <p className="text-xs font-['Lora'] text-stone-500 uppercase tracking-wide">High Priority</p>
          </div>
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--gold-deep)" }}>
              {stats.overdue}
            </p>
            <p className="text-xs font-['Lora'] text-stone-500 uppercase tracking-wide">Overdue</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Add New Todo */}
          <div className="victorian-card p-5 fade-in-2">
            <h2 className="section-header">
              <span>+</span> New Task
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Task title..."
                className="victorian-input text-sm w-full"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="victorian-input text-sm w-full resize-none"
                rows={3}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="victorian-input text-sm w-full"
              >
                <option value="general">General</option>
                <option value="school">📚 School</option>
                <option value="personal">✨ Personal</option>
                <option value="errands">🛒 Errands</option>
                <option value="work">💼 Work</option>
                <option value="health">💪 Health</option>
              </select>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="victorian-input text-sm w-full"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="victorian-input text-sm w-full"
              />
              <button onClick={addTodo} className="btn-primary w-full">
                Add Task
              </button>
            </div>
          </div>

          {/* Todos List */}
          <div className="fade-in-3">
            <div className="victorian-card p-5 mb-4">
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="victorian-input text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="school">📚 School</option>
                  <option value="personal">✨ Personal</option>
                  <option value="errands">🛒 Errands</option>
                  <option value="work">💼 Work</option>
                  <option value="health">💪 Health</option>
                  <option value="general">📝 General</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="victorian-input text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="btn-secondary px-3 py-1 text-xs"
                >
                  {showCompleted ? "Hide" : "Show"} Completed
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`victorian-card p-4 transition-all ${
                    todo.completed ? "opacity-60" : ""
                  }`}
                >
                  {editing === todo.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title || todo.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="victorian-input text-sm w-full"
                      />
                      <textarea
                        value={editForm.description || todo.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="victorian-input text-sm w-full resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateTodo(todo.id)} className="btn-primary px-3 py-1 text-xs">
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditing(null);
                            setEditForm({});
                          }}
                          className="btn-secondary px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id, todo.completed)}
                          className="mt-1 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{categoryIcon(todo.category)}</span>
                            <h3
                              className={`font-['Playfair_Display'] font-semibold ${
                                todo.completed ? "line-through" : ""
                              }`}
                            >
                              {todo.title}
                            </h3>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: priorityColor(todo.priority) }}
                              title={`${todo.priority} priority`}
                            />
                          </div>
                          {todo.description && (
                            <p className="text-sm text-stone-600 mb-2">{todo.description}</p>
                          )}
                          <div className="flex gap-3 text-[10px] text-stone-500">
                            {todo.due_date && (
                              <span
                                className={
                                  new Date(todo.due_date) < new Date() && !todo.completed
                                    ? "text-rose-700 font-semibold"
                                    : ""
                                }
                              >
                                Due: {new Date(todo.due_date).toLocaleDateString()}
                              </span>
                            )}
                            <span>
                              Added: {new Date(todo.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(todo.id);
                              setEditForm(todo);
                            }}
                            className="text-xs text-amber-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="text-xs text-rose-700 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {todos.length === 0 && (
                <div className="victorian-card p-8 text-center">
                  <p className="font-['Lora'] italic text-stone-400">
                    {showCompleted ? "No completed tasks yet" : "No tasks yet. Add one to get started!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
