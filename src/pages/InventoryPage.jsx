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
import api from "../api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function InventoryPage() {
  const [myInventories, setMyInventories] = useState([]);
  const [accessibleInventories, setAccessibleInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
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
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 14 }}>
            {text}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description.length > 50
                ? `${record.description.substring(0, 50)}...`
                : record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Creator",
      dataIndex: "creator",
      key: "creator",
      render: (creator) => (
        <Space>
          <Avatar size="small" src={creator.avatar} icon={<UserOutlined />} />
          <Text>{creator.name}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isPublic",
      key: "isPublic",
      render: (isPublic) => (
        <Tag color={isPublic ? "green" : "blue"}>
          {isPublic ? "Public" : "Private"}
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

  const accessibleColumns = columns
    .filter((col) => col.key !== "actions")
    .concat([
      {
        title: "Access",
        key: "access",
        render: () => <Tag color="orange">Write Access</Tag>,
      },
    ]);

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const [myRes, accessibleRes] = await Promise.all([
        api.get("/api/inventory/my"),
        api.get("/api/inventory/accessible"),
      ]);
      setMyInventories(myRes.data.inventories || []);
      setAccessibleInventories(accessibleRes.data.inventories || []);
    } catch (error) {
      console.error("Failed to fetch inventories:", error);
      message.error("Failed to load inventories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventory = async (values) => {
    try {
      await api.post("/api/inventory/create", values);
      message.success("Inventory created successfully!");
      form.resetFields();
      fetchInventories();
    } catch (error) {
      console.error("Create inventory error:", error);
      message.error("Failed to create inventory");
    }
  };

  const handleEditInventory = (inventory) => {
    setSelectedInventory(inventory);
    editForm.setFieldsValue({
      title: inventory.title,
      description: inventory.description,
      isPublic: inventory.isPublic,
    });
    setEditModalVisible(true);
  };

  const handleUpdateInventory = async (values) => {
    try {
      await api.put(`/api/inventory/${selectedInventory.id}`, values);
      message.success("Inventory updated successfully!");
      setEditModalVisible(false);
      editForm.resetFields();
      setSelectedInventory(null);
      fetchInventories();
    } catch (error) {
      console.error("Update inventory error:", error);
      message.error("Failed to update inventory");
    }
  };

  const handleViewInventory = (inventory) => {
    navigate(`/inventories/${inventory.id}`);
  };

  const handleDeleteInventory = async (inventoryId) => {
    try {
      await api.delete(`/api/inventory/${inventoryId}`);
      message.success("Inventory deleted successfully!");
      fetchInventories();
    } catch (error) {
      console.error("Delete inventory error:", error);
      message.error("Failed to delete inventory");
    }
  };

  const handleMassDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.info("Select inventories to delete");
      return;
    }
    try {
      await Promise.all(
        selectedRowKeys.map((id) => api.delete(`/api/inventory/${id}`)),
      );
      message.success("Deleted selected inventories");
      setSelectedRowKeys([]);
      fetchInventories();
    } catch (e) {
      message.error("Failed to delete some inventories");
    }
  };

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
          My Inventories
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/inventories/create")}
          size="large"
        >
          Create Inventory
        </Button>
      </Space>

      <Card
        title="My Inventories"
        className="hover-table"
        extra={
          <Popconfirm
            title="Delete selected"
            description="Delete all selected inventories? This cannot be undone."
            onConfirm={handleMassDelete}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
            >
              Delete Selected
            </Button>
          </Popconfirm>
        }
      >
        {myInventories.length === 0 ? (
          <Empty
            description="No inventories found. Create your first inventory!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          ></Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={myInventories}
            rowKey="id"
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} inventories`,
            }}
            scroll={{ x: 800 }}
            onRow={(record) => ({ onClick: () => handleViewInventory(record) })}
          />
        )}
      </Card>

      {accessibleInventories.length > 0 && (
        <Card title="Inventories with Write Access" className="hover-table">
          <Table
            columns={accessibleColumns}
            dataSource={accessibleInventories}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} inventories`,
            }}
            scroll={{ x: 800 }}
            onRow={(record) => ({ onClick: () => handleViewInventory(record) })}
          />
        </Card>
      )}

      <Modal
        title="Inventory Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedInventory(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedInventory && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {selectedInventory.image && (
              <Space style={{ textAlign: "center" }}>
                <Image
                  src={selectedInventory.image}
                  alt={selectedInventory.title}
                  style={{ maxHeight: 200, borderRadius: 8 }}
                />
              </Space>
            )}

            <Space>
              <Title level={4}>{selectedInventory.title}</Title>
              {selectedInventory.description && (
                <Text type="secondary">{selectedInventory.description}</Text>
              )}
            </Space>

            <Space wrap>
              <Tag color={selectedInventory.isPublic ? "green" : "blue"}>
                {selectedInventory.isPublic ? "Public" : "Private"}
              </Tag>
              <Tag>
                Created:{" "}
                {new Date(selectedInventory.createdAt).toLocaleDateString()}
              </Tag>
            </Space>

            <Space>
              <Text strong>Creator: </Text>
              <Space>
                <Avatar
                  size="small"
                  src={selectedInventory.creator.avatar}
                  icon={<UserOutlined />}
                />
                <Text>{selectedInventory.creator.name}</Text>
              </Space>
            </Space>

            {selectedInventory.writeAccess &&
              selectedInventory.writeAccess.length > 0 && (
                <Space>
                  <Text strong>Users with Write Access:</Text>
                  <Space style={{ marginTop: 8 }}>
                    {selectedInventory.writeAccess.map((access) => (
                      <Tag key={access.user.id} style={{ margin: 4 }}>
                        <Space size="small">
                          <Avatar
                            size={16}
                            src={access.user.avatar}
                            icon={<UserOutlined />}
                          />
                          {access.user.name}
                        </Space>
                      </Tag>
                    ))}
                  </Space>
                </Space>
              )}
          </Space>
        )}
      </Modal>

      <Modal
        title="Edit Inventory"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedInventory(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateInventory}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Please enter inventory title" },
              { min: 3, message: "Title must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter inventory title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter inventory description (optional)"
            />
          </Form.Item>

          <Form.Item name="image" label="Image URL">
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          <Form.Item name="isPublic" label="Visibility" valuePropName="checked">
            <Switch checkedChildren="Public" unCheckedChildren="Private" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setSelectedInventory(null);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Inventory
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
