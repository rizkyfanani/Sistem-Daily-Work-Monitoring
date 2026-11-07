"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminNavigation from "@/components/AdminNavigation";

type Employee = {
  id: string;
  name: string;
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

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    employee_id: "",
    status: "",
    priority: "",
  });

  const [exporting, setExporting] = useState(false);
  const hasLoadedReports = useRef(false);

  useEffect(() => {
  if (hasLoadedReports.current) {
    return;
  }

  hasLoadedReports.current = true;
  loadReports();
}, []);

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [tasksResponse, employeesResponse] = await Promise.all([
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
      ]);

      const tasksData = await tasksResponse.json();
      const employeesData = await employeesResponse.json();

      if (!tasksData.success) {
        throw new Error(
          tasksData.message || "Gagal mengambil data task."
        );
      }

      if (!employeesData.success) {
        throw new Error(
          employeesData.message ||
            "Gagal mengambil data karyawan."
        );
      }

      setTasks(tasksData.data || []);

      const activeEmployees = (employeesData.data || []).filter(
        (employee: Employee) =>
          employee.role === "employee" &&
          employee.is_active !== false
      );

      setEmployees(activeEmployees);
    } catch (err) {
      console.error("Reports Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat laporan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleExportExcel() {
  try {
    setExporting(true);

    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "exportReport",
        start_date: filters.start_date,
        end_date: filters.end_date,
        assigned_to: filters.employee_id,
        status: filters.status,
        priority: filters.priority,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Gagal membuat laporan Excel."
      );
    }

    window.open(data.file_url, "_blank");

  } catch (error) {
    console.error("EXPORT REPORT ERROR:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Gagal membuat laporan Excel."
    );
  } finally {
    setExporting(false);
  }
}

  function getDateOnly(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const value = String(dateValue);

  // Jika sudah berupa YYYY-MM-DD tanpa jam
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value.substring(0, 10);
  }

  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
    const taskDue = getDateOnly(task.due_date);

    if (
      filters.start_date &&
      taskDue < filters.start_date
    ) {
      return false;
    }

    if (
      filters.end_date &&
      taskDue > filters.end_date
    ) {
      return false;
    }

    if (
      filters.employee_id &&
      String(task.assigned_to) !==
        String(filters.employee_id)
    ) {
      return false;
    }

    if (
      filters.status &&
      String(task.status).toLowerCase() !==
        filters.status.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.priority &&
      String(task.priority).toLowerCase() !==
        filters.priority.toLowerCase()
    ) {
      return false;
    }

    return true;
  });
}, [tasks, filters]);

  const statistics = useMemo(() => {
    const total = filteredTasks.length;

    const completed = filteredTasks.filter(
      (task) =>
        String(task.status).toLowerCase() === "completed"
    ).length;

    const inProgress = filteredTasks.filter(
      (task) =>
        String(task.status).toLowerCase() === "in_progress"
    ).length;

    const pending = filteredTasks.filter(
      (task) =>
        String(task.status).toLowerCase() === "pending"
    ).length;

    const cancelled = filteredTasks.filter(
      (task) =>
        String(task.status).toLowerCase() === "cancelled"
    ).length;

    const today = new Date();

    const todayString =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    const overdue = filteredTasks.filter((task) => {
      if (!task.due_date) {
        return false;
      }

      const dueDate = getDateOnly(task.due_date);
      return (
        dueDate < todayString &&
        String(task.status).toLowerCase() !== "completed" &&
        String(task.status).toLowerCase() !== "cancelled"
      );
    }).length;

    const completionRate =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      overdue,
      completionRate,
    };
  }, [filteredTasks]);

  function getEmployeeName(employeeId: string) {
    const employee = employees.find(
      (item) => String(item.id) === String(employeeId)
    );

    return employee?.name || employeeId || "-";
  }

  function getStatusLabel(status: string) {
    switch (String(status).toLowerCase()) {
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
    switch (String(status).toLowerCase()) {
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
    switch (String(priority).toLowerCase()) {
      case "low":
        return "Rendah";

      case "medium":
        return "Sedang";

      case "high":
        return "Tinggi";

      case "urgent":
        return "Urgent";

      default:
        return priority || "-";
    }
  }

  function getPriorityClass(priority: string) {
    switch (String(priority).toLowerCase()) {
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

  function resetFilters() {
    setFilters({
      start_date: "",
      end_date: "",
      employee_id: "",
      status: "",
      priority: "",
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
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Lihat dan analisis laporan pekerjaan karyawan.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* FILTER */}
          <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">

            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Filter Laporan
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Gunakan filter untuk menampilkan data tertentu.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

              {/* TANGGAL MULAI */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Dari Tanggal
                </label>

                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      start_date: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* TANGGAL AKHIR */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Sampai Tanggal
                </label>

                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      end_date: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* KARYAWAN */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Karyawan
                </label>

                <select
                  value={filters.employee_id}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      employee_id: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Semua Karyawan
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

              {/* STATUS */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      status: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Semua Status
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="in_progress">
                    Sedang Dikerjakan
                  </option>

                  <option value="completed">
                    Selesai
                  </option>

                  <option value="cancelled">
                    Dibatalkan
                  </option>
                </select>
              </div>

              {/* PRIORITAS */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Prioritas
                </label>

                <select
                  value={filters.priority}
                  onChange={(event) =>
                    setFilters({
                      ...filters,
                      priority: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Semua Prioritas
                  </option>

                  <option value="low">
                    Rendah
                  </option>

                  <option value="medium">
                    Sedang
                  </option>

                  <option value="high">
                    Tinggi
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>

            </div>

            {/* BUTTON */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset Filter
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {exporting ? "Menyiapkan Excel..." : "Export Excel"}
            </button>
            </div>

          </div>

          {/* STATISTIK */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Total Task
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : statistics.total}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Selesai
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {loading ? "..." : statistics.completed}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Sedang Dikerjakan
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {loading ? "..." : statistics.inProgress}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                Completion Rate
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading
                  ? "..."
                  : `${statistics.completionRate}%`}
              </p>
            </div>

          </div>

          {/* INFO TAMBAHAN */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-400">
                Pending
              </p>

              <p className="mt-1 text-xl font-bold text-slate-800">
                {loading ? "..." : statistics.pending}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-400">
                Overdue
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                {loading ? "..." : statistics.overdue}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs text-slate-400">
                Dibatalkan
              </p>

              <p className="mt-1 text-xl font-bold text-slate-600">
                {loading ? "..." : statistics.cancelled}
              </p>
            </div>

          </div>

          {/* TABEL LAPORAN */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Detail Laporan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Menampilkan {filteredTasks.length} task berdasarkan filter.
              </p>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Memuat laporan...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Tidak ada data laporan.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Coba ubah filter yang digunakan.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-0 table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[7%]" />
                  </colgroup>

                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Task
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Karyawan
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Prioritas
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Status
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Progress
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Mulai
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Deadline
                      </th>

                      <th className="px-5 py-3 font-semibold text-slate-700">
                        Selesai
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* TASK */}
                        <td className="max-w-xs px-5 py-4">
                          <p className="truncate font-semibold text-slate-900">
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {task.description}
                            </p>
                          )}
                        </td>

                        {/* KARYAWAN */}
                        <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                          {getEmployeeName(task.assigned_to)}
                        </td>

                        {/* PRIORITAS */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </td>

                        {/* PROGRESS */}
                        <td className="min-w-[150px] px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-500"
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

                            <span className="w-10 text-right text-xs font-medium text-slate-600">
                              {Number(task.progress) || 0}%
                            </span>
                          </div>
                        </td>

                        {/* MULAI */}
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(task.start_date)}
                        </td>

                        {/* DEADLINE */}
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(task.due_date)}
                        </td>

                        {/* SELESAI */}
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(task.completed_at)}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}