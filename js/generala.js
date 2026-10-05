// --- ESTADO DEL JUEGO ---
const TOTAL_RONDAS = 3;
const TIEMPO_TURNO = 30; // Segundos por turno (Cumple el requisito de Timer de la cátedra)

let jugadorActual = 0; // 0 para Jugador 1, 1 para Jugador 2
let rondaActual = 1;
let tirosRestantes = 3;
let timerTurno = null;
let tiempoRestante = TIEMPO_TURNO;

// Representa el valor actual de los 5 dados y si están bloqueados/guardados
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

// --- ACCIONES DE JUEGO ---

function lanzarDados() {
    if (tirosRestantes <= 0) return;

    // Generar valores aleatorios para los dados no retenidos
    dados.forEach((dado, index) => {
        if (!dado.retenido) {
            dado.valor = Math.floor(Math.random() * 6) + 1;
        }
    });

    tirosRestantes--;
    actualizarInterfaz();
}

function alternarRetencionDado(index) {
    // Solo se pueden retener dados si ya se hizo al menos un tiro en el turno
    if (tirosRestantes < 3) {
        dados[index].retenido = !dados[index].retenido;
        const slot = document.querySelectorAll(".dado-slot")[index];
        slot.classList.toggle("retenido", dados[index].retenido);
    }
}

// --- EVALUACIÓN DE REGLAS (Escalera, Póker, Generala) ---

function evaluarJugadas(valoresDados) {
    // Contamos la frecuencia de cada cara (1 al 6)
    const conteo = {};
    valoresDados.forEach(val => conteo[val] = (conteo[val] || 0) + 1);
    const frecuencias = Object.values(conteo);

    const esGenerala = frecuencias.includes(5);
    const esPoker = frecuencias.includes(4);

    // Escalera: [1,2,3,4,5] o [2,3,4,5,6] o [1,3,4,5,6]
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

    // Guardar los puntos obtenidos
    puntuaciones[jugador][categoria] = resultados[categoria];

    pasarTurno();
}

function pasarTurno() {
    tirosRestantes = 3;
    resetearDados();

    // Rotar turnos
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

    // Actualizar imágenes PNG de los dados
    const slotsDados = document.querySelectorAll(".dado-slot");
    dados.forEach((dado, index) => {
        const img = slotsDados[index].querySelector("img");
        img.src = `img/dado-${dado.valor}.png`; // Asegúrate de tener dado-1.png hasta dado-6.png en img/
        img.alt = `Dado ${dado.valor}`;
    });

    // Habilitar/Deshabilitar botón de lanzar
    document.getElementById("btn-lanzar").disabled = (tirosRestantes === 0);

    // Actualizar tabla de posiciones y habilitar/deshabilitar botones de anotación
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

// --- FINALIZACIÓN Y GUARDADO DE RÉCORDS ---

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
    guardarRecord(ganadorNombre, ganadorPuntaje);
}

function guardarRecord(ganador, puntaje) {
    const record = {
        juego: "Generala Simpsons",
        ganador: ganador,
        puntaje: puntaje,
        fecha: new Date().toLocaleDateString()
    };

    let records = JSON.parse(localStorage.getItem("tp1_records")) || [];
    records.push(record);
    localStorage.setItem("tp1_records", JSON.stringify(records));
}