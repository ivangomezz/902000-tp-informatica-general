// --- CONFIGURACIÓN DE APIS Y ESTADO DEL JUEGO ---
const API_SOUTHPARK_URL = "https://spapi.dev/api/characters";
const MAX_ERRORES = 3;
const TOTAL_PREGUNTAS = 5;

let preguntas = [];
let indicePreguntaActual = 0;
let erroresCometidos = 0;
let aciertos = 0;

// --- ELEMENTOS DEL DOM ---
let pantallaInicio, pantallaJuego, pantallaResultado;
let btnComenzar, btnReiniciar, btnJugarNuevo;
let textoPregunta, opcionesContainer, corazonesSpan;
let numPreguntaSpan, totalPreguntasSpan, contadorAciertosSpan;
let tituloResultado, mensajeResultado;

document.addEventListener("DOMContentLoaded", () => {
    // Vínculos con los elementos del HTML
    pantallaInicio = document.getElementById("pantalla-inicio");
    pantallaJuego = document.getElementById("pantalla-juego");
    pantallaResultado = document.getElementById("pantalla-resultado");

    btnComenzar = document.getElementById("btn-comenzar");
    btnReiniciar = document.getElementById("btn-reiniciar");
    btnJugarNuevo = document.getElementById("btn-jugar-nuevo");

    textoPregunta = document.getElementById("texto-pregunta");
    opcionesContainer = document.getElementById("opciones-container");
    corazonesSpan = document.getElementById("corazones");
    numPreguntaSpan = document.getElementById("num-pregunta");
    totalPreguntasSpan = document.getElementById("total-preguntas");
    contadorAciertosSpan = document.getElementById("contador-aciertos");

    tituloResultado = document.getElementById("titulo-resultado");
    mensajeResultado = document.getElementById("mensaje-resultado");

    // Asignación de eventos
    btnComenzar.addEventListener("click", iniciarJuego);
    btnReiniciar.addEventListener("click", iniciarJuego);
    btnJugarNuevo.addEventListener("click", iniciarJuego);
});

async function iniciarJuego() {
    erroresCometidos = 0;
    aciertos = 0;
    indicePreguntaActual = 0;
    preguntas = [];

    actualizarVidasUI();
    contadorAciertosSpan.textContent = "0";

    pantallaInicio.classList.add("oculto");
    pantallaResultado.classList.add("oculto");
    pantallaJuego.classList.remove("oculto");

    textoPregunta.textContent = "Cargando preguntas desde South Park API...";
    opcionesContainer.innerHTML = "";

    try {
        preguntas = await cargarPreguntasAPI();
        totalPreguntasSpan.textContent = preguntas.length;
        mostrarPreguntaActual();
    } catch (error) {
        console.warn("Error al conectar con la API, ejecutando respaldo local:", error);
        preguntas = cargarPreguntasRespaldo();
        totalPreguntasSpan.textContent = preguntas.length;
        mostrarPreguntaActual();
    }
}

