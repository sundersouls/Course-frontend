import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Spin } from "antd";

const MainLayout = React.lazy(() => import("./layouts/MainLayout"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const MainPage = React.lazy(() => import("./pages/MainPage"));
const InventoryPage = React.lazy(() => import("./pages/InventoryPage"));
const CreateInventoryPage = React.lazy(
  () => import("./pages/CreateInventoryPage"),
);
const SelectedInventroyPage = React.lazy(
  () => import("./pages/SelectedInventroyPage"),
);
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const RegistrationCompletePage = React.lazy(
  () => import("./pages/RegistrationCompletePage"),
);
const SearchResultsPage = React.lazy(() => import("./pages/SearchResultsPage"));
const TagResultsPage = React.lazy(() => import("./pages/TagResultsPage"));

const LoadingSpinner = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <Spin size="large" />
  </div>
);

function App() {
  return (
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
              element={<CreateInventoryPage />}
            />
            <Route path="inventories/:id" element={<SelectedInventroyPage />} />
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
  );
}

export default App;
