// --- CONFIGURACIÓN DE APIS ---
const API_DADOS_URL = "https://api.open5e.com/v1/dice/roll/";
// Podés reemplazar esta URL por tu propio endpoint de MockAPI (https://mockapi.io)
const API_RECORDS_URL = "https://jsonplaceholder.typicode.com/posts"; 

// --- ESTADO DEL JUEGO ---
const TOTAL_RONDAS = 3;
const TIEMPO_TURNO = 30; // Segundos por turno

let jugadorActual = 0; // 0 para Jugador 1, 1 para Jugador 2
let rondaActual = 1;
let tirosRestantes = 3;
let timerTurno = null;
let tiempoRestante = TIEMPO_TURNO;

// Representa el valor actual de los 5 dados y si están retenidos
let dados = [
    { valor: 1, retenido: false },
    { valor: 1, retenido: false },
    { valor: 1, retenido: false },
    { valor: 1, retenido: false },
    { valor: 1, retenido: false }
];

// Planilla de puntajes
let puntuaciones = [
    { escalera: null, poker: null, generala: null }, // Jugador 1
    { escalera: null, poker: null, generala: null }  // Jugador 2
];

document.addEventListener("DOMContentLoaded", () => {
    // Escuchadores de eventos principales
    document.getElementById("btn-lanzar").addEventListener("click", lanzarDados);
    document.getElementById("btn-reiniciar").addEventListener("click", iniciarJuego);

    // Selección de dados para retener/guardar
    const slotsDados = document.querySelectorAll(".dado-slot");
    slotsDados.forEach((slot, index) => {
        slot.addEventListener("click", () => alternarRetencionDado(index));
    });

    // Botones para anotar puntos en la planilla
    const botonesAnotar = document.querySelectorAll(".btn-anotar");
    botonesAnotar.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const jugador = parseInt(e.target.dataset.jugador);
            const categoria = e.target.dataset.cat;
            anotarPuntaje(jugador, categoria);
        });
    });

    // Cargar récords guardados en el servidor/API al iniciar
    cargarRecordsAPI();

    iniciarJuego();
});

// --- LÓGICA DE INICIALIZACIÓN ---

function iniciarJuego() {
    jugadorActual = 0;
    rondaActual = 1;
    tirosRestantes = 3;
    
    puntuaciones = [
        { escalera: null, poker: null, generala: null },
        { escalera: null, poker: null, generala: null }
    ];

    resetearDados();
    reiniciarTimer();
    actualizarInterfaz();
}

function resetearDados() {
    dados = dados.map(() => ({ valor: 1, retenido: false }));
    const slotsDados = document.querySelectorAll(".dado-slot");
    slotsDados.forEach(slot => slot.classList.remove("retenido"));
}

// --- MANEJO DEL TEMPORIZADOR ---

function reiniciarTimer() {
    clearInterval(timerTurno);
    tiempoRestante = TIEMPO_TURNO;
    document.getElementById("timer").textContent = tiempoRestante;

    timerTurno = setInterval(() => {
        tiempoRestante--;
        document.getElementById("timer").textContent = tiempoRestante;

        if (tiempoRestante <= 0) {
            clearInterval(timerTurno);
            alert(`¡Tiempo agotado para el Jugador ${jugadorActual + 1}! Pasa el turno.`);
            pasarTurno();
        }
    }, 1000);
}

// --- ACCIONES DE JUEGO (API GET: DADOS) ---

async function lanzarDados() {
    if (tirosRestantes <= 0) return;

    const btnLanzar = document.getElementById("btn-lanzar");
    btnLanzar.disabled = true;
    btnLanzar.textContent = "Lanzando...";

    const dadosATirar = dados.filter(d => !d.retenido).length;

    if (dadosATirar > 0) {
        try {
            // Petición GET a la API de dados
            const response = await fetch(`${API_DADOS_URL}?roll=${dadosATirar}d6`);
            if (!response.ok) throw new Error("Error en la respuesta de la API de dados");
            
            const data = await response.json();
            const resultadosAPI = data.results;

            let resultIndex = 0;
            dados.forEach(dado => {
                if (!dado.retenido) {
                    dado.valor = resultadosAPI[resultIndex];
                    resultIndex++;
                }
            });
        } catch (error) {
            console.warn("Fallo la API de dados, recurriendo a cálculo local:", error);
            // Fallback en caso de error de red
            dados.forEach(dado => {
                if (!dado.retenido) {
                    dado.valor = Math.floor(Math.random() * 6) + 1;
                }
            });
        }
    }

    tirosRestantes--;
    btnLanzar.textContent = "Lanzar Dados";
    actualizarInterfaz();
}

function alternarRetencionDado(index) {
    if (tirosRestantes < 3) {
        dados[index].retenido = !dados[index].retenido;
        const slot = document.querySelectorAll(".dado-slot")[index];
        slot.classList.toggle("retenido", dados[index].retenido);
    }
}

// --- EVALUACIÓN DE REGLAS ---

function evaluarJugadas(valoresDados) {
    const conteo = {};
    valoresDados.forEach(val => conteo[val] = (conteo[val] || 0) + 1);
    const frecuencias = Object.values(conteo);

    const esGenerala = frecuencias.includes(5);
    const esPoker = frecuencias.includes(4);

    const ordenados = [...new Set(valoresDados)].sort((a, b) => a - b);
    const strValores = ordenados.join('');
    const esEscalera = (ordenados.length === 5) && 
        (strValores === "12345" || strValores === "23456" || strValores === "13456");

    return {
        escalera: esEscalera ? 20 : 0,
        poker: esPoker ? 40 : 0,
        generala: esGenerala ? 50 : 0
    };
}

function anotarPuntaje(jugador, categoria) {
    if (jugador !== jugadorActual) return;

    const valoresActuales = dados.map(d => d.valor);
    const resultados = evaluarJugadas(valoresActuales);

    puntuaciones[jugador][categoria] = resultados[categoria];

    pasarTurno();
}

function pasarTurno() {
    tirosRestantes = 3;
    resetearDados();

    if (jugadorActual === 0) {
        jugadorActual = 1;
    } else {
        jugadorActual = 0;
        rondaActual++;
    }

    if (rondaActual > TOTAL_RONDAS) {
        finalizarJuego();
    } else {
        reiniciarTimer();
        actualizarInterfaz();
    }
}

// --- INTERFAZ Y RENDERIZADO ---

function actualizarInterfaz() {
    document.getElementById("jugador-actual").textContent = `Jugador ${jugadorActual + 1}`;
    document.getElementById("ronda-actual").textContent = rondaActual;
    document.getElementById("tiros-restantes").textContent = tirosRestantes;

    const slotsDados = document.querySelectorAll(".dado-slot");
    dados.forEach((dado, index) => {
        const img = slotsDados[index].querySelector("img");
        img.src = `img/dado-${dado.valor}.png`;
        img.alt = `Dado ${dado.valor}`;
    });

    document.getElementById("btn-lanzar").disabled = (tirosRestantes === 0);

    const valoresActuales = dados.map(d => d.valor);
    const jugadasPosibles = evaluarJugadas(valoresActuales);

    let totalJ1 = 0;
    let totalJ2 = 0;

    [0, 1].forEach(j => {
        ["escalera", "poker", "generala"].forEach(cat => {
            const btn = document.querySelector(`.btn-anotar[data-jugador="${j}"][data-cat="${cat}"]`);
            const valGuardado = puntuaciones[j][cat];

            if (valGuardado !== null) {
                btn.textContent = valGuardado;
                btn.disabled = true;
                if (j === 0) totalJ1 += valGuardado;
                if (j === 1) totalJ2 += valGuardado;
            } else {
                if (j === jugadorActual && tirosRestantes < 3) {
                    btn.textContent = `+${jugadasPosibles[cat]}`;
                    btn.disabled = false;
                } else {
                    btn.textContent = "-";
                    btn.disabled = true;
                }
            }
        });
    });

    document.getElementById("total-j1").textContent = totalJ1;
    document.getElementById("total-j2").textContent = totalJ2;
}

// --- FINALIZACIÓN Y GESTIÓN DE RÉCORDS (APIs GET / POST) ---

function finalizarJuego() {
    clearInterval(timerTurno);

    const totalJ1 = Object.values(puntuaciones[0]).reduce((a, b) => (a || 0) + (b || 0), 0);
    const totalJ2 = Object.values(puntuaciones[1]).reduce((a, b) => (a || 0) + (b || 0), 0);

    let mensaje = "";
    let ganadorPuntaje = 0;
    let ganadorNombre = "";

    if (totalJ1 > totalJ2) {
        mensaje = `¡Gana el Jugador 1 con ${totalJ1} puntos!`;
        ganadorPuntaje = totalJ1;
        ganadorNombre = "Jugador 1";
    } else if (totalJ2 > totalJ1) {
        mensaje = `¡Gana el Jugador 2 con ${totalJ2} puntos!`;
        ganadorPuntaje = totalJ2;
        ganadorNombre = "Jugador 2";
    } else {
        mensaje = `¡Empate en ${totalJ1} puntos!`;
        ganadorPuntaje = totalJ1;
        ganadorNombre = "Empate";
    }

    alert(`Fin de la partida. ${mensaje}`);
    
    // Guardar récord enviándolo por POST a la API
    guardarRecordAPI(ganadorNombre, ganadorPuntaje);
}

// --- API POST: ENVIAR RÉCORD AL SERVIDOR ---
async function guardarRecordAPI(ganador, puntaje) {
    const nuevoRecord = {
        juego: "Generala Simpsons",
        ganador: ganador,
        puntaje: puntaje,
        fecha: new Date().toLocaleDateString()
    };

    try {
        const response = await fetch(API_RECORDS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(nuevoRecord)
        });

        if (!response.ok) throw new Error("Error al guardar en el servidor");

        const data = await response.json();
        console.log("Récord guardado exitosamente en la API:", data);
        alert("¡Puntaje guardado con éxito en el servidor remoto!");
    } catch (error) {
        console.warn("No se pudo conectar con la API de récords, guardando en localStorage local:", error);
        
        // Guardado de respaldo local
        let records = JSON.parse(localStorage.getItem("tp1_records")) || [];
        records.push(nuevoRecord);
        localStorage.setItem("tp1_records", JSON.stringify(records));
    }
}

// --- API GET: OBTENER HISTORIAL DE RÉCORDS ---
async function cargarRecordsAPI() {
    try {
        const response = await fetch(API_RECORDS_URL);
        if (!response.ok) throw new Error("Error al obtener los récords");

        const records = await response.json();
        console.log("Récords obtenidos desde la API:", records);
        
        // Acá podrías llamar a una función para renderizar la tabla de récords en el HTML
    } catch (error) {
        console.warn("Fallo la carga de récords desde la API:", error);
    }
}