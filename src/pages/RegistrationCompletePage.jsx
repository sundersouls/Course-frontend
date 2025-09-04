import React, { useState, useEffect } from "react";
import { Card, Typography, Button, Space, Result, Spin, Steps } from "antd";
import {
  CheckCircleOutlined,
  UserAddOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Step } = Steps;

export default function RegistrationCompletePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const [language] = useState(localStorage.getItem("language") || "en");
  const [theme] = useState(localStorage.getItem("theme") || "light");

  const translations = {
    en: {
      title: "Welcome to Inventory Manager!",
      subtitle: "Your account has been created successfully",
      steps: ["Account Created", "Profile Setup", "Ready to Use"],
      accountCreated: "Account Created Successfully",
      accountDetails: "Your account details:",
      nextSteps: "What you can do next:",
      features: [
        "Create your first inventory to organize items",
        "Invite team members to collaborate",
        "Customize fields for your specific needs",
        "Use the powerful search to find anything quickly",
      ],
      getStarted: "Get Started",
      loading: "Setting up your account...",
    },
    es: {
      title: "¡Bienvenido al Gestor de Inventarios!",
      subtitle: "Tu cuenta ha sido creada exitosamente",
      steps: ["Cuenta Creada", "Configuración de Perfil", "Listo para Usar"],
      accountCreated: "Cuenta Creada Exitosamente",
      accountDetails: "Detalles de tu cuenta:",
      nextSteps: "Qué puedes hacer a continuación:",
      features: [
        "Crea tu primer inventario para organizar elementos",
        "Invita a miembros del equipo para colaborar",
        "Personaliza campos para tus necesidades específicas",
        "Usa la búsqueda poderosa para encontrar cualquier cosa rápidamente",
      ],
      getStarted: "Comenzar",
      loading: "Configurando tu cuenta...",
    },
  };

  const t = translations[language];

  useEffect(() => {
    // Apply theme to body
    document.body.className = theme === "dark" ? "dark-theme" : "light-theme";

    // Fetch user data to confirm registration
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.id) {
            setUser(userData);
            // Animate steps
            setTimeout(() => setCurrentStep(1), 500);
            setTimeout(() => setCurrentStep(2), 1000);
          } else {
            // No user found, redirect to login
            navigate("/login");
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, theme]);

  const handleGetStarted = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background:
            theme === "dark"
              ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Card style={{ textAlign: "center", maxWidth: 400 }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>
            <Text>{t.loading}</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <Card
          style={{
            borderRadius: "12px",
            boxShadow:
              theme === "dark"
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Steps current={currentStep} style={{ marginBottom: "32px" }}>
              {t.steps.map((step, index) => (
                <Step key={index} title={step} />
              ))}
            </Steps>

            <Result
              icon={<UserAddOutlined style={{ color: "#52c41a" }} />}
              title={
                <Title
                  level={2}
                  style={{ color: theme === "dark" ? "#fff" : "inherit" }}
                >
                  {t.title}
                </Title>
              }
              subTitle={
                <Text type="secondary" style={{ fontSize: "16px" }}>
                  {t.subtitle}
                </Text>
              }
            />
          </div>

          <Card
            type="inner"
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                {t.accountCreated}
              </Space>
            }
            style={{ marginBottom: "24px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>{t.accountDetails}</Text>
              </div>
              <div style={{ marginLeft: "16px" }}>
                <Space direction="vertical">
                  <div>
                    <Text type="secondary">
                      {language === "en" ? "Name:" : "Nombre:"}{" "}
                    </Text>
                    <Text strong>{user.name}</Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      {language === "en" ? "Email:" : "Correo:"}{" "}
                    </Text>
                    <Text strong>{user.email}</Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      {language === "en" ? "Provider:" : "Proveedor:"}{" "}
                    </Text>
                    <Text strong style={{ textTransform: "capitalize" }}>
                      {user.provider}
                    </Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>

          <div style={{ marginBottom: "32px" }}>
            <Title level={4}>{t.nextSteps}</Title>
            <ul style={{ paddingLeft: "20px" }}>
              {t.features.map((feature, index) => (
                <li key={index} style={{ marginBottom: "12px" }}>
                  <Text>{feature}</Text>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleGetStarted}
              style={{
                height: "48px",
                fontSize: "16px",
                minWidth: "200px",
              }}
            >
              {t.getStarted}
            </Button>
          </div>
        </Card>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            color:
              theme === "dark"
                ? "rgba(255, 255, 255, 0.65)"
                : "rgba(0, 0, 0, 0.45)",
          }}
        >
          <Text type="secondary">
            &copy; {new Date().getFullYear()} Inventory Manager
          </Text>
        </div>
      </div>
    </div>
  );
}
