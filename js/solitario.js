const API_BASE = "https://deckofcardsapi.com/api/deck";
let deckId = null;
let score = 0;
let moves = 0;
let selectedCard = null;

document.addEventListener("DOMContentLoaded", () => {
    const btnReiniciar = document.getElementById("btn-reiniciar");
    if (btnReiniciar) {
        btnReiniciar.addEventListener("click", initGame);
    }
    initGame();
});

async function initGame() {
    try {
        score = 0;
        moves = 0;
        selectedCard = null;
        updateUI();
        
        const response = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        if (!response.ok) throw new Error("No se pudo conectar con el servidor de cartas.");
        
        const data = await response.json();
        deckId = data.deck_id;

        const tableauColumns = document.querySelectorAll(".tableau-pile");
        
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
    } catch (error) {
        console.error("Error al inicializar el solitario con la API:", error);
        alert("Hubo un error al conectar con la API de cartas.");
    }
}

function getNumericValue(val) {
    if (val === 'ACE') return 1;
    if (val === 'JACK') return 11;
    if (val === 'QUEEN') return 12;
    if (val === 'KING') return 13;
    return parseInt(val);
}

function renderCardInColumn(columnElement, card, isFaceUp, index) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.style.setProperty('--card-offset', `${index * 22}px`); // Espaciado en cascada compacto

    if (isFaceUp) {
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}">`;
        cardDiv.classList.add("face-up");
    } else {
        cardDiv.classList.add("face-down");
        cardDiv.innerHTML = `<div class="card-back">🂠</div>`;
    }

    cardDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!isFaceUp) return;

        if (!selectedCard) {
            selectedCard = { card, element: cardDiv };
            cardDiv.classList.add("selected");
        } else {
            if (selectedCard.element === cardDiv) {
                cardDiv.classList.remove("selected");
                selectedCard = null;
            } else {
                if (card.color !== selectedCard.card.color && card.numericValue === selectedCard.card.numericValue + 1) {
                    moves++;
                    score += 10;
                    columnElement.appendChild(selectedCard.element);
                    selectedCard.element.classList.remove("selected");
                    selectedCard = null;
                    updateUI();
                } else {
                    selectedCard.element.classList.remove("selected");
                    selectedCard = { card, element: cardDiv };
                    cardDiv.classList.add("selected");
                }
            }
        }
    });

    columnElement.appendChild(cardDiv);
}

function updateUI() {
    const scoreElement = document.getElementById("score");
    const movesElement = document.getElementById("moves");
    
    if (scoreElement) scoreElement.textContent = score;
    if (movesElement) movesElement.textContent = moves;
}