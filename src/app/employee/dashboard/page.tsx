"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type SessionData = {
  user: User;
  token: string;
  expires_at: string;
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

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [session, setSession] = useState<SessionData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [employeeNotes, setEmployeeNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [resultForm, setResultForm] = useState({
    progress: 0,
    status: "pending",
    employee_notes: "",
    attachment_url: "",
    attachment_name: "",
  });

  // =========================================================
  // TOAST
  // =========================================================

  function showToast(
    message: string,
    type: "success" | "error"
  ) {
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  }

  // =========================================================
  // LOAD SESSION
  // =========================================================

  useEffect(() => {
    const storedSession = localStorage.getItem("dwm_session");

    if (!storedSession) {
      router.push("/");
      return;
    }

    try {
      const parsedSession: SessionData =
        JSON.parse(storedSession);

      if (!parsedSession.user) {
        localStorage.removeItem("dwm_session");
        router.push("/");
        return;
      }

      if (parsedSession.user.role !== "employee") {
        router.push("/dashboard");
        return;
      }

      setSession(parsedSession);
    } catch (err) {
      console.error("SESSION ERROR:", err);

      localStorage.removeItem("dwm_session");
      router.push("/");
    }
  }, [router]);

  // =========================================================
  // LOAD TASK EMPLOYEE
  // =========================================================

  async function handleUploadFile(file: File) {
  try {
    if (!session?.user?.id || !selectedTask) {
      throw new Error("Data task atau session tidak ditemukan.");
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error("Ukuran file maksimal 10 MB.");
    }

    setUploadingFile(true);
    setError("");

    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(String(reader.result));
      };

      reader.onerror = () => {
        reject(new Error("Gagal membaca file."));
      };

      reader.readAsDataURL(file);
    });

    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        action: "uploadTaskFile",
        task_id: selectedTask.id,
        user_id: session.user.id,
        file_name: file.name,
        mime_type: file.type,
        file_data: fileData,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Gagal mengupload file."
      );
    }

    setResultForm((prev) => ({
      ...prev,
      attachment_url: data.data.file_url || "",
      attachment_name:
        data.data.file_name || file.name,
    }));

    setSelectedFile(file);

    showToast("File berhasil diupload", "success");

  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Gagal mengupload file.";

    console.error("UPLOAD FILE ERROR:", err);

    setError(message);
    showToast(message, "error");

  } finally {
    setUploadingFile(false);
  }
}

  async function loadTasks(employeeId: string) {
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
          assigned_to: employeeId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Gagal mengambil task"
        );
      }

      setTasks(data.data || []);
    } catch (err) {
      console.error("LOAD TASK ERROR:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil task";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOAD TASK SETELAH SESSION TERSEDIA
  // =========================================================

  useEffect(() => {
    if (session?.user?.id) {
      loadTasks(session.user.id);
    }
  }, [session]);

  // =========================================================
  // BUKA DETAIL TASK
  // =========================================================

  function openTask(task: Task) {
    setSelectedTask(task);

    setResultForm({
      progress: Number(task.progress) || 0,
      status: task.status || "pending",
      employee_notes: task.employee_notes || "",
      attachment_url: task.attachment_url || "",
      attachment_name: task.attachment_name || "",
    });
  }

  // =========================================================
  // UPDATE HASIL TASK
  // =========================================================

  async function handleUpdateTask(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedTask || !session?.user?.id) {
      return;
    }

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

          progress: Number(resultForm.progress),

          status: resultForm.status,

          employee_notes: resultForm.employee_notes,

          attachment_url: resultForm.attachment_url,

          attachment_name: resultForm.attachment_name,

          updated_by: session.user.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Gagal memperbarui task"
        );
      }

      showToast(
        "Hasil pekerjaan berhasil diperbarui",
        "success"
      );

      setSelectedTask(null);

      await loadTasks(session.user.id);
    } catch (err) {
      console.error("UPDATE TASK ERROR:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui task";

      setError(message);

      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    localStorage.removeItem("dwm_session");
    router.push("/");
  }

  // =========================================================
  // STATISTIK
  // =========================================================

  const totalTasks = tasks.length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  // =========================================================
  // PRIORITY BADGE
  // =========================================================

  function getPriorityClass(priority: string) {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";

      case "high":
        return "bg-orange-100 text-orange-700";

      case "medium":
        return "bg-yellow-100 text-yellow-700";

      case "low":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  // =========================================================
  // STATUS BADGE
  // =========================================================

  function getStatusClass(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "in_progress":
        return "bg-blue-100 text-blue-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "completed":
        return "Selesai";

      case "in_progress":
        return "Sedang Dikerjakan";

      case "pending":
        return "Pending";

      case "cancelled":
        return "Dibatalkan";

      default:
        return status;
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
        return priority;
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">
          Memuat dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast.show && (
        <div className="fixed right-4 top-4 z-[100] sm:right-6 sm:top-6">
          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
              toast.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span className="text-base font-bold">
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

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Dashboard Employee
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Pantau dan selesaikan tugas Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
          >
            Keluar
          </button>

        </div>

        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white">

          <p className="text-sm text-slate-300">
            Selamat datang
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            {session.user.name} 👋
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Berikut adalah tugas yang diberikan kepada Anda.
          </p>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            STATISTIK
        =================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Total Task
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalTasks}
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {pendingTasks}
            </p>
          </div>

          {/* IN PROGRESS */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Sedang Dikerjakan
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inProgressTasks}
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Selesai
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {completedTasks}
            </p>
          </div>

        </div>

        {/* ===================================================
            TASK LIST
        =================================================== */}

        <div className="mt-8">

          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Task Saya
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Klik task untuk melihat detail dan memperbarui hasil pekerjaan.
            </p>
          </div>

          {loading ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Memuat task...
            </div>

          ) : tasks.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-semibold text-slate-700">
                Belum ada task
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Saat admin memberikan task, task akan muncul di sini.
              </p>
            </div>

          ) : (

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] text-left text-sm">

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr>

                      <th className="px-4 py-3 font-semibold text-slate-700">
                        Task
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

                    {tasks.map((task) => (

                      <tr
                        key={task.id}
                        onClick={() => openTask(task)}
                        className="cursor-pointer transition hover:bg-slate-50"
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

                        {/* PRIORITY */}

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
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
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
                                  width: `${Number(task.progress) || 0}%`,
                                }}
                              />

                            </div>

                            <span className="text-xs font-medium text-slate-600">
                              {Number(task.progress) || 0}%
                            </span>

                          </div>

                        </td>

                        {/* DEADLINE */}

                        <td className="px-4 py-4 text-slate-700">
                          {task.due_date || "-"}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          DETAIL TASK MODAL
      ===================================================== */}

      {selectedTask && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Detail & Hasil Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Lihat tugas dan kirim hasil pekerjaan.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            {/* CONTENT */}

            <form
              onSubmit={handleUpdateTask}
              className="space-y-6 p-6"
            >

              {/* JUDUL */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Judul Task
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedTask.title}
                </h3>

              </div>

              {/* DESKRIPSI */}

              <div>

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Deskripsi
                </p>

                <div className="mt-2 rounded-xl bg-slate-50 p-4">

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedTask.description || "-"}
                  </p>

                </div>

              </div>

              {/* INFO */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

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
                    Deadline
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedTask.due_date || "-"}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Tanggal Mulai
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedTask.start_date || "-"}
                  </p>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Status Saat Ini
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {getStatusLabel(selectedTask.status)}
                  </p>

                </div>

              </div>

              {/* CATATAN ADMIN */}

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  Catatan Admin
                </p>

                <div className="mt-2 rounded-xl bg-slate-50 p-4">

                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedTask.notes || "Tidak ada catatan dari admin."}
                  </p>

                </div>

              </div>

              {/* HASIL PEKERJAAN */}

              <div className="border-t border-slate-200 pt-6">

                <div className="mb-5">

                  <h3 className="text-base font-bold text-slate-900">
                    Hasil Pekerjaan
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Perbarui progress dan kirim hasil pekerjaan Anda.
                  </p>

                </div>

                {/* PROGRESS */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label className="text-sm font-medium text-slate-700">
                      Progress Pekerjaan
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {resultForm.progress}%
                    </span>

                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={resultForm.progress}
                    onChange={(event) =>
                      setResultForm({
                        ...resultForm,
                        progress: Number(event.target.value),
                      })
                    }
                    className="w-full accent-blue-600"
                    disabled={
                      selectedTask.status === "completed" ||
                      selectedTask.status === "cancelled"
                    }
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>

                </div>

                {/* STATUS */}

                <div className="mt-5">

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={resultForm.status}
                    onChange={(event) =>
                      setResultForm({
                        ...resultForm,
                        status: event.target.value,
                      })
                    }
                    disabled={
                      selectedTask.status === "completed" ||
                      selectedTask.status === "cancelled"
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >

                    <option value="pending">
                      Pending
                    </option>

                    <option value="in_progress">
                      Sedang Dikerjakan
                    </option>

                    <option value="completed">
                      Selesai
                    </option>

                  </select>

                </div>

                {/* PENJELASAN */}

                <div className="mt-5">

                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Penjelasan Pekerjaan
                  </label>

                  <textarea
                    rows={5}
                    value={resultForm.employee_notes}
                    onChange={(event) =>
                      setResultForm({
                        ...resultForm,
                        employee_notes: event.target.value,
                      })
                    }
                    placeholder="Jelaskan hasil pekerjaan yang sudah dikerjakan..."
                    disabled={
                      selectedTask.status === "completed" ||
                      selectedTask.status === "cancelled"
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                </div>

                {/* FILE HASIL */}
      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          File Hasil Pekerjaan
        </label>

        {resultForm.attachment_name ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">
                {resultForm.attachment_name}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                File sudah diupload
              </p>
            </div>

            {resultForm.attachment_url && (
              <a
                href={resultForm.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Lihat File
              </a>
            )}
          </div>
        ) : null}

        <label
          className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
            uploadingFile
              ? "cursor-not-allowed border-slate-200 bg-slate-50"
              : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
          } ${
            selectedTask.status === "completed" ||
            selectedTask.status === "cancelled"
              ? "pointer-events-none cursor-not-allowed bg-slate-100 opacity-60"
              : ""
          }`}
        >
          <input
            type="file"
            className="hidden"
            disabled={
              uploadingFile ||
              selectedTask.status === "completed" ||
              selectedTask.status === "cancelled"
            }
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              handleUploadFile(file);
              event.target.value = "";
            }}
          />

          <div>     
              {uploadingFile ? (
                <>
                  <p className="text-sm font-medium text-blue-600">
                    Mengupload file...
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Mohon tunggu sebentar
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Klik untuk memilih file
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Maksimal ukuran file 10 MB
                  </p>
                </>
              )}
            </div>
          </label>
        </div>

              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white px-6 py-4">

                <div className="flex flex-col-reverse gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Tutup
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      selectedTask.status === "completed" ||
                      selectedTask.status === "cancelled"
                    }
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Simpan Hasil Pekerjaan"}
                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}