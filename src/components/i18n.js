// src/i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  en: {
    translation: {
      // App
      appName: "Inventory Manager",
      loading: "Loading...",

      // Navigation
      home: "Home",
      inventories: "Inventories",
      myInventories: "My Inventories",
      createInventory: "Create Inventory",
      profile: "My Profile",
      settings: "Settings",
      adminPanel: "Admin Panel",

      // Auth
      login: "Login",
      logout: "Logout",
      loginRequired: "Please login to access this feature",

      // Theme & Language
      darkTheme: "Dark Theme",
      language: "Language",

      // Search
      search: "Search inventories and items...",
      searchError: "Search failed. Please try again.",
      searchMinChars: "Please enter at least 2 characters to search",

      // Main Page
      latestInventories: "Latest Inventories",
      popularInventories: "Most Popular Inventories",
      popularTags: "Popular Tags",
      noPublicInventories: "No public inventories yet.",
      noInventories: "No public yet. Create one",
      noPopularInventories: "No popular inventories yet.",
      noTags: "No tags yet.",
      items: "items",

      deleteSelected: "Delete selected",
      deleteDesc: "Delete all selected inventories? This cannot be undone",
      deleteText: "Delete",
      cancelText: "Cancel",

      // Errors
      loadMainDataError: "Failed to load main page data",
      networkError: "Network error occurred",
      authError: "Authentication failed",
      generalError: "An error occurred",

      // Success messages
      loginSuccess: "Login successful",
      logoutSuccess: "Logout successful",
    },
  },
  ru: {
    translation: {
      // App
      appName: "Менеджер Инвентаря",
      loading: "Загрузка...",

      // Navigation
      home: "Главная",
      inventories: "Инвентари",
      myInventories: "Мои Инвентари",
      createInventory: "Создать Инвентарь",
      profile: "Мой Профиль",
      settings: "Настройки",
      adminPanel: "Панель Администратора",

      // Auth
      login: "Войти",
      logout: "Выйти",
      loginRequired: "Войдите в систему для доступа к этой функции",

      // Theme & Language
      darkTheme: "Темная Тема",
      language: "Язык",

      // Search
      search: "Поиск инвентаря и предметов...",
      searchError: "Поиск не удался. Попробуйте еще раз.",
      searchMinChars: "Введите не менее 2 символов для поиска",

      // Main Page
      latestInventories: "Последние Инвентари",
      popularInventories: "Самые Популярные Инвентари",
      popularTags: "Популярные Теги",
      noPublicInventories: "Пока нет публичных инвентарей.",
      noInventories: "Пока нет инвентарей. Попробуйте создать",
      noPopularInventories: "Пока нет популярных инвентарей.",
      noTags: "Пока нет тегов.",
      items: "предметов",

      deleteSelected: "Удалить выбранные",
      deleteDesc:
        "Удалить все выбранные обьекты? Данное действие не может быть отменено",
      deleteText: "Удалить",
      cancelText: "Отмена",

      // Errors
      loadMainDataError: "Не удалось загрузить данные главной страницы",
      networkError: "Произошла сетевая ошибка",
      authError: "Ошибка аутентификации",
      generalError: "Произошла ошибка",

      // Success messages
      loginSuccess: "Вход выполнен успешно",
      logoutSuccess: "Выход выполнен успешно",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
