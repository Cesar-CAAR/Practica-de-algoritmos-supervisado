# Project Alpha - Módulo de Analítica Predictiva

Este repositorio contiene el módulo de **Análisis de Datos y Machine Learning (Regresión Lineal)** desarrollado en Angular. El sistema está diseñado para ingerir datasets dinámicos en formato CSV, descubrir patrones, limpiar información y proyectar tendencias futuras a través de un motor matemático de mínimos cuadrados.

---

## Características Principales

*   **Ingesta Dinámica (Drag & Drop):** Soporta la carga de archivos CSV con auto-descubrimiento de columnas mediante `PapaParse`.
*   **Motor de Mapeo Inteligente:** Detecta automáticamente variables de Tiempo (Eje X) y variables de Valor (Eje Y) basándose en expresiones regulares y nomenclatura de bases de datos.
*   **Pipeline de Transformación:** Agrupa y limpia datos en tiempo real, permitiendo al usuario elegir operaciones matemáticas como **Sumatoria Total** o **Promedio**.
*   **Regresión Lineal (Machine Learning):** Servicio matemático independiente (`RegressionService`) que calcula tendencias y proyecta el comportamiento futuro.
*   **Visualización Interactiva:** Renderizado de proyecciones mediante `Chart.js` y `ng2-charts` con soporte responsivo.

---

## Stack Tecnológico

*   **Framework:** Angular (v21+)
*   **Lenguaje:** TypeScript / HTML5 / CSS3
*   **Procesamiento de Datos:** PapaParse
*   **Gráficas y Visualización:** Chart.js + ng2-charts
