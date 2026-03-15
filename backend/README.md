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

## Metodos en decision_engine

Estos metodos se ejecutan llamando a `analyze_and_calculate(...)` desde Python. No estan conectados a un endpoint HTTP por defecto.

**Biseccion**
Parametros: `equation_str`, `x_start`, `x_end`, `tol`, `max_iter`, `requested_method="biseccion"`.
Retorna: `method`, `result`, `iterations`, `expression`, `symbol`.
Ejemplo:
```python
from services.decision_engine import analyze_and_calculate
res = analyze_and_calculate(equation_str="x**2-4", x_start=0, x_end=3, requested_method="biseccion")
```

**Newton-Raphson**
Parametros: `equation_str`, `initial_guess` (o `x_start/x_end`), `requested_method="newton"`.
Retorna: `method`, `result`, `iterations`, `expression`, `symbol`.
Ejemplo:
```python
res = analyze_and_calculate(equation_str="cos(x)-x", initial_guess=0.5, requested_method="newton")
```

**Punto Fijo**
Parametros: `equation_str` como `g(x)` o `g_equation_str`, `initial_guess`, `requested_method="punto fijo"`.
Retorna: `method`, `result`, `iterations`, `expression`, `symbol`.
Ejemplo:
```python
res = analyze_and_calculate(equation_str="cos(x)", initial_guess=0.5, requested_method="punto fijo")
```

**Convergencia Fija**
Parametros: `equation_str` como `g(x)` o `g_equation_str`, `initial_guess` o `x_start/x_end`, `requested_method="convergenciafija"`.
Retorna: `method`, `converges`, `expression`, `symbol`.
Ejemplo:
```python
res = analyze_and_calculate(equation_str="cos(x)", x_start=0, x_end=1, requested_method="convergenciafija")
```

**Interpolacion de Lagrange**
Parametros: `x_values`, `y_values`, `x_eval` opcional, `requested_method="lagrange"`.
Retorna: `method`, `polynomial` (sympy), `value` (si `x_eval`).
Ejemplo:
```python
res = analyze_and_calculate(x_values=[0,1,2], y_values=[1,3,2], x_eval=1.5, requested_method="lagrange")
```

**Interpolacion Polinomica (Vandermonde)**
Parametros: `x_values`, `y_values`, `x_eval` opcional, `requested_method="polinomica"`.
Retorna: `method`, `coefficients`, `value` (si `x_eval`).
Ejemplo:
```python
res = analyze_and_calculate(x_values=[0,1,2], y_values=[1,3,2], x_eval=1.5, requested_method="polinomica")
```

**Interpolacion de Newton (Diferencias Divididas)**
Parametros: `x_values`, `y_values`, `x_eval` opcional, `requested_method="newton interpolacion"`.
Retorna: `method`, `coefficients`, `value` (si `x_eval`).
Ejemplo:
```python
res = analyze_and_calculate(x_values=[0,1,2], y_values=[1,3,2], x_eval=1.5, requested_method="newton interpolacion")
```

**Trazos Cubicos (Spline)**
Parametros: `x_values`, `y_values`, `x_eval` opcional, `requested_method="trazos cubicos"`.
Retorna: `method`, `coefficients` (a,b,c,d), `value` (si `x_eval`).
Ejemplo:
```python
res = analyze_and_calculate(x_values=[0,1,2], y_values=[1,3,2], x_eval=1.5, requested_method="trazos cubicos")
```

**Resolver Matriz Triangular Superior/Inferior/Diagonal**
Parametros: `matrix_a`, `vector_b`, `matrix_type` o `method` con palabra clave.
Retorna: `method`, `solution`.
Ejemplo:
```python
res = analyze_and_calculate(matrix_a=[[2,1,0],[0,3,1],[0,0,4]], vector_b=[3,7,8], matrix_type="upper", requested_method="matriz")
```

**LU (Doolittle o Crout)**
Parametros: `matrix_a`, `vector_b` opcional, `lu_variant` o `method` con palabra clave.
Retorna: `method`, `L`, `U`, `solution` (si `vector_b`).
Ejemplo:
```python
res = analyze_and_calculate(matrix_a=[[2,1],[4,5]], vector_b=[5,6], lu_variant="doolittle", requested_method="lu")
```

**Jacobiano**
Parametros: `funcs` (lista de strings), `vars_list` (lista de variables), `values` opcional.
Retorna: `method`, `jacobian` (sympy), `jacobian_numeric` (si `values`).
Ejemplo:
```python
res = analyze_and_calculate(funcs=["x**2 + y", "x - y**2"], vars_list=["x","y"], values=[1,2], requested_method="jacobiano")
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




