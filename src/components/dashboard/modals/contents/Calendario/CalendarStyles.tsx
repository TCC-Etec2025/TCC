export const CalendarStyles = () => (
  <style>
    {`
      .react-calendar-custom {
        width: 100%;
        border-radius: 20% !important;
        background: transparent;
        font-family: inherit;
      }

      /* Remove todas as bordas internas padrão */
      .react-calendar-custom .react-calendar {
        border: none !important;
      }

      .react-calendar-custom .react-calendar__viewContainer {
        border: none !important;
      }

      .react-calendar-custom .react-calendar__month-view {
        border: none !important;
      }

      .react-calendar-custom .react-calendar__tile {
        padding: 0.75em 0.5em;
        font-size: 0.9em;
      }

      .react-calendar-custom .react-calendar__tile:hover {
        background-color: #d8a4aa !important;
        border-radius: 20% !important;
        color: #ffffff !important;
      }

      .react-calendar-custom .react-calendar__tile--active {
        background-color: transparent;
        color: inherit;
      }

      /* Estilo para o dia atual */
      .react-calendar-custom .react-calendar__tile--now {
        background-color: #8b324b !important;
        color: white !important;
        border-radius: 20% !important;
      }

      /* Estilo para a classe customizada do dia atual */
      .react-calendar-custom .react-calendar__tile.today-custom {
        background-color: #8b324b !important;
        color: white !important;
        border-radius: 20% !important;
      }

      /* CORREÇÃO: Estilo para dia selecionado (mesma cor do Atividades) */
      .react-calendar-custom .react-calendar__tile:not(.today-custom)[aria-pressed="true"] {
        background-color: #f5e1e4 !important;
        color: #8b324b !important;
        border-radius: 20% !important;
      }

      .react-calendar-custom .react-calendar__navigation button:hover {
        background-color: #d8a4aa;
        border-radius: 8px;
      }

      .react-calendar-custom .react-calendar__month-view__weekdays {
        text-align: center;
        text-transform: uppercase;
        font-weight: 600;
        font-size: 0.75em;
        color: #d8a4aa;
      }

      .react-calendar-custom .react-calendar__month-view__weekdays__weekday {
        padding: 0.5em;
      }

      .react-calendar-custom .react-calendar__month-view__weekdays__weekday abbr {
        text-decoration: none;
      }

      .react-calendar-custom .react-calendar__month-view__days__day--neighboringMonth {
        color: #d8a4aa;
      }

      /* Opcional: Remove qualquer sombra/box-shadow padrão */
      .react-calendar-custom .react-calendar__month-view__days,
      .react-calendar-custom .react-calendar__month-view__weekdays {
        box-shadow: none !important;
      }
    `}
  </style>
);