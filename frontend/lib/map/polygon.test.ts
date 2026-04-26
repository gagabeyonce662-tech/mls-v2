import assert from "node:assert/strict";
import {
  isPointInPolygon,
  normalizePolygonRing,
  type LatLngPoint,
} from "./polygon";

const square: LatLngPoint[] = [
  { lat: 43.0, lng: -79.0 },
  { lat: 43.0, lng: -78.0 },
  { lat: 44.0, lng: -78.0 },
  { lat: 44.0, lng: -79.0 },
];

const closedSquare = normalizePolygonRing(square);
assert.equal(closedSquare.length, 5);
assert.deepEqual(closedSquare[0], closedSquare[closedSquare.length - 1]);

assert.equal(isPointInPolygon({ lat: 43.5, lng: -78.5 }, square), true);
assert.equal(isPointInPolygon({ lat: 42.5, lng: -78.5 }, square), false);
assert.equal(isPointInPolygon({ lat: 43.0, lng: -78.5 }, square), true);
