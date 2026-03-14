import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.decision_engine import analyze_and_calculate
from services.plotter import generate_coordinates

def test_calculation():
    print("--- Test 1: Bisección (x^2 - 4) ---")
    res1 = analyze_and_calculate(
        equation_str="x**2 - 4",
        var_name="x",
        x_start=0,
        x_end=3
    )
    print(f"Método: {res1['method']}")
    print(f"Resultado: {res1['result']}")
    print(f"Iteraciones: {res1['iterations']}")
    
    coords = generate_coordinates(res1['expression'], res1['symbol'], res1['result'])
    print(f"Coordenadas generadas: {len(coords)}")
    
    print("\n--- Test 2: Newton-Raphson (cos(x) - x) ---")
    res2 = analyze_and_calculate(
        equation_str="cos(x) - x",
        var_name="x",
        initial_guess=0.5
    )
    print(f"Método: {res2['method']}")
    print(f"Resultado: {res2['result']}")
    print(f"Iteraciones: {res2['iterations']}")
    
    coords2 = generate_coordinates(res2['expression'], res2['symbol'], res2['result'])
    print(f"Coordenadas generadas: {len(coords2)}")

if __name__ == "__main__":
    try:
        test_calculation()
        print("\n¡Pruebas lógicas exitosas!")
    except Exception as e:
        print(f"\nError en las pruebas: {str(e)}")
        sys.exit(1)
