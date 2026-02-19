// components/TodoWidget.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Todo = {
  id: string;
  title: string;
  category: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
};

export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [category, setCategory] = useState("general");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadTodos();
  }, [showCompleted]);

  async function loadTodos() {
    let query = supabase
      .from("todos")
      .select("*")
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true });

    if (!showCompleted) {
      query = query.eq("completed", false);
    }

    const { data } = await query.limit(10);
    setTodos(data || []);
  }

  async function addTodo() {
    if (!newTodo.trim()) return;

    await supabase.from("todos").insert({
      title: newTodo,
      category,
      priority: "medium",
      completed: false,
    });

    setNewTodo("");
    setCategory("general");
    loadTodos();
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    loadTodos();
  }

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
    <div className="victorian-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-header" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
          <span>✓</span> Quick To-Dos
        </h3>
        <Link href="/todos" className="text-xs text-amber-700 hover:underline">
          View All →
        </Link>
      </div>

      {/* Quick Add */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a to-do..."
          className="victorian-input text-sm flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="victorian-input text-sm"
          style={{ width: "auto" }}
        >
          <option value="general">General</option>
          <option value="school">School</option>
          <option value="personal">Personal</option>
          <option value="errands">Errands</option>
          <option value="work">Work</option>
          <option value="health">Health</option>
        </select>
        <button onClick={addTodo} className="btn-primary px-3 py-1 text-xs">
          +
        </button>
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-start gap-2 p-2 rounded-lg transition-all ${
              todo.completed ? "opacity-50" : ""
            }`}
            style={{ background: "rgba(196,150,31,0.06)" }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
              className="mt-1 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs">{categoryIcon(todo.category)}</span>
                <p
                  className={`text-sm font-['Source_Sans_3'] ${
                    todo.completed ? "line-through" : ""
                  }`}
                >
                  {todo.title}
                </p>
              </div>
              {todo.due_date && (
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Due: {new Date(todo.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div
              className="w-2 h-2 rounded-full mt-2"
              style={{ background: priorityColor(todo.priority) }}
              title={`${todo.priority} priority`}
            />
          </div>
        ))}

        {todos.length === 0 && (
          <p className="text-sm font-['Lora'] italic text-stone-400 text-center py-4">
            {showCompleted ? "No completed tasks" : "No tasks yet. Add one above!"}
          </p>
        )}
      </div>

      {/* Toggle Completed */}
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="text-xs text-stone-500 hover:text-stone-700 mt-2 w-full text-center"
      >
        {showCompleted ? "Hide" : "Show"} Completed
      </button>
    </div>
  );
}
