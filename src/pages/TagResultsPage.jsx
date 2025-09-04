import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Card,
  Space,
  Tag,
  Avatar,
  Row,
  Col,
  Spin,
  message,
  Table,
  Button,
} from "antd";
import { UserOutlined, TagOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;

export default function TagResultsPage() {
  const { tagName } = useParams();
  const [tag, setTag] = useState(null);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (tagName) {
      fetchTagResults();
    }
  }, [tagName]);

  async function fetchTagResults() {
    setLoading(true);
    try {
      const res = await api.get(`/api/inventory/tag/${encodeURIComponent(tagName)}`);
      setTag(res.data.tag);
      setInventories(res.data.inventories);
    } catch (e) {
      message.error("Failed to load tag results");
    } finally {
      setLoading(false);
    }
  }

  const handleInventoryClick = (inventoryId) => {
    navigate(`/inventories/${inventoryId}`);
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Button type="link" onClick={() => handleInventoryClick(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <Text type="secondary">
          {text && text.length > 60 ? `${text.substring(0, 60)}...` : text}
        </Text>
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
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => category ? <Tag color="green">{category.name}</Tag> : null,
    },
    {
      title: "Items",
      dataIndex: "_count",
      key: "items",
      render: (count) => <Tag color="blue">{count.items}</Tag>,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags) => (
        <Space>
          {tags?.map((t) => (
            <Tag key={t.tag.id} color="orange">
              {t.tag.name}
            </Tag>
          ))}
        </Space>
      ),
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
        <Text style={{ marginLeft: "16px" }}>Loading...</Text>
      </Space>
    );
  }

  if (!tag) {
    return (
      <Card>
        <Text type="secondary">Tag not found.</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={3}>
            <TagOutlined /> Tag: {tag.name}
          </Title>
          <Text type="secondary">
            {inventories.length} inventory{inventories.length !== 1 ? "ies" : "y"} found
          </Text>
        </Space>
      </Card>

      <Card>
        {inventories.length === 0 ? (
          <Text type="secondary">No inventories found for this tag.</Text>
        ) : (
          <Table
            columns={columns}
            dataSource={inventories}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </Space>
  );
}

