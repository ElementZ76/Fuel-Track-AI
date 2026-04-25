"""
Pure unit tests for the mileage calculation service.
"""

from server.services.mileage import calculate_mileage

def test_calculate_mileage_normal():
    # current_odo, prev_odo, fuel_qty, is_full_tank, missed
    result = calculate_mileage(200.0, 100.0, 10.0, True, False)
    assert result == 10.0

def test_calculate_mileage_partial_fill():
    result = calculate_mileage(200.0, 100.0, 10.0, False, False)
    assert result is None

def test_calculate_mileage_missed():
    result = calculate_mileage(200.0, 100.0, 10.0, True, True)
    assert result is None

def test_calculate_mileage_zero_fuel():
    result = calculate_mileage(200.0, 100.0, 0.0, True, False)
    assert result is None

def test_calculate_mileage_negative_distance():
    result = calculate_mileage(100.0, 200.0, 10.0, True, False)
    assert result is None

def test_calculate_mileage_rounding():
    result = calculate_mileage(234.5, 100.0, 12.34, True, False)
    # dist = 134.5, fuel = 12.34 -> 134.5 / 12.34 = 10.8995... -> 10.9
    assert result == 10.9
