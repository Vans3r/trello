import './style.css';
import { TrelloBoard } from './components/board.js'; // Предполагаем, что класс TrelloBoard находится в отдельном файле



document.addEventListener('DOMContentLoaded', () => {
  window.app = new TrelloBoard();
});
