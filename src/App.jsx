import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spin, ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { useTranslation } from "react-i18next";

import "./components/i18n";

import { store } from "./store";

const MainLayout = React.lazy(() => import("./layouts/MainLayout"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const MainPage = React.lazy(() => import("./pages/MainPage"));
const InventoryPage = React.lazy(() => import("./pages/InventoryPage"));

const SelectedInventroyPage = React.lazy(
  () => import("./pages/SelectedInventroyPage"),
);
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const RegistrationCompletePage = React.lazy(
  () => import("./pages/RegistrationCompletePage"),
);
const SearchResultsPage = React.lazy(() => import("./pages/SearchResultsPage"));
const TagResultsPage = React.lazy(() => import("./pages/TagResultsPage"));

const LoadingSpinner = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "16px",
      }}
    >
      <Spin size="large" />
      <span style={{ color: "#666", fontSize: "14px" }}>
        {t ? t("loading") : "Loading..."}
      </span>
    </div>
  );
};

const getAntdLocale = async (language) => {
  switch (language) {
    case "ru":
      const ruLocale = await import("antd/locale/ru_RU");
      return ruLocale.default;
    case "en":
    default:
      const enLocale = await import("antd/locale/en_US");
      return enLocale.default;
  }
};

function AppContent() {
  const { i18n } = useTranslation();
  const [antdLocale, setAntdLocale] = React.useState(null);

  React.useEffect(() => {
    getAntdLocale(i18n.language).then((locale) => {
      setAntdLocale(locale);
    });

    const handleLanguageChange = (lng) => {
      getAntdLocale(lng).then((locale) => {
        setAntdLocale(locale);
      });
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  if (!antdLocale) {
    return <LoadingSpinner />;
  }

  return (
    <ConfigProvider locale={antdLocale}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route
              path="/register-complete"
              element={<RegistrationCompletePage />}
            />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<MainPage />} />
              <Route path="inventories" element={<InventoryPage />} />
              <Route
                path="inventories/create"
                element={<SelectedInventroyPage createMode />}
              />
              <Route
                path="inventories/:id"
                element={<SelectedInventroyPage />}
              />
              <Route path="search" element={<SearchResultsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="tag/:tagName" element={<TagResultsPage />} />
              <Route path="profile" element={<MainPage />} />
              <Route path="users/:id" element={<MainPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Suspense fallback={<LoadingSpinner />}>
        <AppContent />
      </Suspense>
    </Provider>
  );
}

export default App;
