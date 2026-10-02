export type VersionHistoryChange = {
  pt: string;
  en: string;
  es: string;
};

export type VersionHistoryEntry = {
  version: string;
  revision?: number;
  changes: VersionHistoryChange[];
};

export const VERSION_HISTORY: VersionHistoryEntry[] = [
  {
    version: "1.38.2",
    revision: 3,
    changes: [
      {
        pt: "Corrigido o build da tela de resumo após a mudança da projeção do mês.",
        en: "Fixed the summary screen build after moving the month projection.",
        es: "Se corrigió el build de la pantalla de resumen después de mover la proyección del mes.",
      },
    ],
  },

  {
    version: "1.38.2",
    revision: 2,
    changes: [
      {
        pt: "A projeção do mês agora ocupa o card de saldo do mês e fica separada do saldo disponível.",
        en: "The month projection now occupies the month balance card and is separated from the available balance.",
        es: "La proyección del mes ahora ocupa la tarjeta de saldo del mes y queda separada del saldo disponible.",
      },
    ],
  },

  {
    version: "1.38.2",
        changes: [
      {
        pt: "Correções e melhorias para uma experiência mais estável.",
        en: "Fixes and improvements for a more stable experience.",
        es: "Correcciones y mejoras para una experiencia más estable.",
      },
    ],
  },

  {
    version: "1.38.1",
    revision: 3,
    changes: [
      {
        pt: "Ajuste de build e dependências preservado sem alterar o funcionamento da aplicação.",
        en: "Build and dependency adjustment preserved without changing application behavior.",
        es: "Ajuste de build y dependencias preservado sin cambiar el funcionamiento de la aplicación.",
      },
    ],
  },

  {
    version: "1.38.1",
        changes: [
      {
        pt: "Correções e melhorias para uma experiência mais estável.",
        en: "Fixes and improvements for a more stable experience.",
        es: "Correcciones y mejoras para una experiencia más estable.",
      },
    ],
  },

  {
    version: "1.38.0",
    revision: 1,
    changes: [
      {
        pt: "Novos recursos e melhorias para facilitar o uso do FinMonth.",
        en: "New features and improvements to make FinMonth easier to use.",
        es: "Nuevas funciones y mejoras para facilitar el uso de FinMonth.",
      },
    ],
  },

  {
    version: "1.37.27",
    revision: 0,
    changes: [
      {
        pt: "Animação suave ao quitar contas pendentes e melhorias na FinAI.",
        en: "Smooth animation when paying pending bills and FinAI enhancements.",
        es: "Animación suave al pagar facturas pendientes y mejoras en FinAI.",
      },
    ],
  },

  {
    version: "1.37.26",
    changes: [
      {
        pt: "Correções e melhorias para uma experiência mais estável.",
        en: "Fixes and improvements for a more stable experience.",
        es: "Correcciones y mejoras para una experiencia más estable.",
      },
    ],
  },

  {
    version: "1.37.25",
    changes: [
      {
        pt: "Correções e melhorias para uma experiência mais estável.",
        en: "Fixes and improvements for a more stable experience.",
        es: "Correcciones y mejoras para una experiencia más estable.",
      },
    ],
  },

  {
    version: "1.37.24",
    changes: [
      {
        pt: "Correções e melhorias para uma experiência mais estável.",
        en: "Fixes and improvements for a more stable experience.",
        es: "Correcciones y mejoras para una experiencia más estable.",
      },
    ],
  },

  {
    version: "1.37.22",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.19",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.16",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.15",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.11",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.10",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.8",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.6",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.4",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.3",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.37.2",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },

  {
    version: "1.34.0",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },
  {
    version: "1.33.0",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },
  {
    version: "1.32.0",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },
  {
    version: "1.31.0",
    changes: [
      {
        pt: "Atualizações e melhorias para esta versão.",
        en: "Updates and improvements for this version.",
        es: "Actualizaciones y mejoras para esta versión.",
      },
    ],
  },
  {
    version: "1.30.0",
    changes: [
      {
        pt: "Foi criado um histórico de versões amigável para acompanhar a evolução do FinMonth.",
        en: "A friendly version history was added to follow FinMonth's evolution.",
        es: "Se añadió un historial de versiones amigable para seguir la evolución de FinMonth.",
      },
    ],
  },
  {
    version: "1.29.0",
    changes: [
      {
        pt: "Atualizações e melhorias de estabilidade.",
        en: "Updates and stability improvements.",
        es: "Actualizaciones y mejoras de estabilidad.",
      },
    ],
  },
  {
    version: "1.28.0",
    changes: [
      {
        pt: "Atualizações e melhorias de estabilidade.",
        en: "Updates and stability improvements.",
        es: "Actualizaciones y mejoras de estabilidad.",
      },
    ],
  },
  {
    version: "1.27.1",
    changes: [
      {
        pt: "Navegação entre meses com gesto de arrastar mais natural no celular.",
        en: "More natural month navigation with swipe gestures on mobile.",
        es: "Navegación entre meses más natural con gestos de deslizamiento en el móvil.",
      },
    ],
  },
  {
    version: "1.27.0",
    changes: [
      {
        pt: "O gesto de arrastar entre meses passou a acompanhar o movimento do dedo.",
        en: "Month swiping now follows the finger movement.",
        es: "El deslizamiento entre meses ahora sigue el movimiento del dedo.",
      },
    ],
  },
  {
    version: "1.26.10",
    changes: [
      {
        pt: "A seção de contas pendentes ficou mais clara em todos os idiomas.",
        en: "The pending bills section is clearer in all languages.",
        es: "La sección de cuentas pendientes es más clara en todos los idiomas.",
      },
    ],
  },
  {
    version: "1.26.5",
    changes: [
      {
        pt: "Foram adicionados testes automáticos para cálculos financeiros e datas.",
        en: "Automated tests were added for financial calculations and dates.",
        es: "Se añadieron pruebas automáticas para cálculos financieros y fechas.",
      },
    ],
  },
  {
    version: "1.26.4",
    changes: [
      {
        pt: "Validação de valores monetários ficou mais segura ao cadastrar lançamentos.",
        en: "Monetary value validation is safer when adding entries.",
        es: "La validación de importes es más segura al registrar movimientos.",
      },
    ],
  },
  {
    version: "1.26.3",
    changes: [
      {
        pt: "Contas recorrentes do dia 31 se ajustam corretamente em meses mais curtos.",
        en: "Recurring bills on day 31 now adjust correctly in shorter months.",
        es: "Las cuentas recurrentes del día 31 se ajustan correctamente en meses más cortos.",
      },
    ],
  },
  {
    version: "1.26.2",
    changes: [
      {
        pt: "Os cartões de saldo passaram a explicar melhor o saldo disponível e a projeção do mês.",
        en: "Balance cards now explain available balance and month projection more clearly.",
        es: "Las tarjetas de saldo explican mejor el saldo disponible y la proyección del mes.",
      },
    ],
  },
  {
    version: "1.25.5",
    changes: [
      {
        pt: "Os dados financeiros passaram a ter migração de esquema para evoluções futuras.",
        en: "Financial data now has schema migration support for future updates.",
        es: "Los datos financieros ahora cuentan con migración de esquema para futuras actualizaciones.",
      },
    ],
  },
  {
    version: "1.25.4",
    changes: [
      {
        pt: "Os dados financeiros salvos passaram a ser validados antes de serem carregados.",
        en: "Saved financial data is now validated before being loaded.",
        es: "Los datos financieros guardados se validan antes de cargarse.",
      },
    ],
  },
  {
    version: "1.25.3",
    changes: [
      {
        pt: "Desconectar a nuvem não apaga mais os dados locais; a limpeza local fica reservada à exclusão da conta.",
        en: "Disconnecting the cloud no longer deletes local data; local cleanup is reserved for account deletion.",
        es: "Desconectar la nube ya no elimina los datos locales; la limpieza local queda reservada para eliminar la cuenta.",
      },
    ],
  },
  {
    version: "1.24.3",
    changes: [
      {
        pt: "Contas da tela inicial passaram a abrir detalhes, com edição e exclusão confirmada.",
        en: "Bills on the home screen now open details, with editing and confirmed deletion.",
        es: "Las cuentas de la pantalla principal ahora muestran detalles, con edición y eliminación confirmada.",
      },
    ],
  },
  {
    version: "1.23.0",
    changes: [
      {
        pt: "A experiência de conta e configurações foi ampliada para facilitar o gerenciamento do perfil.",
        en: "Account and settings experience was expanded for easier profile management.",
        es: "La experiencia de cuenta y configuración se amplió para facilitar la gestión del perfil.",
      },
    ],
  },
  {
    version: "1.20.0",
    changes: [
      {
        pt: "A experiência financeira ganhou novos recursos de acompanhamento e análise.",
        en: "The financial experience gained new tracking and analysis features.",
        es: "La experiencia financiera incorporó nuevas funciones de seguimiento y análisis.",
      },
    ],
  },
  {
    version: "1.18.0",
    changes: [
      {
        pt: "O histórico financeiro evoluiu com comparações e visualizações mais completas.",
        en: "Financial history evolved with richer comparisons and visualizations.",
        es: "El historial financiero evolucionó con comparaciones y visualizaciones más completas.",
      },
    ],
  },
  {
    version: "1.17.0",
    changes: [
      {
        pt: "A autenticação ganhou melhorias e confirmação de e-mail.",
        en: "Authentication gained improvements and email confirmation.",
        es: "La autenticación incorporó mejoras y confirmación de correo.",
      },
    ],
  },
  {
    version: "1.16.0",
    changes: [
      {
        pt: "O aplicativo passou a oferecer uma experiência de uso mais completa para dados financeiros.",
        en: "The app gained a more complete experience for managing financial data.",
        es: "La aplicación incorporó una experiencia más completa para gestionar datos financieros.",
      },
    ],
  },
  {
    version: "1.14.0",
    changes: [
      {
        pt: "O histórico financeiro ganhou novos recursos de acompanhamento.",
        en: "Financial history gained new tracking capabilities.",
        es: "El historial financiero incorporó nuevas funciones de seguimiento.",
      },
    ],
  },
  {
    version: "1.13.0",
    changes: [
      {
        pt: "A análise da evolução financeira recebeu novos aprimoramentos.",
        en: "Financial evolution analysis received further improvements.",
        es: "El análisis de la evolución financiera recibió nuevas mejoras.",
      },
    ],
  },
  {
    version: "1.12.0",
    changes: [
      {
        pt: "O histórico financeiro foi ampliado para acompanhar melhor a evolução mês a mês.",
        en: "Financial history was expanded to better track month-to-month evolution.",
        es: "El historial financiero se amplió para seguir mejor la evolución mes a mes.",
      },
    ],
  },
  {
    version: "1.11.2",
    changes: [
      {
        pt: "Os gráficos receberam refinamentos para facilitar a leitura.",
        en: "Charts received refinements to make them easier to read.",
        es: "Los gráficos recibieron mejoras para facilitar su lectura.",
      },
    ],
  },
  {
    version: "1.10.0",
    changes: [
      {
        pt: "A experiência de histórico e análise financeira continuou sendo ampliada.",
        en: "The financial history and analysis experience continued to expand.",
        es: "La experiencia de historial y análisis financiero siguió ampliándose.",
      },
    ],
  },
  {
    version: "1.9.0",
    changes: [
      {
        pt: "O acompanhamento financeiro recebeu novos recursos de análise.",
        en: "Financial tracking gained new analysis features.",
        es: "El seguimiento financiero incorporó nuevas funciones de análisis.",
      },
    ],
  },
  {
    version: "1.8.0",
    changes: [
      {
        pt: "O aplicativo ganhou novos aprimoramentos de experiência e organização financeira.",
        en: "The app gained new experience and financial organization improvements.",
        es: "La aplicación incorporó mejoras de experiencia y organización financiera.",
      },
    ],
  },
  {
    version: "1.6.0",
    changes: [
      {
        pt: "Passou a ser possível escolher a moeda de exibição dos valores.",
        en: "You can now choose the currency used to display values.",
        es: "Ahora puedes elegir la moneda utilizada para mostrar los valores.",
      },
    ],
  },
  {
    version: "1.0.0",
    changes: [
      {
        pt: "Primeira versão do FinMonth para organizar receitas, contas e valores guardados por mês.",
        en: "First FinMonth version for organizing income, bills and saved amounts by month.",
        es: "Primera versión de FinMonth para organizar ingresos, cuentas y cantidades guardadas por mes.",
      },
    ],
  },
];

export function getVersionHistory(language: "pt-BR" | "en-US" | "es-ES") {
  return VERSION_HISTORY.map((entry) => ({
    ...entry,
    changes: entry.changes.map((change) => change[language === "pt-BR" ? "pt" : language === "en-US" ? "en" : "es"]),
  }));
}
