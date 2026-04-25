const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

// ─── Swagger Config ────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Calculadora de Valor Final",
      version: "1.0.0",
      description:
        "Microservicio que calcula el valor final de un producto aplicando IVA y descuentos.",
    },
    servers: [
      {
        url: process.env.SERVER_URL || `http://localhost:${PORT}`,
        description: "Servidor activo",
      },
    ],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    mensaje: "API Calculadora de Valor Final activa",
    documentacion: "/api-docs",
    endpoints: ["/calcularValorFinal/"],
  });
});

// ─── Endpoint principal ────────────────────────────────────────────────────────
/**
 * @swagger
 * /calcularValorFinal/:
 *   post:
 *     summary: Calcula el valor final de un producto con IVA y descuento
 *     description: Recibe los datos del producto y retorna el valor final calculado aplicando IVA (%) y descuento (%).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - costoBase
 *               - iva
 *               - descuentos
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código alfanumérico del producto
 *                 example: "PROD-001"
 *               nombre:
 *                 type: string
 *                 description: Nombre del producto (solo letras)
 *                 example: "Televisor Samsung"
 *               costoBase:
 *                 type: number
 *                 description: Costo base del producto
 *                 example: 100000
 *               iva:
 *                 type: number
 *                 description: Porcentaje de IVA a aplicar
 *                 example: 19
 *               descuentos:
 *                 type: number
 *                 description: Porcentaje de descuento a aplicar
 *                 example: 15
 *     responses:
 *       200:
 *         description: Cálculo exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoHTTP:
 *                   type: integer
 *                   example: 200
 *                 Titulo:
 *                   type: string
 *                   example: "Valor Final a Pagar"
 *                 valorBase:
 *                   type: number
 *                   example: 100000
 *                 iva:
 *                   type: number
 *                   example: 19
 *                 descuento:
 *                   type: number
 *                   example: 15
 *                 Valor:
 *                   type: number
 *                   example: 101150
 *       400:
 *         description: Datos inválidos o faltantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoHTTP:
 *                   type: integer
 *                   example: 400
 *                 Titulo:
 *                   type: string
 *                   example: "Datos inválidos"
 *                 Valor:
 *                   type: integer
 *                   example: 0
 *       404:
 *         description: Valor no encontrado (campos vacíos o nulos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoHTTP:
 *                   type: integer
 *                   example: 404
 *                 Titulo:
 *                   type: string
 *                   example: "Valor No encontrado"
 *                 Valor:
 *                   type: integer
 *                   example: 0
 */
app.post("/calcularValorFinal/", (req, res) => {
  const { codigo, nombre, costoBase, iva, descuentos } = req.body;

  // Verificar campos presentes
  if (
    codigo === undefined ||
    nombre === undefined ||
    costoBase === undefined ||
    iva === undefined ||
    descuentos === undefined
  ) {
    return res.status(404).json({
      codigoHTTP: 404,
      Titulo: "Valor No encontrado",
      Valor: 0,
    });
  }

  // Validar código alfanumérico
  const codigoRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!codigoRegex.test(String(codigo))) {
    return res.status(400).json({
      codigoHTTP: 400,
      Titulo: "Datos inválidos: código debe ser alfanumérico",
      Valor: 0,
    });
  }

  // Validar nombre solo letras y espacios
  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nombreRegex.test(String(nombre))) {
    return res.status(400).json({
      codigoHTTP: 400,
      Titulo: "Datos inválidos: nombre debe contener solo letras",
      Valor: 0,
    });
  }

  // Validar numéricos
  const base = parseFloat(costoBase);
  const ivaVal = parseFloat(iva);
  const descVal = parseFloat(descuentos);

  if (isNaN(base) || isNaN(ivaVal) || isNaN(descVal)) {
    return res.status(400).json({
      codigoHTTP: 400,
      Titulo: "Datos inválidos: costoBase, iva y descuentos deben ser numéricos",
      Valor: 0,
    });
  }

  if (base < 0 || ivaVal < 0 || descVal < 0) {
    return res.status(400).json({
      codigoHTTP: 400,
      Titulo: "Datos inválidos: los valores no pueden ser negativos",
      Valor: 0,
    });
  }

  // Fórmula: (costoBase * (1 + iva/100)) * (1 - descuento/100)
  // Se aplica IVA sobre la base, luego descuento sobre el subtotal con IVA
  const subtotalConIva = base * (1 + ivaVal / 100);
  const valorFinal = subtotalConIva * (1 - descVal / 100);

  return res.status(200).json({
    codigoHTTP: 200,
    Titulo: "Valor Final a Pagar",
    valorBase: base,
    iva: ivaVal,
    descuento: descVal,
    Valor: Math.round(valorFinal * 100) / 100,
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`📄 Swagger docs: http://localhost:${PORT}/api-docs`);
});
