"use client";

import { useEffect, useState } from "react";
import AdminNavigation from "@/components/AdminNavigation";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
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

type Stats = {
  totalEmployees: number;
  todayTasks: number;
  inProgress: number;
  completed: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    todayTasks: 0,
    inProgress: 0,
    completed: 0,
  });

  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, tasksResponse] = await Promise.all([
        fetch("/api/app-script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action: "getEmployees",
          }),
        }),

        fetch("/api/app-script", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            action: "getTasks",
          }),
        }),
      ]);

      const employeesData = await employeesResponse.json();
      const tasksData = await tasksResponse.json();

      if (!employeesData.success) {
        throw new Error(
          employeesData.message || "Gagal mengambil data karyawan"
        );
      }

      if (!tasksData.success) {
        throw new Error(
          tasksData.message || "Gagal mengambil data tugas"
        );
      }

      const employeeList: Employee[] = employeesData.data || [];
      const taskList: Task[] = tasksData.data || [];

      const activeEmployees = employeeList.filter(
        (employee) =>
          employee.role === "employee" &&
          employee.is_active !== false
      );

      const today = new Date();

      const todayString =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

      const todayTasks = taskList.filter((task) => {
  if (!task.due_date) {
    return false;
  }

  const taskDate = new Date(task.due_date);

  if (isNaN(taskDate.getTime())) {
    return false;
  }

  const taskDateString =
    taskDate.getFullYear() +
    "-" +
    String(taskDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(taskDate.getDate()).padStart(2, "0");

  return taskDateString === todayString;
}).length;

      const inProgress = taskList.filter(
        (task) => task.status === "in_progress"
      ).length;

      const completed = taskList.filter(
        (task) => task.status === "completed"
      ).length;

      const sortedTasks = [...taskList]
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateB - dateA;
        })
        .slice(0, 5);

      setEmployees(activeEmployees);

      setStats({
        totalEmployees: activeEmployees.length,
        todayTasks,
        inProgress,
        completed,
      });

      setRecentTasks(sortedTasks);
    } catch (err) {
      console.error("DASHBOARD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function getEmployeeName(employeeId: string) {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    return employee?.name || employeeId || "-";
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

  function getPriorityLabel(priority: string) {
    switch (priority) {
      case "urgent":
        return "Urgent";

      case "high":
        return "Tinggi";

      case "medium":
        return "Sedang";

      case "low":
        return "Rendah";

      default:
        return priority || "-";
    }
  }

  function getPriorityClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "text-red-700";

    case "high":
      return "text-orange-700";

    case "medium":
      return "text-blue-700";

    case "low":
      return "text-slate-600";

    default:
      return "text-slate-600";
  }
}

function getProgressClass(progress: number) {
  const value = Number(progress) || 0;

  if (value >= 100) {
    return "bg-green-500";
  }

  if (value >= 50) {
    return "bg-blue-500";
  }

  if (value > 0) {
    return "bg-amber-500";
  }

  return "bg-slate-300";
}

  function formatDate(dateString: string) {
    if (!dateString) {
      return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return String(dateString).substring(0, 10);
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNavigation />

      <main className="min-h-screen pt-16 md:ml-[var(--sidebar-width)] md:pt-0 transition-[margin] duration-300">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Daily Work Monitoring System
            </p>
          </div>

          {/* WELCOME */}
          <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
            <p className="text-sm text-slate-300">
              Selamat datang
            </p>

            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Admin 👋
            </h2>

            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Kelola karyawan dan pantau pekerjaan dari sini.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* STATISTICS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* TOTAL KARYAWAN */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Total Karyawan
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.totalEmployees}
              </p>
            </div>

            {/* TUGAS HARI INI */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Tugas Hari Ini
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.todayTasks}
              </p>
            </div>

            {/* SEDANG DIKERJAKAN */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Sedang Dikerjakan
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.inProgress}
              </p>
            </div>

            {/* SELESAI */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Selesai
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : stats.completed}
              </p>
            </div>

          </div>

          {/* TUGAS TERBARU */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Tugas Terbaru
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Aktivitas tugas yang baru dibuat.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Memuat tugas terbaru...
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Belum ada tugas.
                </div>
              ) : (
                <>
                  {/* DESKTOP */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Tugas
                          </th>

                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Karyawan
                          </th>

                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Progress
                          </th>

                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Prioritas
                          </th>

                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Status
                          </th>

                          <th className="px-5 py-4 font-semibold text-slate-600">
                            Deadline
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {recentTasks.map((task) => (
                            <tr
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="cursor-pointer transition hover:bg-slate-50"
                            >
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {task.title}
                                </p>

                                {task.description && (
                                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-slate-700">
                              {getEmployeeName(task.assigned_to)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="w-28">
                                <div className="mb-1 flex items-center justify-between text-xs">
                                  <span className="text-slate-500">
                                    Progress
                                  </span>

                                  <span className="font-semibold text-slate-700">
                                    {Number(task.progress) || 0}%
                                  </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full ${getProgressClass(
                                      Number(task.progress) || 0
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          Number(task.progress) || 0
                                        )
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-sm font-medium ${getPriorityClass(
                                  task.priority
                                )}`}
                              >
                                {getPriorityLabel(task.priority)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                  task.status
                                )}`}
                              >
                                {getStatusLabel(task.status)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(task.due_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE */}
                  <div className="divide-y divide-slate-100 md:hidden">
                    {recentTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="block w-full p-5 text-left transition hover:bg-slate-50"
                    >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">
                              {task.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {getEmployeeName(task.assigned_to)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Progress
                            </span>

                            <span className="font-semibold text-slate-700">
                              {Number(task.progress) || 0}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${getProgressClass(
                                  Number(task.progress) || 0
                                )}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(task.progress) || 0
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs">
                          <span
                            className={`font-medium ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </span>

                          <span className="text-slate-500">
                            Deadline: {formatDate(task.due_date)}
                          </span>
                        </div>
                    </button>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>

          {/* MENU */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">

            <a
              href="/employees"
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Kelola Karyawan
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Tambah dan kelola akun karyawan.
              </p>
            </a>

            <a
              href="/tasks"
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Kelola Tugas
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Buat dan pantau tugas karyawan.
              </p>
            </a>

            <a
              href="/reports"
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Laporan
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Lihat laporan pekerjaan dan aktivitas.
              </p>
            </a>

          </div>

        </div>

      {/* DETAIL TASK MODAL */}
{selectedTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">

      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">

        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Detail Task
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Informasi tugas dan hasil pekerjaan karyawan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedTask(null)}
          className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>

      </div>

      {/* CONTENT */}
      <div className="space-y-6 p-5 sm:p-6">

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

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {selectedTask.description || "-"}
          </p>
        </div>

        {/* INFO */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* KARYAWAN */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Karyawan
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {getEmployeeName(selectedTask.assigned_to)}
            </p>
          </div>

          {/* PRIORITAS */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Prioritas
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {getPriorityLabel(selectedTask.priority)}
            </p>
          </div>

          {/* STATUS */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Status
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {getStatusLabel(selectedTask.status)}
            </p>
          </div>

          {/* PROGRESS */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Progress
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {Number(selectedTask.progress) || 0}%
            </p>
          </div>

          {/* TANGGAL MULAI */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Tanggal Mulai
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(selectedTask.start_date)}
            </p>
          </div>

          {/* DEADLINE */}
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              Deadline
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(selectedTask.due_date)}
            </p>
          </div>

        </div>

        {/* PROGRESS BAR */}
        <div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Progress Pekerjaan
            </p>

            <span className="text-sm font-semibold text-slate-600">
              {Number(selectedTask.progress) || 0}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    Number(selectedTask.progress) || 0
                  )
                )}%`,
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

        {/* PENJELASAN */}
        <div>

          <p className="text-sm font-semibold text-slate-800">
            Penjelasan Pekerjaan
          </p>

          <div className="mt-2 rounded-xl bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {selectedTask.employee_notes ||
                "Belum ada penjelasan dari karyawan."}
            </p>
          </div>

        </div>

        {/* FILE HASIL */}
        <div>

          <p className="text-sm font-semibold text-slate-800">
            File Hasil
          </p>

          {selectedTask.attachment_url ? (
            <a
              href={selectedTask.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
            >

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedTask.attachment_name ||
                    "File hasil pekerjaan"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Klik untuk membuka file
                </p>
              </div>

              <span className="ml-4 shrink-0 text-sm font-semibold text-blue-600">
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
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">

        <button
          type="button"
          onClick={() => setSelectedTask(null)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Tutup
        </button>

      </div>

    </div>

  </div>
)}

      </main>
    </div>
  );
}