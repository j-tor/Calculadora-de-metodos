# Calculadora de Métodos Numéricos

Esta es una aplicación web completa para resolver ecuaciones no lineales utilizando métodos numéricos clásicos. La aplicación permite a los usuarios ingresar una ecuación, definir un intervalo o un punto inicial, y obtener la raíz de la ecuación junto con una visualización gráfica.

## 🚀 Características Principales

-

## 🛠️ Instalación y Configuración

### Requisitos Previos

- Python 3.8+
- pip (gestor de paquetes de Python)

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Calculadora-de-metodos
```

### 2. Crear un Entorno Virtual

Se recomienda crear un entorno virtual para gestionar las dependencias:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 3. Instalar Dependencias

Instala todas las librerías necesarias desde el archivo `requirements.txt`:

```bash
pip install -r backend/requirements.txt
```

### 4. Ejecutar la Aplicación

Inicia el servidor de desarrollo:

```bash
uvicorn backend.src.main:app --reload
```

La aplicación estará disponible en: `http://localhost:8000`

## 💻 Uso

### Interfaz Web

1. Abre `http://localhost:8000` en tu navegador.
2. Ingresa la ecuación en formato matemático (ej: `x**2 - 4`).
3. Selecciona la variable (por defecto `x`).
4. Define los parámetros:
   - **Intervalo (a, b)**: Para el método de bisección.
   - **Punto Inicial**: Para el método de Newton-Raphson.
5. Haz clic en **Calcular**.

### API REST

También puedes interactuar con la API directamente:

**Endpoint**: `POST /api/calculator/calculate`

**Ejemplo de Petición (JSON)**:

```json
{
  "equation": "x**2 - 4",
  "variable": "x",
  "x_start": 0,
  "x_end": 5,
  "tolerance": 1e-6,
  "max_iterations": 100
}
```

**Respuesta Exitosa**:

```json
{
  "method_used": "Bisección",
  "result": 2.0000009536743164,
  "iterations": 23,
  "coordinates": [
    {"x": -5.0, "y": 21.0},
    {"x": -4.98046875, "y": 20.80517578125},
    ...
  ],
  "message": "Cálculo exitoso usando el método de Bisección."
}
```

## 🧪 Pruebas

Para ejecutar las pruebas unitarias:

```bash
python -m unittest discover tests
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── main.py           # Punto de entrada de la aplicación
│   ├── middleware/       # Middlewares (CORS)
│   ├── routes/           # Endpoints de la API
│   ├── schemas/          # Modelos de datos (Pydantic)
│   ├── services/         # Lógica de negocio y métodos numéricos
│   └── utils/            # Utilidades
├── tests/                # Pruebas unitarias
├── requirements.txt      # Dependencias
└── README.md             # Documentación
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`).
2. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
3. Push a la rama (`git push origin feature/AmazingFeature`).
4. Abre un Pull Request.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
