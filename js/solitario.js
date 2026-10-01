function renderCardInColumn(columnElement, card, isFaceUp, index) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    
    // Distancia vertical en cascada para que se vea el lomo o parte de la carta anterior
    const offset = index * 25; 
    cardDiv.style.setProperty('--card-offset', `${offset}px`);

    if (isFaceUp) {
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.value} of ${card.suit}">`;
        cardDiv.classList.add("face-up");
    } else {
        cardDiv.classList.add("face-down");
        cardDiv.innerHTML = `<div class="card-back"></div>`;
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