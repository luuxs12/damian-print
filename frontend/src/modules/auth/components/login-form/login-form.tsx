import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import {
  useState,
  useEffect,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  authStore,
} from "../../store/auth-store";

import {
  loginRequest,
  forgotPasswordRequest,
  verifyResetCodeRequest,
  resetPasswordRequest,
} from "../../services/auth-service";

import "./login-form.scss";

type RecoveryMode = "login" | "email" | "code" | "reset";

export const LoginForm = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<RecoveryMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending verification code
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const resetFormStates = () => {
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMessage("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await loginRequest({ email, password });
      authStore.saveSession({
        token: response.token,
        user: response.user,
      });
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const serverMessage = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
      setError(serverMessage || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const res = await forgotPasswordRequest(email);
      setSuccessMessage(res.message || "Código enviado con éxito.");
      setMode("code");
      setResendCooldown(60); // Cooldown timer starting on initial send
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const serverMessage = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
      setError(serverMessage || "Error al enviar el código de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const res = await forgotPasswordRequest(email);
      setSuccessMessage(res.message || "Código reenviado con éxito.");
      setResendCooldown(60); // 60s cooldown limit
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const serverMessage = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
      setError(serverMessage || "Error al reenviar el código de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const res = await verifyResetCodeRequest(email, code);
      setResetToken(res.resetToken);
      setSuccessMessage("Código verificado. Procede a cambiar tu contraseña.");
      setMode("reset");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const serverMessage = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
      setError(serverMessage || "Código de verificación incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  const isStrongPassword = (pass: string): boolean => {
    if (pass.length < 12) return false;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasNonalphas = /\W/.test(pass);
    return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas;
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");
    if (!isStrongPassword(newPassword)) {
      setError("La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas, números y al menos un símbolo especial.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const res = await resetPasswordRequest(resetToken, newPassword);
      setSuccessMessage(res.message || "Contraseña restablecida con éxito.");
      setPassword("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
      setMode("login");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const serverMessage = axiosErr.response?.data?.message || axiosErr.response?.data?.error;
      setError(serverMessage || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <div className="login-form__header">
        <h1>Industria Gráfica Damian</h1>
        {mode === "login" && <p>Inicia sesión para continuar</p>}
        {mode === "email" && <p>Recuperar contraseña</p>}
        {mode === "code" && <p>Verificar código</p>}
        {mode === "reset" && <p>Establecer nueva contraseña</p>}
      </div>

      {successMessage && !error && (
        <div className="login-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

      {mode === "login" && (
        <form className="login-form__body" onSubmit={handleLoginSubmit}>
          <div className="login-form__field">
            <label>Correo electrónico</label>
            <div className="login-form__input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-form__field">
            <label>Contraseña</label>
            <div className="login-form__input">
              <Lock size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-form__actions">
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                resetFormStates();
                setMode("email");
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      )}

      {mode === "email" && (
        <form className="login-form__body" onSubmit={handleEmailSubmit}>
          <p className="login-form__description" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center", marginBottom: "10px" }}>
            Introduce el correo registrado con tu usuario para enviarte un código de verificación.
          </p>

          <div className="login-form__field">
            <label>Correo electrónico</label>
            <div className="login-form__input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Enviando código..." : "Enviar código"}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={() => {
              resetFormStates();
              setMode("login");
            }}
          >
            Volver al Login
          </button>
        </form>
      )}

      {mode === "code" && (
        <form className="login-form__body" onSubmit={handleCodeSubmit}>
          <p className="login-form__description" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center", marginBottom: "10px" }}>
            Introduce el código de 6 dígitos enviado a tu correo.
          </p>

          <div className="login-form__field">
            <label>Código de verificación</label>
            <div className="login-form__input">
              <Lock size={18} />
              <input
                type="text"
                placeholder="Ej. 123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
          </div>

          <button
            type="button"
            className="resend-button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || loading}
          >
            {resendCooldown > 0
              ? `Reenviar código en ${resendCooldown}s`
              : "Volver a enviar código"}
          </button>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Verificando..." : "Verificar código"}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={() => {
              resetFormStates();
              setMode("email");
            }}
          >
            Modificar correo
          </button>
        </form>
      )}

      {mode === "reset" && (
        <form className="login-form__body" onSubmit={handleResetSubmit}>
          <p className="login-form__description" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center", marginBottom: "10px" }}>
            Establece tu nueva contraseña de acceso.
          </p>

          <div className="login-form__field">
            <label>Nueva contraseña</label>
            <div className="login-form__input">
              <Lock size={18} />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Mínimo 12 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-form__field">
            <label>Confirmar contraseña</label>
            <div className="login-form__input">
              <Lock size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
          </button>

          <button
            type="button"
            className="back-link"
            onClick={() => {
              resetFormStates();
              setMode("login");
            }}
          >
            Cancelar y volver
          </button>
        </form>
      )}
    </div>
  );
};