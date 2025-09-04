import React from "react";
import { Card, Form, Input, Switch, Button, Space, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api";

const { Title } = Typography;
const { TextArea } = Input;

export default function CreateInventoryPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      await api.post("/api/inventory/create", values);

      message.success("Inventory created");
      navigate("/inventories");
    } catch (e) {
      const errorMessage = e.response?.data?.error || e.message || "Failed to create inventory";
      message.error(errorMessage);
    }
  };

  return (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Create Inventory</Title>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Space>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: "Enter a title" }, { min: 3, message: "At least 3 characters" }]}>
          <Input placeholder="Inventory title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={4} placeholder="Optional description" />
        </Form.Item>

        <Form.Item name="image" label="Image URL">
          <Input placeholder="https://... (optional)" />
        </Form.Item>

        <Form.Item name="isPublic" label="Visibility" valuePropName="checked">
          <Switch checkedChildren="Public" unCheckedChildren="Private" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}


