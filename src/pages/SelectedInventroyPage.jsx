import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Card,
  Tabs,
  Table,
  Space,
  Typography,
  Form,
  Input,
  Switch,
  Button,
  Tag,
  message,
  Divider,
  Statistic,
  Row,
  Col,
  Modal,
  List,
  Select,
  Popover,
  Upload,
  Alert,
  AutoComplete,
  Spin,
} from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  UploadOutlined,
  HeartOutlined,
  HeartFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import api from "../api";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SelectedInventroyPage({ createMode: propCreateMode }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const createMode = propCreateMode || location.pathname.endsWith("/create");
  const authUser = useSelector((s) => s.auth.user);
  const [inventory, setInventory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [comments, setComments] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const [userInputValue, setUserInputValue] = useState("");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemForm] = Form.useForm();
  const [editItemForm] = Form.useForm();
  const [editingItem, setEditingItem] = useState(null);

  const [addCommentOpen, setAddCommentOpen] = useState(false);
  const [addCommentForm] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [generalForm] = Form.useForm();

  const [customIdFormat, setCustomIdFormat] = useState([]);
  const [nextSequence, setNextSequence] = useState(1);

  useEffect(() => {
    console.log("useEffect triggered with:", { createMode, id });
    if (!createMode && id) {
      fetchAll();
    } else {
      console.log("Skipping fetchAll because:", { createMode, id });
      setLoading(false);
    }
  }, [id, createMode]);

  async function fetchAll() {
    setLoading(true);
    try {
      console.log("Fetching inventory with ID:", id);
      const [invRes, itemsRes, fieldsRes, commentsRes, categoriesRes] =
        await Promise.all([
          api.get(`/api/inventory/${id}`),
          api.get(`/api/inventory/${id}/items`),
          api.get(`/api/inventory/${id}/fields`),
          api.get(`/api/inventory/${id}/comments`),
          api.get("/api/categories"),
        ]);

      console.log("Inventory response:", invRes.data);
      setInventory(invRes.data);
      setItems(itemsRes.data.items || []);
      setFields(fieldsRes.data.fields || []);
      setComments(commentsRes.data.comments || []);
      setCategories(categoriesRes.data || []);
      setCustomIdFormat(invRes.data.customIdFormat || []);
      setNextSequence(invRes.data.nextSequence || 1);
    } catch (e) {
      console.error("Failed to load inventory:", e);
      const errorMessage =
        e.response?.status === 404
          ? "Inventory not found. Please check the URL and try again."
          : e.response?.data?.error || "Failed to load inventory";
      message.error(errorMessage);
      console.error("Error details:", e);
    } finally {
      setLoading(false);
    }
  }

  const [likeLoading, setLikeLoading] = useState({});
  const [likeStatus, setLikeStatus] = useState({});

  useEffect(() => {
    const status = {};
    items.forEach((item) => {
      status[item.id] = {
        liked:
          Array.isArray(item.likes) &&
          item.likes.some((l) => l.user?.id === authUser?.id),
        count: item._count?.likes || 0,
      };
    });
    setLikeStatus(status);
  }, [items, authUser]);

  async function handleToggleLike(itemId) {
    setLikeLoading((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await api.post(`/api/inventory/${id}/items/${itemId}/like`);
      const { liked } = res.data;
      setLikeStatus((prev) => {
        const old = prev[itemId] || { liked: false, count: 0 };
        return {
          ...prev,
          [itemId]: {
            liked,
            count: liked ? old.count + 1 : Math.max(0, old.count - 1),
          },
        };
      });
    } catch (e) {
      message.error(e.response?.data?.error || "Failed to toggle like");
    } finally {
      setLikeLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  const itemColumns = useMemo(() => {
    const base = [
      {
        title: "Item",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <Button
            type="link"
            onClick={() => message.info("Open item page TBD")}
          >
            {text}
          </Button>
        ),
      },
      { title: "Custom ID", dataIndex: "customId", key: "customId" },
      {
        title: "Likes",
        key: "likes",
        render: (_, record) => {
          const status = likeStatus[record.id] || { liked: false, count: 0 };
          return (
            <Space>
              <Button
                type={status.liked ? "primary" : "default"}
                shape="round"
                loading={likeLoading[record.id]}
                onClick={() => handleToggleLike(record.id)}
                disabled={!authUser}
              >
                {status.liked ? "Unlike" : "Like"}
              </Button>
              <Text>{status.count}</Text>
            </Space>
          );
        },
      },
    ];
    const dynamic = fields.map((f) => ({
      title: f.label || f.key,
      dataIndex: ["values", f.key],
      key: f.key,
      render: (v) =>
        v === null || v === undefined || v === "" ? (
          <Text type="secondary">—</Text>
        ) : (
          String(v)
        ),
    }));
    return [...base, ...dynamic];
  }, [fields, likeStatus, likeLoading, authUser]);

  const stats = useMemo(() => {
    const count = items.length;
    const numericKeys = fields
      .filter((f) => f.type === "number")
      .map((f) => f.key);
    const aggregates = {};
    for (const key of numericKeys) {
      const values = items
        .map((it) => Number(it.values?.[key]))
        .filter((n) => Number.isFinite(n));
      if (values.length) {
        const sum = values.reduce((a, b) => a + b, 0);
        aggregates[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: sum / values.length,
        };
      }
    }
    return { count, aggregates };
  }, [items, fields]);

  const canWrite = useMemo(() => {
    if (createMode) return true;
    if (!authUser || !inventory) return false;
    if (authUser.isAdmin) return true;
    if (inventory.creatorId === authUser.id) return true;
    if (Array.isArray(inventory.writeAccess)) {
      return inventory.writeAccess.some((wa) => wa.userId === authUser.id);
    }
    return false;
  }, [authUser, inventory, createMode]);

  const canAdmin = useMemo(() => {
    if (createMode) return true;
    if (!authUser || !inventory) {
      console.log("Debug - Auth check failed:", { authUser, inventory });
      return false;
    }
    const isAdmin = authUser.isAdmin || inventory.creatorId === authUser.id;
    console.log("Debug - Admin check:", {
      isAdmin,
      userIsAdmin: authUser.isAdmin,
      creatorId: inventory.creatorId,
      userId: authUser.id,
    });
    return isAdmin;
  }, [authUser, inventory, createMode]);

  async function handleCreateItem(values) {
    try {
      await api.post(`/api/inventory/${id}/items`, values);
      message.success("Item created");
      setAddItemOpen(false);
      addItemForm.resetFields();
      const itemsRes = await api.get(`/api/inventory/${id}/items`);
      setItems(itemsRes.data.items || []);
    } catch (e) {
      message.error(
        e.response?.data?.error || e.message || "Failed to create item",
      );
    }
  }

  async function handleCreateComment(values) {
    try {
      await api.post(`/api/inventory/${id}/comments`, values);
      message.success("Comment added");
      setAddCommentOpen(false);
      addCommentForm.resetFields();
      const commentsRes = await api.get(`/api/inventory/${id}/comments`);
      setComments(commentsRes.data.comments || []);
    } catch (e) {
      message.error(
        e.response?.data?.error || e.message || "Failed to add comment",
      );
    }
  }

  async function handleUpdateGeneral(values) {
    try {
      if (createMode) {
        const res = await api.post("/api/inventory/create", values);
        message.success("Inventory created successfully!");
        navigate(`/inventories/${res.data.id}`);
      } else {
        await api.put(`/api/inventory/${id}`, values);
        message.success("Updated");
        fetchAll();
      }
    } catch (e) {
      message.error(
        e.response?.data?.error || "Failed to create/update inventory",
      );
    }
  }

  async function handleSaveCustomNumbers(values) {
    try {
      await api.put(`/api/inventory/${id}/numbers`, values);
      message.success("Saved");
    } catch (e) {
      message.error(e.response?.data?.error || "Save failed");
    }
  }

  async function handleSaveFields(newFields) {
    try {
      await api.put(`/api/inventory/${id}/fields`, { fields: newFields });
      message.success("Fields updated");
      setFields(newFields);
    } catch (e) {
      message.error(e.response?.data?.error || "Update failed");
    }
  }

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    try {
      const res = await api.get(
        `/api/userss/search?q=${encodeURIComponent(query)}`,
      );
      setUserSearchResults(res.data.users || []);
    } catch (e) {
      console.error("Failed to search users:", e);
    }
  };

  const searchTags = async (query) => {
    if (!query) return;
    try {
      const res = await api.get(
        `/api/inventory/tags/search?q=${encodeURIComponent(query)}`,
      );
      setTagSuggestions(res.data.tags || []);
    } catch (e) {
      console.error("Failed to search tags:", e);
    }
  };

  async function handleSaveAccess(values) {
    try {
      const userIds = await Promise.all(
        values.users.map(async (user) => {
          if (typeof user === "string" && user.includes("@")) {
            const res = await api.get(
              `/api/users/by-email?email=${encodeURIComponent(user)}`,
            );
            return res.data.id;
          }
          return user;
        }),
      );

      await api.put(`/api/inventory/${id}/access`, {
        ...values,
        userIds: userIds.filter(Boolean),
      });
      message.success("Access updated");
    } catch (e) {
      message.error(e.response?.data?.error || "Update failed");
    }
  }

  const elementOptions = [
    { value: "text", label: "Fixed text", description: "Any Unicode text" },
    {
      value: "rand20",
      label: "20-bit random",
      description: "Random number between 0 and 1,048,575",
    },
    {
      value: "rand32",
      label: "32-bit random",
      description: "Random number between 0 and 4,294,967,295",
    },
    {
      value: "rand6d",
      label: "6-digit random",
      description: "Random number between 000000 and 999999",
    },
    {
      value: "rand9d",
      label: "9-digit random",
      description: "Random number between 000000000 and 999999999",
    },
    { value: "guid", label: "GUID", description: "Globally Unique Identifier" },
    {
      value: "datetime",
      label: "Date/Time",
      description: "ISO timestamp at creation",
    },
    {
      value: "sequence",
      label: "Sequence",
      description:
        "Auto-incrementing number (can be formatted with leading zeros)",
    },
  ];

  const DraggableElement = ({ el, idx, moveElement, removeElement }) => {
    const [{ isDragging }, drag] = useDrag({
      type: "id-element",
      item: { idx },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [{ isOver }, drop] = useDrop({
      accept: "id-element",
      drop: (item) => {
        if (item.idx !== idx) {
          moveElement(item.idx, idx);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    const style = {
      opacity: isDragging ? 0.5 : 1,
      backgroundColor: isOver ? "#f0f0f0" : "white",
      padding: "8px",
      marginBottom: "8px",
      border: "1px solid #d9d9d9",
      borderRadius: "4px",
    };

    const option = elementOptions.find((opt) => opt.value === el.type);

    return (
      <div ref={(node) => drag(drop(node))} style={style}>
        <Space wrap align="start">
          <Select
            value={el.type}
            options={elementOptions}
            style={{ width: 200 }}
            disabled={!editMode || !canAdmin}
            onChange={(val) => {
              const copy = [...customIdFormat];
              copy[idx] = { ...copy[idx], type: val };
              setCustomIdFormat(copy);
            }}
          />
          {el.type === "text" && (
            <Input
              placeholder="Fixed text"
              value={el.value}
              disabled={!editMode || !canAdmin}
              onChange={(e) => {
                const copy = [...customIdFormat];
                copy[idx] = { ...copy[idx], value: e.target.value };
                setCustomIdFormat(copy);
              }}
              style={{ width: 260 }}
            />
          )}
          {el.type === "sequence" && (
            <Input
              placeholder="Min width (e.g., 4)"
              type="number"
              value={el.minWidth}
              disabled={!editMode || !canAdmin}
              onChange={(e) => {
                const copy = [...customIdFormat];
                copy[idx] = {
                  ...copy[idx],
                  minWidth: Number(e.target.value || 1),
                };
                setCustomIdFormat(copy);
              }}
              style={{ width: 200 }}
            />
          )}
          <Popover
            content={
              <div style={{ maxWidth: 300 }}>
                <Text>{option?.description}</Text>
              </div>
            }
          >
            <Button icon={<QuestionCircleOutlined />} />
          </Popover>
          <Button
            danger
            disabled={!editMode || !canAdmin}
            onClick={() => removeElement(idx)}
          >
            Remove
          </Button>
        </Space>
      </div>
    );
  };

  function renderCustomIdPreview(list) {
    const parts = list.map((el) => {
      switch (el.type) {
        case "text":
          return el.value || "";
        case "rand20":
          return Math.floor(Math.random() * 2 ** 20).toString();
        case "rand32":
          return Math.floor(Math.random() * 2 ** 32).toString();
        case "rand6d":
          return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
        case "rand9d":
          return String(Math.floor(Math.random() * 1_000_000_000)).padStart(
            9,
            "0",
          );
        case "guid":
          return Math.random().toString(36).slice(2, 10);
        case "datetime":
          return new Date().toISOString();
        case "sequence":
          return String(nextSequence).padStart(el.minWidth || 1, "0");
        default:
          return "";
      }
    });
    return parts.join("");
  }

  const itemsTab = (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Items
        </Title>
        <Button
          type="primary"
          onClick={() => setAddItemOpen(true)}
          disabled={!canWrite}
        >
          Add Item
        </Button>
      </Space>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {items.length === 0 ? (
          <Text type="secondary">No items yet</Text>
        ) : (
          <Row gutter={[16, 16]}>
            {items.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => {
                    if (canWrite) {
                      setEditingItem(item);
                      editItemForm.setFieldsValue({
                        name: item.name,
                        customId: item.customId,
                        values: item.values || {},
                      });
                    }
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        {item.name}
                      </Title>
                      <Button
                        type="text"
                        icon={
                          likeStatus[item.id]?.liked ? (
                            <HeartFilled style={{ color: "#ff4d4f" }} />
                          ) : (
                            <HeartOutlined />
                          )
                        }
                        loading={likeLoading[item.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(item.id);
                        }}
                      >
                        {likeStatus[item.id]?.count || 0}
                      </Button>
                    </Space>
                    <Tag>{item.customId}</Tag>
                    {fields.map((field) => (
                      <div key={field.key}>
                        <Text type="secondary">
                          {field.label || field.key}:{" "}
                        </Text>
                        <Text>
                          {item.values?.[field.key] ?? (
                            <span style={{ color: "#999" }}>—</span>
                          )}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>

      <Modal
        title="Add Item"
        open={addItemOpen}
        onCancel={() => {
          setAddItemOpen(false);
          addItemForm.resetFields();
        }}
        onOk={() => addItemForm.submit()}
        okText="Create"
        destroyOnClose
      >
        <Form form={addItemForm} layout="vertical" onFinish={handleCreateItem}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item
            name="customId"
            label={
              <Space>
                <Text>Custom ID</Text>
                <Popover
                  content={
                    <div style={{ maxWidth: 320 }}>
                      <Text>
                        Custom ID is auto-generated from the inventory's Custom
                        ID format. You may edit it if needed. Uniqueness is
                        enforced within this inventory.
                      </Text>
                    </div>
                  }
                >
                  <Tag>help</Tag>
                </Popover>
              </Space>
            }
          >
            <Input placeholder={renderCustomIdPreview(customIdFormat)} />
          </Form.Item>
          {fields.map((f) => (
            <Form.Item
              key={f.key}
              name={["values", f.key]}
              label={f.label || f.key}
            >
              {f.type === "boolean" ? (
                <Switch />
              ) : f.type === "number" ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      <Modal
        title="Edit Item"
        open={!!editingItem}
        onCancel={() => {
          setEditingItem(null);
          editItemForm.resetFields();
        }}
        onOk={() => editItemForm.submit()}
        okText="Save"
        destroyOnClose
      >
        <Form
          form={editItemForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await api.put(
                `/api/inventory/${id}/items/${editingItem.id}`,
                values,
              );
              message.success("Item updated successfully");
              setEditingItem(null);
              editItemForm.resetFields();
              fetchAll();
            } catch (e) {
              message.error(e.response?.data?.error || "Failed to update item");
            }
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item name="customId" label="Custom ID">
            <Input placeholder="Custom ID" />
          </Form.Item>
          {fields.map((f) => (
            <Form.Item
              key={f.key}
              name={["values", f.key]}
              label={f.label || f.key}
            >
              {f.type === "boolean" ? (
                <Switch />
              ) : f.type === "number" ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Card>
  );

  const discussionTab = (
    <Card>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Discussion
        </Title>
        <Button type="primary" onClick={() => setAddCommentOpen(true)}>
          Add Comment
        </Button>
      </Space>
      <List
        dataSource={comments}
        locale={{ emptyText: "No comments yet" }}
        renderItem={(c) => (
          <List.Item key={c.id}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text strong>{c.user?.name || "User"}</Text>
                <Text type="secondary">
                  {new Date(c.createdAt).toLocaleString()}
                </Text>
              </Space>
              <Text>{c.content}</Text>
            </Space>
          </List.Item>
        )}
      />

      <Modal
        title="Add Comment"
        open={addCommentOpen}
        onCancel={() => {
          setAddCommentOpen(false);
          addCommentForm.resetFields();
        }}
        onOk={() => addCommentForm.submit()}
        okText="Post"
        destroyOnHidden
      >
        <Form
          form={addCommentForm}
          layout="vertical"
          onFinish={handleCreateComment}
        >
          <Form.Item
            name="content"
            label="Comment"
            rules={[{ required: true, min: 1 }]}
          >
            <Input.TextArea rows={4} placeholder="Write a comment..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );

  const generalTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          General settings
        </Title>
      </Space>
      <Form
        form={generalForm}
        layout="vertical"
        initialValues={{
          title: inventory?.title,
          description: inventory?.description,
          image: inventory?.image,
          isPublic: inventory?.isPublic,
        }}
        onFinish={handleUpdateGeneral}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, min: 3 }]}
        >
          <Input
            placeholder="Inventory title"
            disabled={!editMode || !canAdmin}
          />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <TextArea
              rows={4}
              placeholder="Optional description (supports Markdown)"
              disabled={!editMode || !canAdmin}
            />
            {generalForm.getFieldValue("description") && (
              <Card size="small" title="Preview">
                <ReactMarkdown
                  children={generalForm.getFieldValue("description")}
                  remarkPlugins={[remarkGfm]}
                />
              </Card>
            )}
          </div>
        </Form.Item>
        <Form.Item name="categoryId" label="Category">
          <Select
            placeholder="Select a category"
            disabled={!editMode || !canAdmin}
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
              description: cat.description,
            }))}
            optionRender={(option) => (
              <Space direction="vertical" size={0}>
                <Text>{option.label}</Text>
                {option.data.description && (
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {option.data.description}
                  </Text>
                )}
              </Space>
            )}
          />
        </Form.Item>
        <Form.Item name="image" label="Image">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Upload
                accept="image/*"
                showUploadList={false}
                disabled={!editMode || !canAdmin || imageUploading}
                customRequest={async ({ file, onSuccess, onError }) => {
                  setImageUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await api.post(
                      "/api/inventory/upload-image",
                      fd,
                      {
                        headers: { "Content-Type": "multipart/form-data" },
                      },
                    );
                    const { url } = res.data;
                    if (!url) throw new Error("No URL returned");
                    generalForm.setFieldsValue({ image: url });
                    message.success("Image uploaded successfully");
                    onSuccess("ok");
                  } catch (e) {
                    message.error(e.response?.data?.error || "Upload failed");
                    onError(e);
                  } finally {
                    setImageUploading(false);
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={imageUploading}>
                  {imageUploading ? "Uploading..." : "Upload Image"}
                </Button>
              </Upload>
            </Space>
            {inventory?.image && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={inventory.image}
                  alt="Inventory"
                  style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4 }}
                />
              </div>
            )}
          </Space>
        </Form.Item>
        <Form.Item name="isPublic" label="Visibility" valuePropName="checked">
          <Switch
            checkedChildren="Public"
            unCheckedChildren="Private"
            disabled={!editMode || !canAdmin}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!editMode || !canAdmin}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const customNumbersTab = (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={4} style={{ margin: 0 }}>
            Custom ID
          </Title>
        </Space>
        <Alert
          style={{ marginTop: 16 }}
          message="Custom ID Format"
          description={
            <ul style={{ marginBottom: 0 }}>
              <li>Drag and drop elements to reorder them</li>
              <li>Each element type has specific formatting options</li>
              <li>Preview updates in real-time below</li>
              <li>Maximum 10 elements recommended</li>
            </ul>
          }
          type="info"
          showIcon
        />
        <Divider />
        <div style={{ minHeight: 200 }}>
          {customIdFormat.map((el, idx) => (
            <DraggableElement
              key={idx}
              el={el}
              idx={idx}
              moveElement={(from, to) => {
                const newFormat = [...customIdFormat];
                const [removed] = newFormat.splice(from, 1);
                newFormat.splice(to, 0, removed);
                setCustomIdFormat(newFormat);
              }}
              removeElement={(idx) => {
                setCustomIdFormat(customIdFormat.filter((_, i) => i !== idx));
              }}
            />
          ))}
        </div>
        <Space wrap style={{ marginTop: 16 }}>
          <Button
            disabled={!editMode || !canAdmin || customIdFormat.length >= 10}
            onClick={() =>
              setCustomIdFormat([
                ...customIdFormat,
                { type: "text", value: "-" },
              ])
            }
          >
            Add element
          </Button>
          <Popover
            title="Custom ID Help"
            content={
              <div style={{ maxWidth: 400 }}>
                {elementOptions.map((opt) => (
                  <div key={opt.value} style={{ marginBottom: 8 }}>
                    <Text strong>{opt.label}: </Text>
                    <Text>{opt.description}</Text>
                  </div>
                ))}
                <Divider />
                <Text type="secondary">
                  Tip: Use fixed text elements with dashes or other separators
                  to make IDs more readable
                </Text>
              </div>
            }
          >
            <Button icon={<QuestionCircleOutlined />}>Help</Button>
          </Popover>
          <Button
            type="primary"
            disabled={!editMode || !canAdmin}
            onClick={async () => {
              try {
                const res = await api.put(`/api/inventory/${id}/numbers`, {
                  format: customIdFormat,
                });
                setNextSequence(res.data.nextSequence || nextSequence);
                message.success("Custom ID format saved");
              } catch (e) {
                message.error(e.response?.data?.error || "Save failed");
              }
            }}
          >
            Save
          </Button>
        </Space>
        <Card style={{ marginTop: 16 }} size="small">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space>
              <Text strong>Live Preview:</Text>
              <Tag style={{ fontSize: 16 }}>
                {renderCustomIdPreview(customIdFormat)}
              </Tag>
            </Space>
            <Text type="secondary">
              Next sequence number: {nextSequence}
              (used by sequence elements, increments automatically)
            </Text>
          </Space>
        </Card>
      </Card>
    </DndProvider>
  );

  const fieldsTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          Item fields
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Text type="secondary">
        Define the schema for items in this inventory.
      </Text>
      <Divider />
      <Space direction="vertical" style={{ width: "100%" }}>
        {fields.map((f, idx) => (
          <Space key={f.key} style={{ width: "100%" }}>
            <Select
              style={{ width: 180 }}
              value={f.type}
              onChange={(val) => {
                const copy = [...fields];
                copy[idx] = { ...copy[idx], type: val };
                setFields(copy);
              }}
              options={[
                { value: "text", label: "String" },
                { value: "number", label: "Integer/Number" },
                { value: "boolean", label: "Boolean" },
              ]}
              disabled={!editMode || !canAdmin}
            />
            <Input
              style={{ width: 280 }}
              value={f.label}
              onChange={(e) => {
                const copy = [...fields];
                copy[idx] = { ...copy[idx], label: e.target.value };
                setFields(copy);
              }}
              placeholder="Field name (e.g., Enter your name)"
              disabled={!editMode || !canAdmin}
            />
            <Button
              danger
              disabled={!editMode || !canAdmin}
              onClick={() => setFields(fields.filter((x) => x !== f))}
            >
              Remove
            </Button>
          </Space>
        ))}
        <Space>
          <Button
            disabled={!editMode || !canAdmin}
            onClick={() =>
              setFields([
                ...fields,
                { key: `field_${fields.length + 1}`, label: "", type: "text" },
              ])
            }
          >
            Add field
          </Button>
          <Button
            type="primary"
            disabled={!editMode || !canAdmin}
            onClick={() => handleSaveFields(fields)}
          >
            Save fields
          </Button>
        </Space>
      </Space>
    </Card>
  );

  const accessTab = (
    <Card>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={4} style={{ margin: 0 }}>
          Access settings
        </Title>
      </Space>
      <Form
        layout="vertical"
        onFinish={handleSaveAccess}
        initialValues={{
          isPublic: inventory?.isPublic,
          writeAccess: inventory?.writeAccess?.map((wa) => wa.user?.id) || [],
        }}
      >
        <Form.Item
          name="isPublic"
          label="Public inventory"
          valuePropName="checked"
        >
          <Switch disabled={!editMode || !canAdmin} />
        </Form.Item>

        <Form.Item
          name="writeAccess"
          label={
            <Space>
              <Text>Write Access</Text>
              <Popover content="Users with write access can add, edit and delete items in this inventory.">
                <QuestionCircleOutlined />
              </Popover>
            </Space>
          }
        >
          <Select
            mode="multiple"
            disabled={!editMode || !canAdmin}
            placeholder="Search users..."
            onSearch={searchUsers}
            filterOption={false}
            options={userSearchResults.map((user) => ({
              value: user.id,
              label: (
                <Space>
                  <Text>{user.name}</Text>
                  <Text type="secondary">({user.email})</Text>
                </Space>
              ),
            }))}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!editMode || !canAdmin}
          >
            Save Access Settings
          </Button>
        </Form.Item>
      </Form>

      {inventory?.writeAccess?.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong>Current Write Access:</Text>
          <List
            size="small"
            dataSource={inventory.writeAccess}
            renderItem={(access) => (
              <List.Item>
                <Space>
                  <Text>{access.user?.name}</Text>
                  <Text type="secondary">({access.user?.email})</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}
    </Card>
  );

  const statsTab = (
    <Card>
      <Title level={4}>Statistics</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Statistic title="Items" value={stats.count} />
        </Col>
      </Row>
      <Divider>Numeric fields</Divider>
      {Object.keys(stats.aggregates).length === 0 ? (
        <Text type="secondary">No numeric fields.</Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {Object.entries(stats.aggregates).map(([k, v]) => (
            <Card key={k} size="small" title={k}>
              <Space>
                <Tag>Min: {v.min}</Tag>
                <Tag>Avg: {v.avg.toFixed(2)}</Tag>
                <Tag>Max: {v.max}</Tag>
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>Loading inventory...</Text>
        </Space>
      </div>
    );
  }

  if (!loading && !inventory && !createMode) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Space direction="vertical" align="center">
          <Text type="warning">Inventory not found</Text>
          <Button type="primary" onClick={() => navigate("/inventories")}>
            Back to Inventories
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={3} style={{ margin: 0 }}>
          {createMode ? "Create Inventory" : inventory?.title || "Inventory"}
        </Title>
        {canAdmin && (
          <Button onClick={() => setEditMode((v) => !v)}>
            {editMode ? "View" : "Edit"}
          </Button>
        )}
      </Space>
      <Tabs
        defaultActiveKey={createMode ? "general" : "items"}
        items={
          createMode
            ? [
                { key: "general", label: "General", children: generalTab },
                { key: "fields", label: "Item fields", children: fieldsTab },
              ]
            : [
                { key: "items", label: "Items", children: itemsTab },
                {
                  key: "discussion",
                  label: "Discussion",
                  children: discussionTab,
                },
                { key: "general", label: "General", children: generalTab },
                {
                  key: "numbers",
                  label: "Custom ID",
                  children: customNumbersTab,
                },
                { key: "fields", label: "Item fields", children: fieldsTab },
                { key: "access", label: "Access", children: accessTab },
                { key: "stats", label: "Statistics", children: statsTab },
              ]
        }
      />
    </Space>
  );
}
