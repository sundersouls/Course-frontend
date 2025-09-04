import React, { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Card,
  Space,
  Button,
  Spin,
  Empty,
  message,
  Modal,
  Form,
  Input,
  Switch,
  Upload,
  Image,
  Tag,
  Avatar,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminPage() {
  const [myInventories, setMyInventories] = useState([]);
  const authUser = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users/all");
      console.log(res.data.users);
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.delete(`/api/users/${id}`)),
      );
      message.success("Selected users deleted");
      setSelectedRowKeys([]);
      fetchUsers();
    } catch {
      message.error("Failed to delete users");
    }
  };

  const handleBlockSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.patch(`/api/users/${id}/block`)),
      );
      message.success("Selected users blocked");
      setSelectedRowKeys([]);
      fetchUsers();
    } catch {
      message.error("Failed to block users");
    }
  };

  const handleUnblockSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.patch(`/api/users/${id}/unblock`)),
      );
      message.success("Selected users unblocked");
      setSelectedRowKeys([]);
      fetchUsers();
    } catch {
      message.error("Failed to unblock users");
    }
  };

  const handleMakeAdminSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.patch(`/api/users/${id}/make-admin`)),
      );
      message.success("Selected users promoted to admin");
      setSelectedRowKeys([]);
      fetchUsers();
    } catch {
      message.error("Failed to make admin");
    }
  };

  const handleRemoveAdminSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.patch(`/api/users/${id}/remove-admin`)),
      );
      message.success("Selected users demoted from admin");
      setSelectedRowKeys([]);
      fetchUsers();
    } catch {
      message.error("Failed to remove admin");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: "avatar",
      dataIndex: "avatar",
      key: "image",
      width: 60,
      render: (image) =>
        image ? (
          <img
            src={image}
            alt="Inventory"
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              objectFit: "cover",
            }}
          />
        ) : (
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ borderRadius: 4 }}
          />
        ),
    },
    {
      title: "email",
      dataIndex: "email",
      width: 200,
      key: "email",
      render: (email) => (
        <Space>
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: "name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <Space>
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: "isAdmin",
      dataIndex: "isAdmin",
      key: "isAdmin",
      render: (isAdmin) => (
        <Tag color={isAdmin ? "green" : "blue"}>
          {isAdmin ? "True" : "False"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <Space
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          User list
        </Title>
      </Space>

      <Card
        title="Actions"
        className="hover-table"
        extra={
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleDeleteSelected}
            >
              Delete
            </Button>

            <Button
              danger
              disabled={selectedRowKeys.length === 0}
              onClick={handleBlockSelected}
            >
              Block
            </Button>

            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={handleUnblockSelected}
            >
              Unblock
            </Button>

            <Button
              type="primary"
              disabled={selectedRowKeys.length === 0}
              onClick={handleMakeAdminSelected}
            >
              Make Admin
            </Button>

            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={handleRemoveAdminSelected}
            >
              Remove Admin
            </Button>
          </Space>
        }
      >
        {users.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} users`,
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </Space>
  );
}
