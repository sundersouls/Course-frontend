import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  AutoComplete,
  Switch,
  Avatar,
  Space,
  Typography,
  Spin,
  message,
  Badge,
  Tag,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  GlobalOutlined,
  BulbOutlined,
  HomeOutlined,
  AppstoreOutlined,
  PlusOutlined,
  LoginOutlined,
  FileTextOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, setToken } from "../store/authSlice";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showToast, handleApiError } from "../components/toast.js";

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

const API_URL = import.meta.env.VITE_API_URL;

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const debouncedFetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchSuggestions([]);
        setSearchLoading(false);
        return;
      }

      try {
        setSearchLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/inventory/search?q=${encodeURIComponent(query)}&type=all`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const rawSuggestions = [
            ...(data.inventories || []).map((inv) => ({
              type: "inventory",
              text: inv.title,
            })),
            ...(data.items || []).map((item) => ({
              type: "item",
              text: item.name,
            })),
          ];

          const suggestions = rawSuggestions.map((suggestion, index) => ({
            key: `${suggestion.type}-${index}`,
            value: suggestion.text,
            label: (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {suggestion.type === "inventory" && <FileTextOutlined />}
                {suggestion.type === "item" && <AppstoreOutlined />}
                <span>{suggestion.text}</span>
                <Tag
                  size="small"
                  color={suggestion.type === "inventory" ? "blue" : "green"}
                >
                  {suggestion.type}
                </Tag>
              </div>
            ),
          }));
          setSearchSuggestions(suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      dispatch(setToken(token));
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    dispatch(fetchMe());

    const savedTheme = localStorage.getItem("theme") || "light";
    const savedLanguage = localStorage.getItem("language") || "en";
    setTheme(savedTheme);
    setLanguage(savedLanguage);

    if (savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }

    document.body.className =
      savedTheme === "dark" ? "dark-theme" : "light-theme";
  }, [dispatch, i18n]);

  useEffect(() => {
    debouncedFetchSuggestions(searchValue);
  }, [searchValue, debouncedFetchSuggestions]);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const handleLogout = () => {
    window.location.href = `${API_URL}/api/auth/logout`;
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleThemeChange = (checked) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.className =
      newTheme === "dark" ? "dark-theme" : "light-theme";
  };

  const handleLanguageChange = async (lang) => {
    try {
      setLanguage(lang);
      localStorage.setItem("language", lang);
      await i18n.changeLanguage(lang);
    } catch (error) {
      console.error("Failed to change language:", error);
      message.error("Failed to change language");
    }
  };

  const handleSearch = async (value) => {
    if (!value || value.trim().length < 2) {
      message.warning("Please enter at least 2 characters to search");
      return;
    }

    try {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    } catch (error) {
      console.error("Search navigation error:", error);
      message.error(t("searchError") || "Search error");
    }
  };

  const handleSearchSelect = (value) => {
    setSearchValue(value);
    handleSearch(value);
  };

  const userMenuItems = user
    ? [
        {
          key: "profile",
          icon: <UserOutlined />,
          label: <Link to="/profile">{t("profile")}</Link>,
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: t("settings"),
          children: [
            {
              key: "theme",
              label: (
                <Space>
                  <BulbOutlined />
                  <Text>{t("darkTheme")}</Text>
                  <Switch
                    size="small"
                    checked={theme === "dark"}
                    onChange={handleThemeChange}
                  />
                </Space>
              ),
            },
            {
              key: "language",
              icon: <GlobalOutlined />,
              label: t("language"),
              children: [
                {
                  key: "en",
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      English
                      {language === "en" && (
                        <span style={{ color: "#1890ff" }}>✓</span>
                      )}
                    </div>
                  ),
                  onClick: () => handleLanguageChange("en"),
                },
                {
                  key: "ru",
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      Русский
                      {language === "ru" && (
                        <span style={{ color: "#1890ff" }}>✓</span>
                      )}
                    </div>
                  ),
                  onClick: () => handleLanguageChange("ru"),
                },
              ],
            },
          ],
        },
        {
          type: "divider",
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: t("logout"),
          onClick: handleLogout,
        },
      ]
    : [];

  const guestMenuItems = [
    {
      key: "theme",
      label: (
        <Space>
          <BulbOutlined />
          <Text>{t("darkTheme")}</Text>
          <Switch
            size="small"
            checked={theme === "dark"}
            onChange={handleThemeChange}
          />
        </Space>
      ),
    },
    {
      key: "language",
      icon: <GlobalOutlined />,
      label: t("language"),
      children: [
        {
          key: "en",
          label: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              English
              {language === "en" && <span style={{ color: "#1890ff" }}>✓</span>}
            </div>
          ),
          onClick: () => handleLanguageChange("en"),
        },
        {
          key: "ru",
          label: (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              Русский
              {language === "ru" && <span style={{ color: "#1890ff" }}>✓</span>}
            </div>
          ),
          onClick: () => handleLanguageChange("ru"),
        },
      ],
    },
  ];

  const sidebarItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link to="/">{t("home")}</Link>,
    },
    {
      key: "inventories",
      icon: <AppstoreOutlined />,
      label: <Link to="/inventories">{t("myInventories")}</Link>,
    },
    ...(user?.isAdmin
      ? [
          {
            key: "admin",
            icon: <SettingOutlined />,
            label: <Link to="/admin">{t("adminPanel")}</Link>,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>{t("loading")}</Text>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }} className={theme}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: theme === "dark" ? "#001529" : "#fff",
          borderBottom:
            theme === "dark" ? "1px solid #303030" : "1px solid #f0f0f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Title
              level={3}
              style={{
                margin: 0,
                color: theme === "dark" ? "#fff" : "#1890ff",
              }}
            >
              {t("appName")}
            </Title>
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <AutoComplete
            value={searchValue}
            options={searchSuggestions}
            onSearch={setSearchValue}
            onSelect={handleSearchSelect}
            placeholder={t("search")}
            allowClear
            style={{ maxWidth: 400, width: "100%" }}
            notFoundContent={searchLoading ? <Spin size="small" /> : null}
          >
            <div style={{ position: "relative" }}>
              <input
                style={{
                  width: "100%",
                  padding: "8px 40px 8px 12px",
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                  backgroundColor: theme === "dark" ? "#1f1f1f" : "#fff",
                  color: theme === "dark" ? "#fff" : "#000",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchValue);
                  }
                }}
              />
              <Button
                type="text"
                icon={<SearchOutlined />}
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  backgroundColor: "transparent",
                  color: theme === "dark" ? "#fff" : "#666",
                }}
                onClick={() => handleSearch(searchValue)}
                loading={searchLoading}
              />
            </div>
          </AutoComplete>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Button
                type="text"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Avatar
                  size="small"
                  src={user.avatar}
                  icon={<UserOutlined />}
                />
                <Text style={{ color: theme === "dark" ? "#fff" : "inherit" }}>
                  {user.name}
                </Text>
              </Button>
            </Dropdown>
          ) : (
            <Space>
              <Dropdown menu={{ items: guestMenuItems }} trigger={["click"]}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  style={{ color: theme === "dark" ? "#fff" : "inherit" }}
                />
              </Dropdown>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={handleLogin}
              >
                {t("login")}
              </Button>
            </Space>
          )}
        </div>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme={theme}
          style={{
            backgroundColor: theme === "dark" ? "#001529" : "#fff",
          }}
        >
          <Menu
            theme={theme}
            mode="inline"
            defaultSelectedKeys={["home"]}
            selectedKeys={[
              location.pathname === "/"
                ? "home"
                : location.pathname.split("/")[1],
            ]}
            items={sidebarItems}
            style={{ border: "none" }}
          />
        </Sider>

        <Content
          style={{
            padding: "24px",
            backgroundColor: theme === "dark" ? "#141414" : "#f0f2f5",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div
            style={{
              backgroundColor: theme === "dark" ? "#1f1f1f" : "#fff",
              padding: "24px",
              borderRadius: "8px",
              minHeight: "100%",
            }}
          >
            <Outlet context={{ user, theme, language }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
