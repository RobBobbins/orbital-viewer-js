function radialR(n, l, r) {
  if (r < 0) return 0;
  const rho = (2 * r) / n;
  if (n === 1 && l === 0) return 2 * Math.exp(-r);
  if (n === 2 && l === 0) return (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2);
  if (n === 2 && l === 1) return (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2);
  if (n === 3 && l === 0) return (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
  if (n === 3 && l === 1) return (4 / (81 * Math.sqrt(6))) * (6 * r - r * r) * Math.exp(-r / 3);
  if (n === 3 && l === 2) return (4 / (81 * Math.sqrt(30))) * (r * r) * Math.exp(-r / 3);
  if (n === 4 && l === 0) return (1 / 96) * (96 - 72 * r + 12 * r * r - r * r * r / 2) * Math.exp(-r / 4);
  if (n === 4 && l === 1) return (1 / (32 * Math.sqrt(15))) * (80 * r - 20 * r * r + r * r * r) * Math.exp(-r / 4);
  if (n === 4 && l === 2) return (1 / (96 * Math.sqrt(5))) * (12 * r * r - r * r * r) * Math.exp(-r / 4);
  if (n === 4 && l === 3) return (1 / (768 * Math.sqrt(35))) * Math.pow(r, 3) * Math.exp(-r / 4);
  return Math.pow(rho, l) * Math.exp(-rho / 2);
}

function realSphericalHarmonic(l, m, nx, ny, nz) {
  if (l === 0) return 1 / Math.sqrt(4 * Math.PI);
  return 1;
}

function psi(n, l, m, x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r < 1e-6) return l === 0 ? radialR(n, 0, 0) / Math.sqrt(4 * Math.PI) : 0;
  const R = radialR(n, l, r);
  const Y = realSphericalHarmonic(l, m, x / r, y / r, z / r);
  return R * Y;
}

function findMaxAmp(n, l, m, boxSize) {
  let maxA = 0;
  return maxA === 0 ? 1 : maxA;
}

console.log("No syntax errors in math functions.");
