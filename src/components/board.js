export class TrelloBoard {
  constructor() {
    this.columns = this.loadState() || this.initDefaultState();
    this.render();
    this.setupEventDelegation(); 
    this.setupDragAndDrop();
  }

  initDefaultState() {
    return [
      { name: "To Do", cards: [] },
      { name: "In Progress", cards: [] },
      { name: "Done", cards: [] }
    ];
  }

  loadState() {
    const saved = localStorage.getItem('trelloState');
    return saved ? JSON.parse(saved) : null;
  }

  saveState() {
    localStorage.setItem('trelloState', JSON.stringify(this.columns));
  }

  render() {
    const board = document.querySelector('.board');
    board.innerHTML = '';

    this.columns.forEach((column, colIndex) => {
      const colEl = document.createElement('div');
      colEl.className = 'column';
      colEl.dataset.column = colIndex;

      colEl.innerHTML = `
        <h2>${column.name}</h2>
        <div class="cards">
          ${column.cards.map((card, cardIndex) => `
            <div class="card" draggable="true" data-card="${cardIndex}">
              ${card.text}
              <span class="delete-btn">×</span>
            </div>
          `).join('')}
        </div>
        <div class="add-card-container">
          <form class="add-card-form" style="display: none;">
            <textarea class="card-input" placeholder="Enter card text..." rows="3"></textarea>
            <div class="form-actions">
              <button type="submit" class="btn-submit">Add card</button>
              <button type="button" class="btn-cancel">Cancel</button>
            </div>
          </form>
          <button type="button" class="btn-add-card">+ Add another card</button>
        </div>
      `;

      board.appendChild(colEl);
    });
  }

  setupEventDelegation() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add-card')) {
        const container = e.target.closest('.add-card-container');
        this.showAddCardForm(container);
      }

      if (e.target.classList.contains('btn-cancel')) {
        const form = e.target.closest('.add-card-form');
        this.hideAddCardForm(form);
      }

      if (e.target.classList.contains('delete-btn')) {
        const card = e.target.closest('.card');
        const column = card.closest('.column');
        const colIndex = parseInt(column.dataset.column);
        const cardIndex = parseInt(card.dataset.card);
        this.deleteCard(colIndex, cardIndex);
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.classList.contains('add-card-form')) {
        e.preventDefault();
        const form = e.target;
        const container = form.closest('.add-card-container');
        const column = container.closest('.column');
        const colIndex = parseInt(column.dataset.column);
        const textarea = form.querySelector('.card-input');
        const text = textarea.value.trim();

        if (text) {
          this.columns[colIndex].cards.push({ text });
          this.saveState();
          this.render();
        } else {
          this.hideAddCardForm(form);
        }
      }
    });
  }

  showAddCardForm(container) {
    const form = container.querySelector('.add-card-form');
    const button = container.querySelector('.btn-add-card');

    form.style.display = 'block';
    button.style.display = 'none';
    form.querySelector('.card-input').focus();
  }

  hideAddCardForm(form) {
    const container = form.closest('.add-card-container');
    const button = container.querySelector('.btn-add-card');

    form.style.display = 'none';
    button.style.display = 'block';
    form.reset();
  }

  deleteCard(colIndex, cardIndex) {
    this.columns[colIndex].cards.splice(cardIndex, 1);
    this.saveState();
    this.render();
  }

setupDragAndDrop() {
  const cards = document.querySelectorAll('.card');
  const columns = document.querySelectorAll('.column');

  let draggedCard = null;
  let currentPlaceholder = null;
  let sourceColumnIndex = -1;
  let sourceCardIndex = -1;

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCard = card;
      sourceColumnIndex = parseInt(card.closest('.column').dataset.column);
      sourceCardIndex = parseInt(card.dataset.card);

      card.style.opacity = '0.5';
      card.style.cursor = 'grabbing';

      // Создаём placeholder
      currentPlaceholder = document.createElement('div');
      currentPlaceholder.className = 'placeholder';
      currentPlaceholder.style.height = `${card.offsetHeight}px`;
      currentPlaceholder.style.margin = '5px 0';
    });

    card.addEventListener('dragend', () => {
      if (currentPlaceholder && currentPlaceholder.parentNode) {
        currentPlaceholder.parentNode.removeChild(currentPlaceholder);
      }
      if (draggedCard) {
        draggedCard.style.opacity = '1';
        draggedCard.style.cursor = 'grab';
      }
      draggedCard = null;
      currentPlaceholder = null;
    });
  });

  columns.forEach(column => {
    const cardsContainer = column.querySelector('.cards');

    cardsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target;

      if (target.classList.contains('card') && target !== draggedCard) {
        const rect = target.getBoundingClientRect();
        const offset = e.clientY - rect.top;

        if (offset < rect.height / 2) {
          if (currentPlaceholder.parentNode !== target.parentNode ||
              currentPlaceholder.nextSibling !== target) {
            target.parentNode.insertBefore(currentPlaceholder, target);
          }
        } else {
          const nextSibling = target.nextSibling;
          if (nextSibling) {
            if (currentPlaceholder.parentNode !== target.parentNode ||
                currentPlaceholder.nextSibling !== nextSibling) {
              target.parentNode.insertBefore(currentPlaceholder, nextSibling);
            }
          } else {
            if (currentPlaceholder.parentNode !== cardsContainer) {
              cardsContainer.append(currentPlaceholder);
            }
          }
        }
      } else if (target === cardsContainer && !cardsContainer.querySelector('.card')) {
        cardsContainer.append(currentPlaceholder);
      }
    });

    cardsContainer.addEventListener('drop', (e) => {
      e.preventDefault();

      if (!draggedCard || !currentPlaceholder) return;

      const targetColumnIndex = parseInt(column.dataset.column);

      const allChildren = Array.from(cardsContainer.children);
      const placeholderIndex = allChildren.indexOf(currentPlaceholder);

      let targetCardIndex = 0;

      for (let i = 0; i < placeholderIndex; i++) {
        if (allChildren[i].classList.contains('card')) {
          targetCardIndex++;
        }
      }

      if (sourceColumnIndex === targetColumnIndex) {
        const movedCard = this.columns[sourceColumnIndex].cards.splice(sourceCardIndex, 1)[0];
        if (sourceCardIndex < targetCardIndex) {
          targetCardIndex--;
        }

        this.columns[targetColumnIndex].cards.splice(targetCardIndex, 0, movedCard);
      } else {
        const movedCard = this.columns[sourceColumnIndex].cards.splice(sourceCardIndex, 1)[0];
        this.columns[targetColumnIndex].cards.splice(targetCardIndex, 0, movedCard);
      }

      if (currentPlaceholder.parentNode) {
        currentPlaceholder.parentNode.removeChild(currentPlaceholder);
      }

      this.saveState();
      this.render();
      this.setupDragAndDrop(); 
    });
  });
}
}