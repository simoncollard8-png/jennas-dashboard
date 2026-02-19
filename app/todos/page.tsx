"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function TodosPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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

  const activeTodos = todos.filter(t => !t.completed);
  const highPriority = activeTodos.filter(t => t.priority === "high").length;
  const overdue = activeTodos.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <nav className="victorian-nav mb-6">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="nav-link">← Dashboard</Link>
          <h1 className="font-['Playfair_Display'] text-xl text-amber-100">To-Do List</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--green-mid)" }}>{activeTodos.length}</p>
            <p className="text-xs font-['Lora'] text-stone-500">Active</p>
          </div>
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--rose-deep)" }}>{highPriority}</p>
            <p className="text-xs font-['Lora'] text-stone-500">High Priority</p>
          </div>
          <div className="victorian-card p-4 text-center">
            <p className="text-2xl font-['Playfair_Display'] font-bold" style={{ color: "var(--gold-deep)" }}>{overdue}</p>
            <p className="text-xs font-['Lora'] text-stone-500">Overdue</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          <div className="victorian-card p-5">
            <h2 className="section-header"><span>+</span> New Task</h2>
            <div className="space-y-3">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..." className="victorian-input text-sm w-full" />
              <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Description..." className="victorian-input text-sm w-full resize-none" rows={3} />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="victorian-input text-sm w-full">
                <option value="general">General</option>
                <option value="school">📚 School</option>
                <option value="personal">✨ Personal</option>
                <option value="errands">🛒 Errands</option>
                <option value="work">💼 Work</option>
                <option value="health">💪 Health</option>
              </select>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="victorian-input text-sm w-full">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="victorian-input text-sm w-full" />
              <button onClick={addTodo} className="btn-primary w-full">Add Task</button>
            </div>
          </div>

          <div>
            <div className="victorian-card p-5 mb-4">
              <div className="flex gap-2 flex-wrap">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="victorian-input text-sm">
                  <option value="all">All Categories</option>
                  <option value="school">📚 School</option>
                  <option value="personal">✨ Personal</option>
                  <option value="errands">🛒 Errands</option>
                  <option value="work">💼 Work</option>
                  <option value="health">💪 Health</option>
                  <option value="general">📝 General</option>
                </select>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="victorian-input text-sm">
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={() => setShowCompleted(!showCompleted)} className="btn-secondary px-3 py-1 text-xs">
                  {showCompleted ? "Hide" : "Show"} Completed
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {todos.map(todo => (
                <div key={todo.id} className={`victorian-card p-4 ${todo.completed ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id, todo.completed)} className="mt-1 cursor-pointer" />
                    <div className="flex-1">
                      <h3 className={`font-['Playfair_Display'] font-semibold ${todo.completed ? "line-through" : ""}`}>{todo.title}</h3>
                      {todo.description && <p className="text-sm text-stone-600 mt-1">{todo.description}</p>}
                      {todo.due_date && <p className="text-xs text-stone-500 mt-1">Due: {new Date(todo.due_date).toLocaleDateString()}</p>}
                    </div>
                    <button onClick={() => deleteTodo(todo.id)} className="text-xs text-rose-700 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
              {todos.length === 0 && (
                <div className="victorian-card p-8 text-center">
                  <p className="font-['Lora'] italic text-stone-400">No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
