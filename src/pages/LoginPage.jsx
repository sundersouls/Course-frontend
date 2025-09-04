import { Button, Card, Typography, Space } from "antd";
import { GithubOutlined, GoogleOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function LoginPage() {
  const handleLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/${provider}`;
  };

  return (
    <Space
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: 300, textAlign: "center" }}>
        <Title level={3}>Login</Title>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Button
            icon={<GoogleOutlined />}
            type="primary"
            onClick={() => handleLogin("google")}
            style={{ backgroundColor: "#db4437", borderColor: "#db4437" }}
          >
            Continue with Google
          </Button>
          <Button
            icon={<GithubOutlined />}
            onClick={() => handleLogin("github")}
          >
            Continue with GitHub
          </Button>
        </Space>
      </Card>
    </Space>
  );
}
