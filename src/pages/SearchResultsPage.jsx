import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tabs,
  Table,
  Button,
} from "antd";
import { UserOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";

const { Title, Text } = Typography;

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState({ inventories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const query = searchParams.get("q");

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  async function fetchSearchResults() {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/inventory/search?q=${encodeURIComponent(query)}`,
      );
      setResults({
        inventories: res.data.inventories || [],
        items: res.data.items || [],
        inventoryMeta: res.data.inventoryMeta,
        itemMeta: res.data.itemMeta,
      });
    } catch (e) {
      message.error("Search failed");
    } finally {
      setLoading(false);
    }
  }

  const handleInventoryClick = (inventoryId) => {
    navigate(`/inventories/${inventoryId}`);
  };

  const handleItemClick = (inventoryId) => {
    navigate(`/inventories/${inventoryId}`);
  };

  const inventoryColumns = [
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
      render: (category) =>
        category ? <Tag color="green">{category.name}</Tag> : null,
    },
    {
      title: "Items",
      dataIndex: "itemCount",
      key: "items",
      render: (count) => <Tag color="blue">{count}</Tag>,
    },
  ];

  const itemColumns = [
    {
      title: "Item",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleItemClick(record.inventory.id)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: "Custom ID",
      dataIndex: "customId",
      key: "customId",
    },
    {
      title: "Inventory",
      dataIndex: "inventory",
      key: "inventory",
      render: (inventory) => (
        <Button type="link" onClick={() => handleInventoryClick(inventory.id)}>
          {inventory.title}
        </Button>
      ),
    },
    {
      title: "Creator",
      dataIndex: "inventory",
      key: "creator",
      render: (inventory) => (
        <Space>
          <Avatar
            size="small"
            src={inventory.creator.avatar}
            icon={<UserOutlined />}
          />
          <Text>{inventory.creator.name}</Text>
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
        <Text style={{ marginLeft: "16px" }}>Searching...</Text>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={3}>
            <SearchOutlined /> Search Results
          </Title>
          <Text type="secondary">Results for "{query}"</Text>
        </Space>
      </Card>

      <Tabs
        items={[
          {
            key: "inventories",
            label: `Inventories (${results.inventoryMeta?.total || 0})`,
            children: (
              <Card>
                {results.inventories?.length === 0 ? (
                  <Text type="secondary">No inventories found.</Text>
                ) : (
                  <Table
                    columns={inventoryColumns}
                    dataSource={results.inventories}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Card>
            ),
          },
          {
            key: "items",
            label: `Items (${results.itemMeta?.total || 0})`,
            children: (
              <Card>
                {results.items?.length === 0 ? (
                  <Text type="secondary">No items found.</Text>
                ) : (
                  <Table
                    columns={itemColumns}
                    dataSource={results.items}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </Space>
  );
}
