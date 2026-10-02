const API_BASE = "https://deckofcardsapi.com/api/deck";
let deckId = null;
let score = 0;
let moves = 0;
let timeElapsed = 0; // Para el Timer requerido por la cátedra
let timerInterval = null;

let selectedCard = null; // Guardará: { element, cardData, sourceColumn }
let remainingDeck = [];
let drawnCards = [];

document.addEventListener("DOMContentLoaded", () => {
    const btnReiniciar = document.getElementById("btn-reiniciar");
    if (btnReiniciar) btnReiniciar.addEventListener("click", initGame);
    
    const deckElement = document.getElementById("deck");
    if (deckElement) deckElement.addEventListener("click", drawCardFromDeck);

    // Agregar botón para terminar partida y guardar récord (opcional, pero útil)
    const btnGuardar = document.createElement("button");
    btnGuardar.textContent = "Terminar y Guardar";
    btnGuardar.id = "btn-guardar";
    btnGuardar.addEventListener("click", finishAndSaveRecord);
    document.querySelector(".stats-bar").appendChild(btnGuardar);

    // Actualizar el HTML de la barra de estado para incluir el Timer
    const statsBar = document.querySelector(".stats-bar");
    const timerSpan = document.createElement("span");
    timerSpan.innerHTML = `Tiempo: <span id="timer">00:00</span>`;
    statsBar.insertBefore(timerSpan, btnReiniciar);

    initGame();
});

// --- LÓGICA PRINCIPAL DEL JUEGO ---

async function initGame() {
    try {
        // Reiniciar variables
        score = 0;
        moves = 0;
        timeElapsed = 0;
        selectedCard = null;
        remainingDeck = [];
        drawnCards = [];
        
        // Reiniciar Timer
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        
        updateUI();
        
        // Conectar a la API
        const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        if (!response.ok) throw new Error("Error en API.");
        const data = await response.json();
        deckId = data.deck_id;

        const tableauColumns = document.querySelectorAll(".tableau-pile");

        const foundations = document.querySelectorAll(".foundation");
     foundations.forEach(foundation => {
     // Buscamos todas las cartas que hayan quedado en la fundación de la partida anterior
     const cardsInFoundation = foundation.querySelectorAll('.card');
     // Las eliminamos una por una para no borrar el símbolo del palo que está en el fondo
     cardsInFoundation.forEach(card => card.remove());
     });
        
        // 1. Repartir Tableau
        for (let i = 0; i < tableauColumns.length; i++) {
            tableauColumns[i].innerHTML = ""; 
            const count = i + 1;
            const drawRes = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
            const drawData = await drawRes.json();
            
            drawData.cards.forEach((card, index) => {
                card.color = (card.suit === 'DIAMONDS' || card.suit === 'HEARTS') ? 'red' : 'black';
                card.numericValue = getNumericValue(card.value);
                renderCardInColumn(tableauColumns[i], card, index === count - 1, index);
            });
        }

        // 2. Mazo Superior
        const restRes = await fetch(`${API_BASE}/${deckId}/draw/?count=24`);
        const restData = await restRes.json();
        
        remainingDeck = restData.cards.map(card => {
            card.color = (card.suit === 'DIAMONDS' || card.suit === 'HEARTS') ? 'red' : 'black';
            card.numericValue = getNumericValue(card.value);
            return card;
        });
        
        document.getElementById("draw-pile").innerHTML = "Robadas";
        updateDeckUI();

        // 3. Preparar Columnas Vacías (Para mover Reyes)
        tableauColumns.forEach(col => {
            col.addEventListener("click", () => handleEmptyColumnClick(col));
        });

    } catch (error) {
        console.error("Error API:", error);
    }
}

// --- UTILIDADES ---

function getNumericValue(val) {
    if (val === 'ACE') return 1;
    if (val === 'JACK') return 11;
    if (val === 'QUEEN') return 12;
    if (val === 'KING') return 13;
    return parseInt(val);
}

function updateUI() {
    const scoreElement = document.getElementById("score");
    const movesElement = document.getElementById("moves");
    if (scoreElement) scoreElement.textContent = score;
    if (movesElement) movesElement.textContent = moves;
}

function updateTimer() {
    timeElapsed++;
    const timerElement = document.getElementById("timer");
    if (timerElement) {
        const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
        const seconds = (timeElapsed % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }
}

// Requisito Cátedra: Guardar récord en LocalStorage
function finishAndSaveRecord() {
    clearInterval(timerInterval);
    const date = new Date().toLocaleDateString();
    const record = {
        juego: "Solitario",
        puntaje: score,
        movimientos: moves,
        tiempo: timeElapsed,
        fecha: date
    };
    
    let records = JSON.parse(localStorage.getItem("tp1_records")) || [];
    records.push(record);
    localStorage.setItem("tp1_records", JSON.stringify(records));
    
    alert(`¡Partida guardada! Puntuación: ${score} - Movimientos: ${moves}`);
}

// --- LÓGICA DE CARTAS ---

function revealLastCardInColumn(columnElement) {
    const cards = Array.from(columnElement.querySelectorAll('.card'));
    if (cards.length > 0) {
        const lastCard = cards[cards.length - 1];
        if (lastCard.classList.contains('face-down')) {
            lastCard.classList.remove('face-down');
            lastCard.classList.add('face-up');
            
            const imgUrl = lastCard.dataset.img;
            lastCard.innerHTML = `<img src="${imgUrl}" alt="Card">`;
            score += 5; // Premio por destapar
            updateUI();
        }
    }
}

function renderCardInColumn(columnElement, card, isFaceUp, index) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.style.setProperty('--card-offset', `${index * 15}px`);
    cardDiv.dataset.img = card.image;
    cardDiv.cardData = card; // Vincular datos directamente al elemento

    if (isFaceUp) {
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}">`;
        cardDiv.classList.add("face-up");
    } else {
        cardDiv.classList.add("face-down");
        cardDiv.innerHTML = `<div class="card-back"></div>`;
    }

    cardDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        
        if (!isFaceUp && selectedCard) return;
        if (!isFaceUp && !selectedCard) return;

        if (!selectedCard) {
            // Seleccionar
            selectedCard = { element: cardDiv, cardData: card, sourceColumn: columnElement };
            cardDiv.classList.add("selected");
        } else {
            // Deseleccionar o Mover
            if (selectedCard.element === cardDiv) {
                cardDiv.classList.remove("selected");
                selectedCard = null;
            } else {
                const targetCardData = cardDiv.cardData;
                
                // Regla Solitario: Color alterno y un valor menor
                if (selectedCard.cardData.color !== targetCardData.color && 
                    selectedCard.cardData.numericValue === targetCardData.numericValue - 1) {
                    
                    moves++;
                    score += 10;
                    
                    const newIndex = columnElement.querySelectorAll('.card').length;
                    selectedCard.element.style.setProperty('--card-offset', `${newIndex * 15}px`);
                    
                    columnElement.appendChild(selectedCard.element);
                    selectedCard.element.classList.remove("selected");
                    
                    revealLastCardInColumn(selectedCard.sourceColumn);
                    
                    selectedCard = null;
                    updateUI();
                } else {
                    // Selección incorrecta, cambiamos el foco
                    selectedCard.element.classList.remove("selected");
                    selectedCard = { element: cardDiv, cardData: card, sourceColumn: columnElement };
                    cardDiv.classList.add("selected");
                }
            }
        }
    });

    columnElement.appendChild(cardDiv);
}

function handleEmptyColumnClick(col) {
    if (selectedCard) {
        const cardsInCol = col.querySelectorAll('.card');
        if (cardsInCol.length === 0) {
            // Solo los Reyes (13) van a columnas vacías
            if (selectedCard.cardData.numericValue === 13) {
                moves++;
                selectedCard.element.style.setProperty('--card-offset', `0px`);
                col.appendChild(selectedCard.element);
                
                selectedCard.element.classList.remove("selected");
                revealLastCardInColumn(selectedCard.sourceColumn);
                selectedCard = null;
                updateUI();
            }
        }
    }
}

// --- LÓGICA DEL MAZO ---

function drawCardFromDeck() {
    if (remainingDeck.length === 0) {
        document.getElementById("deck").innerHTML = "Vacío";
        return; // Más adelante puedes programar reciclar el mazo
    }

    const card = remainingDeck.pop();
    drawnCards.push(card);
    moves++;
    updateUI();
    updateDeckUI();

    const drawPile = document.getElementById("draw-pile");
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card", "face-up");
    cardDiv.style.position = "relative"; // Las robadas no usan cascada visual
    cardDiv.style.width = "70px";
    cardDiv.style.height = "100px";
    cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value}">`;
    cardDiv.cardData = card;

    cardDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedCard) {
            selectedCard = { element: cardDiv, cardData: card, sourceColumn: drawPile };
            cardDiv.classList.add("selected");
        } else if (selectedCard.element === cardDiv) {
            cardDiv.classList.remove("selected");
            selectedCard = null;
        }
    });

    drawPile.innerHTML = ""; 
    drawPile.appendChild(cardDiv);
}

function updateDeckUI() {
    const deckElement = document.getElementById("deck");
    if (remainingDeck.length > 0) {
        deckElement.innerHTML = `<div class="card-back" style="width:100%; height:100%;"></div>`;
    }
}

// Lógica para los 4 huecos finales (Fundaciones) arriba a la derecha
const foundations = document.querySelectorAll(".foundation");
foundations.forEach(foundation => {
    foundation.addEventListener("click", () => {
        if (selectedCard) {
            // Comparamos el palo del hueco con el de la carta
            const targetSuit = foundation.dataset.suit.toUpperCase();
            const cardSuit = selectedCard.cardData.suit.toUpperCase();
            const cardsInFoundation = foundation.querySelectorAll('.card');

            let isValidMove = false;

            if (cardsInFoundation.length === 0) {
                // Si el hueco está vacío, solo entra el As (1) de ese palo exacto
                if (selectedCard.cardData.numericValue === 1 && cardSuit === targetSuit) {
                    isValidMove = true;
                }
            } else {
                // Si ya tiene cartas, debe ser el mismo palo y el número siguiente (+1)
                const topCardElement = cardsInFoundation[cardsInFoundation.length - 1];
                const topCardData = topCardElement.cardData;

                if (cardSuit === targetSuit && selectedCard.cardData.numericValue === topCardData.numericValue + 1) {
                    isValidMove = true;
                }
            }

            if (isValidMove) {
                moves++;
                score += 50; // Bonus de puntos por subir una carta
                
                // Quitamos el efecto cascada para que queden apiladas perfectas
                selectedCard.element.style.setProperty('--card-offset', `0px`);

                foundation.appendChild(selectedCard.element);
                selectedCard.element.classList.remove("selected");
                
                // Si la carta venía de abajo, destapamos la que quedó oculta
                if (selectedCard.sourceColumn.classList.contains("tableau-pile")) {
                    revealLastCardInColumn(selectedCard.sourceColumn);
                }
                
                selectedCard = null;
                updateUI();
            }
        }
    });
});