"use client";

import { useEffect, useState } from "react";
import AdminNavigation from "@/components/AdminNavigation";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  created_by: string;
  priority: string;
  status: string;
  progress: number;
  start_date: string;
  due_date: string;
  completed_at: string;
  notes: string;
  employee_notes: string;
  attachment_url: string;
  attachment_name: string;
  created_at: string;
  updated_at: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    start_date: "",
    due_date: "",
    notes: "",
    status: "pending",
    progress: 0,
    });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: "pending",
    progress: 0,
    start_date: "",
    due_date: "",
    notes: "",
    });

const [saving, setSaving] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success",
});

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return String(dateValue).substring(0, 10);
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEmployeeName(employeeId: string) {
  const employee = employees.find(
    (employee) => employee.id === employeeId
  );

  return employee?.name || employeeId || "-";
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case "low":
      return "Rendah";
    case "medium":
      return "Sedang";
    case "high":
      return "Tinggi";
    case "urgent":
      return "Mendesak";
    default:
      return priority || "-";
  }
}

function getPriorityClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-50 text-red-700";
    case "high":
      return "bg-orange-50 text-orange-700";
    case "medium":
      return "bg-blue-50 text-blue-700";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "Sedang Dikerjakan";
    case "completed":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status || "-";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700";

    case "in_progress":
      return "bg-blue-50 text-blue-700";

    case "completed":
      return "bg-green-50 text-green-700";

    case "cancelled":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}
  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/app-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          action: "getTasks",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Gagal mengambil data task"
        );
      }

      setTasks(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
  try {
    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "getEmployees",
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Gagal mengambil data karyawan"
      );
    }

    const activeEmployees = (data.data || []).filter(
      (employee: Employee) =>
        employee.role === "employee" &&
        employee.is_active !== false
    );

    setEmployees(activeEmployees);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal mengambil data karyawan"
    );
  }
}

async function handleDeleteTask(task: Task) {
  try {
    setSaving(true);
    setError("");

    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "deleteTask",
        task_id: task.id,
        deleted_by: "ADM001",
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Gagal menghapus task"
      );
    }

    setSelectedTask(null);
    setShowEditForm(false);
    setShowDeleteConfirm(false);

    setToast({
      show: true,
      message: "Task berhasil dihapus",
      type: "success",
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);

    await loadTasks();

  } catch (err) {

    const message =
      err instanceof Error
        ? err.message
        : "Gagal menghapus task";

    setToast({
      show: true,
      message,
      type: "error",
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);

  } finally {
    setSaving(false);
  }
}

  async function handleCreateTask(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  try {
    setSaving(true);
    setError("");

    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "createTask",
        title: form.title,
        description: form.description,
        assigned_to: form.assigned_to,
        priority: form.priority,
        status: form.status,
        progress: Number(form.progress),
        start_date: form.start_date,
        due_date: form.due_date,
        notes: form.notes,
        created_by: "ADM001",
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Gagal membuat task"
      );
    }

    setForm({
      title: "",
      description: "",
      assigned_to: "",
      priority: "medium",
      status: "pending",
      progress: 0,
      start_date: "",
      due_date: "",
      notes: "",
    });

    setShowCreateForm(false);

setToast({
  show: true,
  message: "Task berhasil dibuat",
  type: "success",
});

setTimeout(() => {
  setToast({
    show: false,
    message: "",
    type: "success",
  });
}, 3000);

await loadTasks();

  } catch (err) {
  setToast({
    show: true,
    message:
      err instanceof Error
        ? err.message
        : "Gagal membuat task",
    type: "error",
  });

  setTimeout(() => {
    setToast({
      show: false,
      message: "",
      type: "success",
    });
  }, 3000);
} finally {
    setSaving(false);
  }
}

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavigation />

      <main className="min-h-screen pt-16 md:ml-[var(--sidebar-width)] md:pt-0 transition-[margin] duration-300">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {toast.show && (
  <div className="fixed right-6 top-6 z-[100]">
    <div
      className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
        toast.type === "success"
          ? "border border-green-200 bg-green-50 text-green-700"
          : "border border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span>
        {toast.type === "success" ? "✓" : "!"}
      </span>

      <span>{toast.message}</span>

      <button
        type="button"
        onClick={() =>
          setToast({
            show: false,
            message: "",
            type: "success",
          })
        }
        className="ml-2 text-lg opacity-60 hover:opacity-100"
      >
        ×
      </button>
    </div>
  </div>
)}
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                Task Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                Kelola dan pantau tugas karyawan.
                </p>
            </div>

            <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
                + Tambah Task
            </button>

            </div>

        {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                <div>
                <h2 className="text-lg font-bold text-slate-900">
                    Tambah Task
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                    Buat dan assign task kepada karyawan.
                </p>
                </div>

                <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                ✕
                </button>

            </div>

            {/* FORM */}

            <form
                onSubmit={handleCreateTask}
                className="space-y-5 p-6"
            >

                {/* JUDUL */}

                <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Judul Task
                </label>

                <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                    setForm({
                        ...form,
                        title: e.target.value,
                    })
                    }
                    placeholder="Contoh: Buat laporan penjualan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                </div>

                {/* DESKRIPSI */}

                <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Deskripsi
                </label>

                <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                    setForm({
                        ...form,
                        description: e.target.value,
                    })
                    }
                    placeholder="Jelaskan detail pekerjaan..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                </div>

                {/* KARYAWAN + PRIORITAS */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Karyawan
                    </label>

                    <select
                    required
                    value={form.assigned_to}
                    onChange={(e) =>
                        setForm({
                        ...form,
                        assigned_to: e.target.value,
                        })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                    <option value="">
                    Pilih karyawan
                    </option>

                    {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                        {employee.name}
                    </option>
                    ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Prioritas
                    </label>

                    <select
                    value={form.priority}
                    onChange={(e) =>
                        setForm({
                        ...form,
                        priority: e.target.value,
                        })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                    </select>
                </div>

                </div>

                {/* TANGGAL */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tanggal Mulai
                    </label>

                    <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                        setForm({
                        ...form,
                        start_date: e.target.value,
                        })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Deadline
                    </label>

                    <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) =>
                        setForm({
                        ...form,
                        due_date: e.target.value,
                        })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                </div>

                {/* CATATAN */}

                <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Catatan Admin
                </label>

                <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                    setForm({
                        ...form,
                        notes: e.target.value,
                    })
                    }
                    placeholder="Catatan tambahan untuk karyawan..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                </div>

                {/* BUTTON */}

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Batal
                </button>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Menyimpan..." : "Simpan Task"}
                </button>

                </div>

            </form>

            </div>

        </div>
        )}

        
        {/* LOADING */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Memuat data task...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full min-w-[1100px] text-left text-sm">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Task
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Karyawan
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Prioritas
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Progress
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Deadline
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {tasks.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Belum ada task.
                      </td>
                    </tr>

                  ) : (

                    tasks.map((task) => (

                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="cursor-pointer hover:bg-slate-50"
                        >

                        {/* TASK */}

                        <td className="px-4 py-4">

                          <div className="font-semibold text-slate-900">
                            {task.title}
                          </div>

                          <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                            {task.description || "-"}
                          </div>

                        </td>

                        {/* KARYAWAN */}

                        <td className="px-4 py-4 text-slate-700">
                          {getEmployeeName(task.assigned_to)}
                        </td>

                        {/* PRIORITAS */}

                        <td className="px-4 py-4">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">

                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>

                        </td>

                        {/* PROGRESS */}

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-2">

                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">

                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${task.progress}%`,
                                }}
                              />

                            </div>

                            <span className="text-xs font-medium text-slate-600">
                              {task.progress}%
                            </span>

                          </div>

                        </td>

                        {/* DEADLINE */}

                        <td className="px-4 py-4 text-slate-700">
                          {formatDate(task.due_date)}
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE TASK CARDS */}
            <div className="divide-y divide-slate-100 md:hidden">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  className="block w-full p-5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                        task.status
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progress</span>

                      <span className="font-semibold text-slate-700">
                        {Number(task.progress) || 0}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(task.progress) || 0)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">Karyawan</p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {getEmployeeName(task.assigned_to)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">Prioritas</p>

                      <span
                        className={`mt-1 inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">
                      Deadline: {task.due_date || "-"}
                    </span>

                    <span className="text-sm font-semibold text-blue-600">
                      Lihat Detail →
                    </span>
                  </div>
                </button>
              ))}
            </div>

          </div>

        )}

      {/* DETAIL TASK MODAL */}

{selectedTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

      {/* HEADER */}

<div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

  <div className="min-w-0 pr-4">
    <h2 className="text-xl font-bold text-slate-900">
      Detail Task
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Informasi lengkap tugas dan hasil pekerjaan.
    </p>
  </div>

  <button
    type="button"
    onClick={() => setSelectedTask(null)}
    className="shrink-0 rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
    aria-label="Tutup detail task"
  >
    ✕
  </button>

</div>

      {/* CONTENT */}

      <div className="space-y-6 p-6">

        {/* JUDUL */}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Judul Task
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {selectedTask.title}
          </h3>
        </div>

        {/* DESKRIPSI */}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Deskripsi
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {selectedTask.description || "-"}
          </p>
        </div>

        {/* INFO UTAMA */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Karyawan
            </p>

            <p className="mt-1 font-semibold text-slate-900">
            {employees.find(
                (employee) => employee.id === selectedTask.assigned_to
            )?.name || selectedTask.assigned_to}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Prioritas
            </p>

            <p className="mt-1 font-semibold capitalize text-slate-900">
              {getPriorityLabel(selectedTask.priority)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Status
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {getStatusLabel(selectedTask.status)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Progress
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {selectedTask.progress}%
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Tanggal Mulai
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(selectedTask.start_date)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Deadline
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(selectedTask.due_date)}
            </p>
          </div>

        </div>

        {/* PROGRESS */}

        <div>

          <div className="mb-2 flex items-center justify-between">

            <p className="text-sm font-semibold text-slate-800">
              Progress Pekerjaan
            </p>

            <span className="text-sm font-semibold text-slate-600">
              {selectedTask.progress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${selectedTask.progress}%`,
              }}
            />

          </div>

        </div>

        {/* CATATAN ADMIN */}

        <div>

          <p className="text-sm font-semibold text-slate-800">
            Catatan Admin
          </p>

          <div className="mt-2 rounded-xl bg-slate-50 p-4">

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {selectedTask.notes || "-"}
            </p>

          </div>

        </div>

        {/* HASIL PEKERJAAN */}

        <div className="border-t border-slate-200 pt-6">

          <h3 className="text-base font-bold text-slate-900">
            Hasil Pekerjaan Karyawan
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Penjelasan dan file hasil pekerjaan.
          </p>

        </div>

        {/* EMPLOYEE NOTES */}

        <div>

          <p className="text-sm font-semibold text-slate-800">
            Penjelasan Pekerjaan
          </p>

          <div className="mt-2 rounded-xl bg-slate-50 p-4">

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {selectedTask.employee_notes || "Belum ada penjelasan dari karyawan."}
            </p>

          </div>

        </div>

        {/* ATTACHMENT */}

        <div>

          <p className="text-sm font-semibold text-slate-800">
            File Hasil
          </p>

          {selectedTask.attachment_url ? (

            <a
              href={selectedTask.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedTask.attachment_name || "File hasil pekerjaan"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Klik untuk membuka file
                </p>
              </div>

              <span className="text-sm font-semibold text-blue-600">
                Buka →
              </span>

            </a>

          ) : (

            <div className="mt-2 rounded-xl bg-slate-50 p-4">

              <p className="text-sm text-slate-500">
                Belum ada file hasil pekerjaan.
              </p>

            </div>

          )}

        </div>

      </div>

      {/* FOOTER */}

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">

  <div className="flex gap-3">

    <button
      type="button"
      onClick={() => setShowDeleteConfirm(true)}
      disabled={saving}
      className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Hapus Task
    </button>

    <button
      type="button"
      onClick={() => {
        if (!selectedTask) return;

        setEditForm({
          title: selectedTask.title || "",
          description: selectedTask.description || "",
          assigned_to: selectedTask.assigned_to || "",
          priority: selectedTask.priority || "medium",
          start_date: selectedTask.start_date || "",
          due_date: selectedTask.due_date || "",
          notes: selectedTask.notes || "",
          status: selectedTask.status || "pending",
          progress: Number(selectedTask.progress) || 0,
        });

        setShowEditForm(true);
      }}
      className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Edit Task
    </button>

    <button
      type="button"
      onClick={() => setSelectedTask(null)}
      className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Tutup
    </button>

  </div>

</div>

    </div>

  </div>
)}

{showDeleteConfirm && selectedTask && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

      {/* ICON + HEADER */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 text-red-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.008v.008H12v-.008zm9-3.75a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              Hapus Task?
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Kamu yakin ingin menghapus task ini?
            </p>
          </div>

        </div>

        {/* TASK NAME */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Task yang akan dihapus
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {selectedTask.title}
          </p>
        </div>

        {/* WARNING */}
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm leading-5 text-red-700">
            Task yang dihapus tidak dapat dikembalikan.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={saving}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedTask) {
              handleDeleteTask(selectedTask);
            }
          }}
          disabled={saving}
          className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          {saving ? "Menghapus..." : "Ya, Hapus Task"}
        </button>

      </div>

    </div>
  </div>
)}

          {showEditForm && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Task
                </h2>
                <p className="text-sm text-slate-500">
                  Ubah informasi task
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  setSaving(true);
                  setError("");

                  const response = await fetch("/api/app-script", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    cache: "no-store",
                    body: JSON.stringify({
                      action: "updateTask",
                      task_id: selectedTask.id,
                      title: editForm.title,
                      description: editForm.description,
                      assigned_to: editForm.assigned_to,
                      priority: editForm.priority,
                      start_date: editForm.start_date,
                      due_date: editForm.due_date,
                      notes: editForm.notes,
                      status: editForm.status,
                      progress: Number(editForm.progress),
                      updated_by: "ADM001",
                    }),
                  });

                  const data = await response.json();

                  if (!data.success) {
                    throw new Error(
                      data.message || "Gagal mengupdate task"
                    );
                  }

                  setShowEditForm(false);
                  setSelectedTask(null);

                  setToast({
                    show: true,
                    message: "Task berhasil diperbarui",
                    type: "success",
                  });

                  setTimeout(() => {
                    setToast({
                      show: false,
                      message: "",
                      type: "success",
                    });
                  }, 3000);

                  await loadTasks();
                } catch (err) {
                  setToast({
                    show: true,
                    message:
                      err instanceof Error
                        ? err.message
                        : "Gagal mengupdate task",
                    type: "error",
                  });

                  setTimeout(() => {
                    setToast({
                      show: false,
                      message: "",
                      type: "success",
                    });
                  }, 3000);
                } finally {
                  setSaving(false);
                }
              }}
              className="space-y-5 p-6"
            >
              {/* Judul */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Judul Task
                </label>

                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      title: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Deskripsi
                </label>

                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Karyawan + Prioritas */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Karyawan
                  </label>

                  <select
                    value={editForm.assigned_to}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        assigned_to: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">
                      Pilih karyawan
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Prioritas
                  </label>

                  <select
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        priority: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tanggal Mulai
                  </label>

                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        start_date: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Deadline
                  </label>

                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        due_date: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Status + Progress */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        status: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">
                      In Progress
                    </option>
                    <option value="completed">
                      Completed
                    </option>
                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Progress (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        progress: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Catatan Admin
                </label>

                <textarea
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      notes: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
         </div>
        </div>
      </main>
    </div>
  );
}