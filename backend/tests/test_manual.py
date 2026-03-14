import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from services.decision_engine import analyze_and_calculate

def test_manual_selection():
    print("--- Test 3: Manual Newton-Raphson ---")
    res = analyze_and_calculate(
        equation_str="x**2 - 4",
        var_name="x",
        initial_guess=1.0,
        requested_method="Newton-Raphson"
    )
    print(f"Método devuelto: {res['method']}")
    assert res['method'] == "Newton-Raphson"

    print("\n--- Test 4: Manual Bisección ---")
    res2 = analyze_and_calculate(
        equation_str="x**2 - 4",
        var_name="x",
        x_start=0,
        x_end=3,
        requested_method="Bisección"
    )
    print(f"Método devuelto: {res2['method']}")
    assert res2['method'] == "Bisección"

if __name__ == "__main__":
    try:
        test_manual_selection()
        print("\n¡Pruebas de selección manual exitosas!")
    except Exception as e:
        print(f"\nError en las pruebas: {str(e)}")
        sys.exit(1)
