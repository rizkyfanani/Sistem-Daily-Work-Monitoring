"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    token: string;
    expires_at: string;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error("API URL belum tersedia");
      }

      const response = await fetch("/api/app-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password: password,
        }),
      });

      const result: LoginResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Login gagal");
      }

      if (!result.data) {
        throw new Error("Data login tidak tersedia");
      }

      // Simpan session sementara
      localStorage.setItem(
        "dwm_session",
        JSON.stringify(result.data)
      );

      // Arahkan user berdasarkan role
      if (result.data.user.role === "employee") {
        router.push("/employee/dashboard");
      } else {
        router.push("/dashboard");
      }

      console.log("LOGIN RESPONSE:", result);

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white text-xl font-bold">
              DW
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Daily Work Monitoring
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Silakan masuk untuk melanjutkan
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Daily Work Monitoring System
        </p>
      </div>
    </main>
  );
}