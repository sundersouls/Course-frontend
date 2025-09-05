import React, { useState, useEffect } from "react";
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
  Input,
  Button,
} from "antd";
import { SearchOutlined, UserOutlined, TagOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

const { Title, Text } = Typography;
const { Search } = Input;

export default function MainPage() {
  const { t, i18n } = useTranslation();
  const [latestInventories, setLatestInventories] = useState([]);
  const [popularInventories, setPopularInventories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMainData();
  }, []);

  async function fetchMainData() {
    setLoading(true);
    try {
      const [latestRes, popularRes, tagsRes] = await Promise.all([
        api.get("/api/inventory/latest"),
        api.get("/api/inventory/popular"),
        api.get("/api/inventory/tags"),
      ]);
      setLatestInventories(latestRes.data.inventories || []);
      setPopularInventories(popularRes.data.inventories || []);
      setTags(tagsRes.data.tags || []);
    } catch (e) {
      message.error("Failed to load main page data");
    } finally {
      setLoading(false);
    }
  }

  const handleTagClick = (tagName) => {
    navigate(`/tag/${encodeURIComponent(tagName)}`);
  };

  const handleInventoryClick = (inventoryId) => {
    navigate(`/inventories/${inventoryId}`);
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
        <Text style={{ marginLeft: "16px" }}>{t("loading")}</Text>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card title={t("latestInventories")}>
        {latestInventories.length === 0 ? (
          <Text type="secondary">{t("noPublicInventories")}</Text>
        ) : (
          <Row gutter={[16, 16]}>
            {latestInventories.map((inv) => (
              <Col xs={24} sm={12} md={8} lg={6} key={inv.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => handleInventoryClick(inv.id)}
                  style={{ cursor: "pointer" }}
                  cover={
                    inv.image ? (
                      <img
                        alt={inv.title}
                        src={inv.image}
                        style={{ height: 120, objectFit: "cover" }}
                      />
                    ) : null
                  }
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5} style={{ margin: 0 }}>
                      {inv.title}
                    </Title>
                    {inv.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {inv.description.length > 60
                          ? `${inv.description.substring(0, 60)}...`
                          : inv.description}
                      </Text>
                    )}
                    <Space>
                      <Avatar
                        size="small"
                        src={inv.creator.avatar}
                        icon={<UserOutlined />}
                      />
                      <Text style={{ fontSize: 12 }}>{inv.creator.name}</Text>
                    </Space>
                    <Space>
                      <Tag color="blue">{inv._count.items} items</Tag>
                      {inv.category && (
                        <Tag color="green">{inv.category.name}</Tag>
                      )}
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card title={t("popularInventories")}>
        {popularInventories.length === 0 ? (
          <Text type="secondary">{t("noPopularInventories")}</Text>
        ) : (
          <Row gutter={[16, 16]}>
            {popularInventories.map((inv) => (
              <Col xs={24} sm={12} md={8} lg={6} key={inv.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => handleInventoryClick(inv.id)}
                  style={{ cursor: "pointer" }}
                  cover={
                    inv.image ? (
                      <img
                        alt={inv.title}
                        src={inv.image}
                        style={{ height: 120, objectFit: "cover" }}
                      />
                    ) : null
                  }
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5} style={{ margin: 0 }}>
                      {inv.title}
                    </Title>
                    {inv.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {inv.description.length > 60
                          ? `${inv.description.substring(0, 60)}...`
                          : inv.description}
                      </Text>
                    )}
                    <Space>
                      <Avatar
                        size="small"
                        src={inv.creator.avatar}
                        icon={<UserOutlined />}
                      />
                      <Text style={{ fontSize: 12 }}>{inv.creator.name}</Text>
                    </Space>
                    <Space>
                      <Tag color="orange">{inv._count.items} items</Tag>
                      {inv.category && (
                        <Tag color="green">{inv.category.name}</Tag>
                      )}
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card title={t("popularTags")}>
        {tags.length === 0 ? (
          <Text type="secondary">{t("noTags")}</Text>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.slice(0, 20).map((tag) => (
              <Tag
                key={tag.id}
                icon={<TagOutlined />}
                style={{
                  cursor: "pointer",
                  fontSize: 12 + Math.min(tag._count.inventories / 2, 8),
                }}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name} ({tag._count.inventories})
              </Tag>
            ))}
          </div>
        )}
      </Card>
    </Space>
  );
}
