import test from 'node:test';
import assert from 'node:assert/strict';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  convertTemp,
  getCardinalDirection,
  mapWeatherConditionToType,
  calculateSunPosition,
  getUVDescriptor,
} from './weatherMath';

test('celsiusToFahrenheit converts standard temperatures correctly', () => {
  assert.equal(celsiusToFahrenheit(0), 32);
  assert.equal(celsiusToFahrenheit(100), 212);
  assert.equal(celsiusToFahrenheit(20), 68);
  assert.equal(celsiusToFahrenheit(-10), 14);
});

test('fahrenheitToCelsius converts backwards correctly', () => {
  assert.equal(fahrenheitToCelsius(32), 0);
  assert.equal(fahrenheitToCelsius(212), 100);
  assert.equal(fahrenheitToCelsius(68), 20);
});

test('convertTemp respects unit settings', () => {
  assert.equal(convertTemp(25, 'C'), 25);
  assert.equal(convertTemp(25, 'F'), 77);
});

test('getCardinalDirection calculates 16-point compass directions correctly', () => {
  assert.equal(getCardinalDirection(0), 'N');
  assert.equal(getCardinalDirection(90), 'E');
  assert.equal(getCardinalDirection(180), 'S');
  assert.equal(getCardinalDirection(270), 'W');
  assert.equal(getCardinalDirection(45), 'NE');
  assert.equal(getCardinalDirection(225), 'SW');
  assert.equal(getCardinalDirection(350), 'N');
});

test('mapWeatherConditionToType correctly identifies 3D weather environments', () => {
  assert.equal(mapWeatherConditionToType('Sunny'), 'sunny');
  assert.equal(mapWeatherConditionToType('Clear sky'), 'sunny');
  assert.equal(mapWeatherConditionToType('Partly Cloudy'), 'cloudy');
  assert.equal(mapWeatherConditionToType('Dense Overcast'), 'cloudy');
  assert.equal(mapWeatherConditionToType('Light Drizzle'), 'rainy');
  assert.equal(mapWeatherConditionToType('Heavy Showers'), 'rainy');
  assert.equal(mapWeatherConditionToType('Severe Thunderstorm'), 'storm');
  assert.equal(mapWeatherConditionToType('Blizzard Snow'), 'snow');
  assert.equal(mapWeatherConditionToType('Flurries'), 'snow');
  assert.equal(mapWeatherConditionToType('Breezy', 40), 'windy');
  assert.equal(mapWeatherConditionToType('Clear', 45), 'windy');
});

test('calculateSunPosition determines daylight progression', () => {
  const sunrise = '2026-11-07T06:00:00Z';
  const sunset = '2026-11-07T18:00:00Z'; // 12 hours total

  // Midday check (12:00 UTC)
  const midday = new Date('2026-11-07T12:00:00Z');
  const midPos = calculateSunPosition(sunrise, sunset, midday);
  assert.equal(midPos.isDay, true);
  assert.equal(midPos.progress, 0.5);
  assert.equal(midPos.angleDeg, 90);
  assert.equal(midPos.daylightHours, 12);

  // Nighttime check (22:00 UTC)
  const night = new Date('2026-11-07T22:00:00Z');
  const nightPos = calculateSunPosition(sunrise, sunset, night);
  assert.equal(nightPos.isDay, false);
  assert.equal(nightPos.progress, 1);
});

test('getUVDescriptor labels UV index risk bands correctly', () => {
  assert.equal(getUVDescriptor(1).label, 'Low');
  assert.equal(getUVDescriptor(4).label, 'Moderate');
  assert.equal(getUVDescriptor(6).label, 'High');
  assert.equal(getUVDescriptor(9).label, 'Very High');
  assert.equal(getUVDescriptor(11).label, 'Extreme');
});
