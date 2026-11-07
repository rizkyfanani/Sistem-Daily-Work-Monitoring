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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  // ==============================
  // FORM TAMBAH KARYAWAN
  // ==============================

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
  useState<Employee | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirm, setEditPasswordConfirm] = useState("");
  const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success",
});

  // ==============================
  // LOAD EMPLOYEES
  // ==============================

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/app-script", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getEmployees",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Gagal mengambil data karyawan"
        );
      }

      setEmployees(result.data || []);
    } catch (err) {
      console.error("LOAD EMPLOYEES ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data karyawan"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // RESET FORM
  // ==============================

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
  }

  function openEditForm(employee: Employee) {
  setEditingEmployee(employee);

  setEditName(employee.name);
  setEditEmail(employee.email);
  setEditIsActive(employee.is_active);
  setEditPassword("");
  setEditPasswordConfirm("");

  setError("");
  setEditError("");
  setShowEditForm(true);
  }

  async function handleDeleteEmployee(employee: Employee) {
  const confirmed = window.confirm(
    `Yakin ingin menghapus karyawan "${employee.name}"?\n\nData akun ini akan dihapus dari daftar karyawan.`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch("/api/app-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "deleteEmployee",
        id: employee.id,
        deleted_by: "ADM001",
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || "Gagal menghapus karyawan"
      );
    }

    await loadEmployees();

  } catch (err) {
    console.error(
      "DELETE EMPLOYEE ERROR:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Terjadi kesalahan saat menghapus karyawan"
    );
  }
}

  // ==============================
  // CREATE EMPLOYEE
  // ==============================

  async function handleCreateEmployee(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Nama karyawan wajib diisi");
      return;
    }

    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    if (!password) {
      setError("Password wajib diisi");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/app-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createEmployee",
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Gagal menambahkan karyawan"
        );
      }

      // Tutup form
      setShowForm(false);

      // Reset form
      resetForm();

      // Ambil data terbaru
      await loadEmployees();

      alert("Karyawan berhasil ditambahkan");
    } catch (err) {
      console.error("CREATE EMPLOYEE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menambahkan karyawan"
      );
    } finally {
      setSaving(false);
    }
  }

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="min-h-screen bg-slate-50">

      {toast.show && (
        <div className="fixed right-6 top-6 z-[100]">
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 shadow-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Berhasil
              </p>
              <p className="text-sm text-slate-500">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
      <AdminNavigation />

      <main className="min-h-screen pt-16 md:ml-[var(--sidebar-width)] md:pt-0 transition-[margin] duration-300">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Kelola Karyawan
              </h1>

              <p className="mt-1 text-slate-500">
                Kelola akun dan data karyawan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                resetForm();
                setShowForm(true);
              }}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Tambah Karyawan
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-semibold text-slate-900">
                Daftar Karyawan
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Memuat data karyawan...
              </div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Belum ada data karyawan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nama</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {employee.name}
                          </div>

                          <div className="text-xs text-slate-400">
                            {employee.id}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {employee.email}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {employee.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {employee.is_active ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              Aktif
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Tombol Kelola */}
                            <button
                              type="button"
                              onClick={() => openEditForm(employee)}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                            >
                              Kelola
                            </button>

                            {/* Tombol Hapus */}
                            {employee.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(employee)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================== */}
        {/* MODAL TAMBAH KARYAWAN */}
        {/* ============================== */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Tambah Karyawan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Buat akun baru untuk karyawan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setError("");
                  }}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateEmployee} className="space-y-5 p-6">
                {/* Nama */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nama Karyawan
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@test.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                      setError("");
                    }}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Karyawan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================== */}
        {/* MODAL EDIT KARYAWAN */}
        {/* ============================== */}

        {showEditForm && editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Karyawan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Perbarui data karyawan.
                  </p>
                  {editError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {editError}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingEmployee(null);
                    setError("");
                    setEditError("");
                  }}
                  className="text-2xl text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (!editName.trim()) {
                    setEditError("Nama karyawan wajib diisi");
                    return;
                  }

                  if (!editEmail.trim()) {
                    setEditError("Email wajib diisi");
                    return;
                  }

                  if (editPassword && editPassword.length < 8) {
                    setEditError("Password baru minimal 8 karakter");
                    return;
                  }

                  if (editPassword !== editPasswordConfirm) {
                    setEditError("Konfirmasi password tidak sama");
                    return;
                  }

                  try {
                    setSaving(true);
                    setEditError("");

                    const response = await fetch("/api/app-script", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                      action: "updateEmployee",
                      id: editingEmployee.id,
                      name: editName.trim(),
                      email: editEmail.trim(),
                      is_active: editIsActive,
                      new_password: editPassword,
                      updated_by: "ADM001",
                    }),
                    });

                    const result = await response.json();

                    if (!result.success) {
                      throw new Error(
                        result.message || "Gagal memperbarui karyawan"
                      );
                    }

                    setShowEditForm(false);
                    setEditingEmployee(null);
                    await loadEmployees();
                    setToast({
                    show: true,
                    message: "Data karyawan berhasil diperbarui",
                    type: "success",
                  });

                  setTimeout(() => {
                    setToast({
                      show: false,
                      message: "",
                      type: "success",
                    });
                  }, 3000);
                  } catch (err) {
                    console.error("UPDATE EMPLOYEE ERROR:", err);
                    setEditError(
                      err instanceof Error
                        ? err.message
                        : "Terjadi kesalahan saat memperbarui karyawan"
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                className="space-y-5 overflow-y-auto p-6"
              >

                {/* ID */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ID Karyawan
                  </label>

                  <input
                    type="text"
                    value={editingEmployee.id}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                  />
                </div>

                {/* Nama */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nama Karyawan
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Password Baru */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password Baru
                  </label>

                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Minimal 8 karakter. Kosongkan jika password tidak ingin diubah.
                  </p>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Konfirmasi Password
                  </label>

                  <input
                    type="password"
                    value={editPasswordConfirm}
                    onChange={(e) => setEditPasswordConfirm(e.target.value)}
                    placeholder="Ulangi password baru"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={editIsActive ? "true" : "false"}
                    onChange={(e) => setEditIsActive(e.target.value === "true")}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingEmployee(null);
                      setError("");
                      setEditError("");
                    }}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}