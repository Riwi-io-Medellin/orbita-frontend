import { useState } from "react";
import { useNavigate } from "react-router";

function AuthPage() {
    const [isRegistering, setIsRegistering] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Login falso
        navigate("/dashboard");
    };

    return (
        <div>
            <h1>Orbita</h1>

            <h2>
                {isRegistering ? "Crear cuenta" : "Iniciar sesión"}
            </h2>

            <form onSubmit={handleSubmit}>
                {isRegistering && (
                    <div>
                        <label htmlFor="name">
                            Nombre
                        </label>

                        <input
                            id="name"
                            type="text"
                            placeholder="Tu nombre"
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="email">
                        Correo electrónico
                    </label>

                    <input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Contraseña
                    </label>

                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                    />
                </div>

                <button type="submit">
                    {isRegistering ? "Registrarse" : "Iniciar sesión"}
                </button>
            </form>

            <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
            >
                {isRegistering
                    ? "Ya tengo una cuenta"
                    : "Crear una cuenta"}
            </button>
        </div>
    );
}

export default AuthPage;